import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// A simple navigation component to be used in the layout
const Navigation = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-md fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-emerald-600 flex items-center">
                            <span className="mr-2">🌿</span>
                            CropWizard
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                            {token ? (
                                <>
                                    <Link to="/dashboard" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                                    <button onClick={handleLogout} className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium">Logout</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};


function App() {
    return (
        <Router>
            <Navigation />
            <main className="pt-16"> {/* Add padding to main content to offset fixed navbar */}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    
                    {/* Protected Route for Dashboard */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                </Routes>
            </main>
        </Router>
    );
}

export default App;
