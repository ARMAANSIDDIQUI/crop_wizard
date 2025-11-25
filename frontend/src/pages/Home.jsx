import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="relative bg-beige-50 min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Background decorative shapes */}
            <div className="absolute top-0 -left-1/4 w-96 h-96 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-1/4 w-96 h-96 bg-lime-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 text-center p-8 max-w-3xl">
                <h1 className="text-5xl md:text-7xl font-extrabold text-emerald-800 mb-4 tracking-tight">
                    Welcome to <span className="text-emerald-600">CropWizard</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Your smart farming assistant. Get intelligent crop recommendations based on soil and weather conditions to maximize your yield.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/dashboard"
                        className="w-full sm:w-auto bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-700 transition-transform transform hover:scale-105"
                    >
                        Get Started
                    </Link>
                    <Link
                        to="/login"
                        className="w-full sm:w-auto bg-white text-emerald-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105"
                    >
                        Login
                    </Link>
                </div>
            </div>
            
            {/* Adding some feature cards below the fold */}
            <div className="relative z-10 w-full max-w-5xl mx-auto mt-24 px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-emerald-700 mb-2">AI-Powered Predictions</h3>
                        <p className="text-gray-600">Leverages a sophisticated machine learning model to provide accurate crop suggestions.</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-emerald-700 mb-2">Personalized History</h3>
                        <p className="text-gray-600">Keep track of all your past predictions to see trends and insights over time.</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-emerald-700 mb-2">Easy to Use</h3>
                        <p className="text-gray-600">A simple and intuitive interface designed for farmers and agricultural experts alike.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;

// Add CSS for animations if not using a utility library that provides them
// This can be in your main CSS file (e.g., index.css)
/*
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: -2s;
}
.animation-delay-4000 {
  animation-delay: -4s;
}
*/