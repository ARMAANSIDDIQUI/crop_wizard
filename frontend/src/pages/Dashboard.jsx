import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Mock child component for displaying prediction history
const History = ({ history }) => {
    if (!history.length) {
        return <p className="text-gray-500">No predictions made yet.</p>;
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Prediction History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                    <div key={item._id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
                        <p className="text-lg font-semibold text-emerald-600 capitalize">{item.predicted_crop}</p>
                        <p className="text-sm text-gray-500">Nitrogen: <span className="font-medium text-gray-700">{item.nitrogen}</span></p>
                        <p className="text-sm text-gray-500">Phosphorus: <span className="font-medium text-gray-700">{item.phosphorus}</span></p>
                        <p className="text-sm text-gray-500">Potassium: <span className="font-medium text-gray-700">{item.potassium}</span></p>
                        <p className="text-sm text-gray-500">pH: <span className="font-medium text-gray-700">{item.ph}</span></p>
                        <p className="text-sm text-gray-500">Rainfall: <span className="font-medium text-gray-700">{item.rainfall} mm</span></p>
                        <p className="text-sm text-gray-500">Temperature: <span className="font-medium text-gray-700">{item.temperature}°C</span></p>
                        <p className="text-xs text-gray-400 mt-4">Predicted on: {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard = () => {
    const [prediction, setPrediction] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        ph: '',
        rainfall: '',
        temperature: '',
    });

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:3000/api/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(data);
        } catch (err) {
            console.error('Failed to fetch history:', err);
            // Don't set a user-facing error for history fetch failure, just log it
        }
    };

    // Fetch history on component mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const token = localStorage.getItem('token');
            // Call to the ML service
            const mlResponse = await axios.post('http://localhost:5000/predict', {
                ...formData
            });

            const predicted_crop = mlResponse.data.crop;
            
            // Save prediction to backend
            const backendResponse = await axios.post('http://localhost:3000/api/history', 
                { ...formData, predicted_crop },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPrediction(predicted_crop);
            fetchHistory(); // Refresh history after new prediction
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
            console.error('Prediction error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-beige-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
                    <h2 className="text-3xl font-bold text-center text-emerald-700 mb-2">Crop Prediction Dashboard</h2>
                    <p className="text-center text-gray-600 mb-8">Enter the details below to get a crop recommendation.</p>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.keys(formData).map((key) => (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key}</label>
                                <input
                                    type="number"
                                    name={key}
                                    id={key}
                                    value={formData[key]}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                />
                            </div>
                        ))}
                        <div className="md:col-span-2 text-center">
                            <button
                                type="submit"
                                className="w-full md:w-auto inline-flex justify-center py-3 px-8 border border-transparent shadow-lg text-sm font-medium rounded-full text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-transform transform hover:scale-105"
                                disabled={loading}
                            >
                                {loading ? 'Thinking...' : 'Predict Crop'}
                            </button>
                        </div>
                    </form>

                    {error && <p className="mt-6 text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
                    
                    {prediction && (
                        <div className="mt-8 text-center bg-emerald-100 p-6 rounded-xl shadow-inner">
                            <h3 className="text-2xl font-semibold text-emerald-800">
                                Recommended Crop: <span className="capitalize font-bold">{prediction}</span>
                            </h3>
                        </div>
                    )}
                </div>

                <History history={history} />
            </div>
        </div>
    );
};

export default Dashboard;