import React, { useState, useEffect } from 'react';
import { backendApi } from '../utils/api';
import { FaUserEdit, FaRedo, FaHistory, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
    const navigate = useNavigate();
    const { token, role, isAuthenticated } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingLimit, setEditingLimit] = useState(null); // ID of user being edited
    const [newLimit, setNewLimit] = useState('');
    
    // History Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await backendApi.get('/admin/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users. Ensure you have admin privileges.');
            setLoading(false);
            console.error(err);
        }
    };

    useEffect(() => {
        if (isAuthenticated && role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        if (token) {
            fetchUsers();
        }
    }, [isAuthenticated, role, token]);

    const handleUpdateLimit = async (userId) => {
        try {
            await backendApi.put(`/admin/users/${userId}/limit`, 
                { limit: Number(newLimit) }
            );
            setEditingLimit(null);
            setNewLimit('');
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error('Failed to update limit:', err);
            alert('Failed to update limit.');
        }
    };

    const handleResetCount = async (userId) => {
        if (!window.confirm('Are you sure you want to reset the prediction count for this user?')) return;
        try {
            await backendApi.put(`/admin/users/${userId}/reset-count`, {});
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error('Failed to reset count:', err);
            alert('Failed to reset count.');
        }
    };

    const handleViewHistory = async (user) => {
        setSelectedUser(user);
        setLoadingHistory(true);
        setShowHistoryModal(true);
        try {
            const response = await backendApi.get(`/admin/users/${user._id}/history`);
            setUserHistory(response.data);
        } catch (err) {
            console.error('Failed to fetch user history:', err);
            alert('Failed to fetch user history.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedUser(null);
        setUserHistory([]);
    };

    if (loading) return <div className="text-center mt-10">Loading users...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="relative bg-beige-50 min-h-screen overflow-hidden py-14 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 -left-24 w-72 h-72 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
            <div className="absolute top-10 -right-24 w-80 h-80 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-lime-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

            <div className="relative max-w-6xl mx-auto bg-white/85 backdrop-blur rounded-3xl shadow-2xl overflow-hidden border border-emerald-50">
                <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">Admin</p>
                        <h1 className="text-2xl font-extrabold text-emerald-900">User Management</h1>
                    </div>
                    <span className="text-sm text-gray-600">{users.length} Users</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-emerald-50">
                        <thead className="bg-emerald-50/70">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Username</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Predictions Used</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Limit</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-emerald-50">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-emerald-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{user.username}</div>
                                        <div className="text-xs text-gray-500">ID: {user._id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {user.predictionCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {editingLimit === user._id ? (
                                            <div className="flex items-center space-x-2">
                                                <input 
                                                    type="number" 
                                                    value={newLimit} 
                                                    onChange={(e) => setNewLimit(e.target.value)}
                                                    className="w-20 border border-emerald-200 rounded px-2 py-1 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                                <button 
                                                    onClick={() => handleUpdateLimit(user._id)}
                                                    className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={() => { setEditingLimit(null); setNewLimit(''); }}
                                                    className="text-gray-500 hover:text-gray-700 text-xs"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <span>{user.predictionLimit || 5}</span> {/* Default to 5 if undefined in old records */}
                                                <button 
                                                    onClick={() => { setEditingLimit(user._id); setNewLimit(user.predictionLimit || 5); }}
                                                    className="text-emerald-600 hover:text-emerald-800"
                                                    title="Edit Limit"
                                                >
                                                    <FaUserEdit />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center space-x-4">
                                        <button 
                                            onClick={() => handleResetCount(user._id)}
                                            className="text-orange-500 hover:text-orange-700 flex items-center"
                                            title="Reset Usage Count"
                                        >
                                            <FaRedo className="mr-1" /> Reset
                                        </button>
                                        <button 
                                            onClick={() => handleViewHistory(user)}
                                            className="text-indigo-500 hover:text-indigo-700 flex items-center"
                                            title="View History"
                                        >
                                            <FaHistory className="mr-1" /> History
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 transition-opacity" aria-hidden="true" onClick={closeHistoryModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white/95 backdrop-blur rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-emerald-50">
                            <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg leading-6 font-bold text-emerald-900" id="modal-title">
                                                History for {selectedUser?.username}
                                            </h3>
                                            <button onClick={closeHistoryModal} className="text-gray-400 hover:text-gray-600">
                                                <FaTimes size={24} />
                                            </button>
                                        </div>
                                        
                                        <div className="mt-2 max-h-[60vh] overflow-y-auto">
                                            {loadingHistory ? (
                                                <div className="text-center py-4">Loading history...</div>
                                            ) : userHistory.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500">No prediction history found for this user.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {userHistory.map((item) => (
                                                        <div key={item._id} className="border border-emerald-50 rounded-lg p-4 bg-emerald-50/40">
                                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                                <span>{new Date(item.createdAt).toLocaleString()}</span>
                                                                <span>ID: {item._id}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                                                <div>N: {item.nitrogen}, P: {item.phosphorus}, K: {item.potassium}</div>
                                                                <div>
                                                                    pH: {item.ph}, Humidity: {
                                                                        Array.isArray(item.humidity)
                                                                            ? (item.humidity.reduce((a,b)=>Number(a)+Number(b),0)/item.humidity.length).toFixed(1)
                                                                            : Number(item.humidity).toFixed(1)
                                                                    }%
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <h4 className="font-semibold text-xs uppercase tracking-wide text-emerald-700">Predictions:</h4>
                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                    {item.predictions && item.predictions.map((p, idx) => (
                                                                        <span key={idx} className="bg-white text-emerald-700 border border-emerald-100 text-xs px-2 py-1 rounded">
                                                                            {p.crop} ({p.probability}%)
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-emerald-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button 
                                    type="button" 
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-emerald-200 shadow-sm px-4 py-2 bg-white text-base font-semibold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={closeHistoryModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
