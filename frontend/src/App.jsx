import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { FaLeaf } from 'react-icons/fa';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import AdminBlog from './pages/AdminBlog';
import AdminUsers from './pages/AdminUsers';
import ProtectedRoute from './components/ProtectedRoute';

// A simple navigation component to be used in the layout
const Navigation = () => {
    const navigate = useNavigate();
    const { role, isAuthenticated, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/login');
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-md fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-emerald-600 flex items-center">
                            <FaLeaf className="mr-2" />
                            CropWizard
                        </Link>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link to="/" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Home</Link>
                        <Link to="/blog" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Blog</Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Dashboard</Link>
                                {role === 'admin' && (
                                    <>
                                        <Link to="/admin/blog" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Admin Blog</Link>
                                        <Link to="/admin/users" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Admin Users</Link>
                                    </>
                                )}
                                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-200">
                                    Signed in
                                </span>
                                <button onClick={handleLogout} className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium transition">Logout</button>
                            </>
                        ) : (
                            <Link to="/login" className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-sm font-medium transition shadow-sm">Login</Link>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMenu} className="text-emerald-700 hover:text-emerald-900 focus:outline-none p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md shadow-lg border-t border-emerald-50">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        <Link to="/" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-md text-base font-medium">Home</Link>
                        <Link to="/blog" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-md text-base font-medium">Blog</Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                                {role === 'admin' && (
                                    <>
                                        <Link to="/admin/blog" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-md text-base font-medium">Admin Blog</Link>
                                        <Link to="/admin/users" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-md text-base font-medium">Admin Users</Link>
                                    </>
                                )}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col space-y-3 px-3">
                                    <span className="inline-flex w-fit items-center px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-200">
                                        Signed in
                                    </span>
                                    <button onClick={handleLogout} className="w-full text-left bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-2 rounded-md text-base font-medium transition">Logout</button>
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-gray-100 px-3">
                                <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-base font-medium transition shadow-sm">Login</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};


function App() {
    return (
        <AuthProvider>
            <Router>
                <Navigation />
                <main className="pt-16"> {/* Add padding to main content to offset fixed navbar */}
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/blog" element={<BlogList />} />
                        <Route path="/blog/:id" element={<BlogDetail />} />
                        
                        {/* Protected Route for Dashboard and Admin */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/admin/blog" element={<AdminBlog />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                        </Route>
                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    );
}

export default App;
