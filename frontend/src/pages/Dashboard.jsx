import React, { useState, useEffect } from 'react';
import { backendApi, mlApi } from '../utils/api';

// Mock child component for displaying prediction history
const History = ({ history }) => {
    if (!history.length) {
        return <p className="text-gray-500 text-center mt-8">No predictions made yet. Start by entering climate data above.</p>;
    }

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Prediction History</h3>
            <div className="grid grid-cols-1 gap-8">
                {history.map((item) => (
                    <div key={item._id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        {/* Header Section */}
                        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center flex-wrap gap-2">
                            <span className="text-sm text-emerald-800 font-semibold">
                                Predicted on: {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                ID: {item._id.slice(-6)}
                            </span>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Input Summary */}
                            <div className="lg:col-span-1 space-y-3 border-r lg:border-r-gray-100 lg:pr-6">
                                <h4 className="font-bold text-gray-700 border-b pb-2 mb-2">Input Parameters</h4>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <div className="text-gray-500">Nitrogen:</div><div className="font-medium">{item.nitrogen}</div>
                                    <div className="text-gray-500">Phosphorus:</div><div className="font-medium">{item.phosphorus}</div>
                                    <div className="text-gray-500">Potassium:</div><div className="font-medium">{item.potassium}</div>
                                    <div className="text-gray-500">pH Level:</div><div className="font-medium">{item.ph}</div>
                                    <div className="text-gray-500">Soil Type:</div><div className="font-medium capitalize">{item.soil_type || 'N/A'}</div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Avg Rainfall:</span>
                                        <span className="font-medium">
                                            {Number(item.rainfall).toFixed(1)} mm
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Avg Temp:</span>
                                        <span className="font-medium">
                                            {Array.isArray(item.temperature)
                                                ? (item.temperature.reduce((a, b) => Number(a) + Number(b), 0) / item.temperature.length).toFixed(1)
                                                : Number(item.temperature).toFixed(1)}°C
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Avg Humidity:</span>
                                        <span className="font-medium">
                                            {Number(item.humidity).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Prediction Results */}
                            <div className="lg:col-span-2">
                                <h4 className="font-bold text-emerald-800 border-b pb-2 mb-4">Recommended Crops</h4>
                                {item.predictions && item.predictions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Top Prediction */}
                                        <div className="md:col-span-2 bg-emerald-100 p-4 rounded-lg border border-emerald-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Top Choice</span>
                                                    <h5 className="text-xl font-bold text-emerald-900 capitalize mt-1">{item.predictions[0].crop}</h5>
                                                </div>
                                                <span className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                                    {item.predictions[0].probability}% Match
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-emerald-800">
                                                <div className="bg-white/60 p-2 rounded">
                                                    <span className="block text-xs text-emerald-600 font-semibold">Season</span>
                                                    {item.predictions[0].season || 'N/A'}
                                                </div>
                                                <div className="bg-white/60 p-2 rounded">
                                                    <span className="block text-xs text-emerald-600 font-semibold">Duration</span>
                                                    {item.predictions[0].duration || 'N/A'}
                                                </div>
                                                <div className="bg-white/60 p-2 rounded">
                                                    <span className="block text-xs text-emerald-600 font-semibold">Water</span>
                                                    {item.predictions[0].water_needs || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Secondary Predictions */}
                                        {item.predictions.slice(1).map((pred, idx) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h6 className="font-bold text-gray-700 capitalize">{pred.crop}</h6>
                                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold">{pred.probability}%</span>
                                                </div>
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p>Season: {pred.season || '-'}</p>
                                                    <p>Duration: {pred.duration || '-'}</p>
                                                    <p>Water: {pred.water_needs || '-'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No detailed predictions available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const testCases = [
    { label: 'Rice', nitrogen: 85.03, phosphorus: 34.93, potassium: 36.97, ph: 6.0, humidity: 73.31, rainfall: 189.24, soil_type: 'Alluvial', temperature: [22.7,19.4,28.4,34.0,32.9,35.8,27.4,28.4,29.1,27.7,22.9,16.5] },
    { label: 'Apple', nitrogen: 105.03, phosphorus: 132.18, potassium: 179.34, ph: 7.23, humidity: 56.98, rainfall: 107.57, soil_type: 'Forest', temperature: [16.6,19.5,27.0,37.8,39.2,33.9,29.7,30.8,31.4,27.3,24.3,18.9] },
    { label: 'Coconut', nitrogen: 19.95, phosphorus: 34.44, potassium: 9.30, ph: 6.89, humidity: 91.03, rainfall: 99.03, soil_type: 'Laterite', temperature: [21.8,27.0,25.7,33.6,37.1,32.1,32.7,29.5,30.6,29.6,21.6,20.2] },
    { label: 'Coffee', nitrogen: 111.94, phosphorus: 44.20, potassium: 18.54, ph: 5.79, humidity: 60.83, rainfall: 167.16, soil_type: 'Alluvial', temperature: [0.3,2.9,1.2,12.3,12.8,14.8,15.2,13.1,15.6,11.5,4.2,5.7] },
    { label: 'Mango', nitrogen: 9.51, phosphorus: 10.69, potassium: 13.18, ph: 7.01, humidity: 66.46, rainfall: 157.35, soil_type: 'Red', temperature: [23.8,25.4,27.3,31.2,32.7,29.1,24.6,25.1,25.3,28.5,25.7,25.8] }
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Dashboard = () => {
    const [prediction, setPrediction] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial state: arrays for monthly data, empty strings for others
    const [formData, setFormData] = useState({
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        ph: '',
        // Initialize with 12 empty strings/zeros
        rainfall: '',
        temperature: Array(12).fill(''),
        humidity: '',
        soil_type: 'Alluvial'
    });

    const fetchHistory = async () => {
        try {
            const { data } = await backendApi.get('/history');
            setHistory(data);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMonthlyChange = (index, field, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const populateTestCase = (tc) => {
        setFormData({
            nitrogen: tc.nitrogen,
            phosphorus: tc.phosphorus,
            potassium: tc.potassium,
            ph: tc.ph,
            humidity: tc.humidity,
            rainfall: tc.rainfall,
            temperature: tc.temperature,
            soil_type: tc.soil_type || 'Alluvial'
        });
    };

    const handleCopyAll = (field) => {
        // Copies the value of Jan to all other months
        const val = formData[field][0];
        // Check if value is valid (not empty string, allow 0)
        if (val !== '' && val !== null && val !== undefined) {
            setFormData(prev => ({
                ...prev,
                [field]: Array(12).fill(val)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation for monthly inputs
        const isMonthlyValid = (arr) => arr.every(val => val !== '' && !isNaN(val));
        if (!isMonthlyValid(formData.temperature)) {
            setError("Please fill in all 12 monthly values for Temperature.");
            return;
        }

        // Numeric validation helpers
        const requiredNumeric = [
            { key: 'nitrogen', label: 'Nitrogen' },
            { key: 'phosphorus', label: 'Phosphorus' },
            { key: 'potassium', label: 'Potassium' },
            { key: 'ph', label: 'pH Level' },
            { key: 'rainfall', label: 'Rainfall' },
            { key: 'humidity', label: 'Humidity' },
        ];

        for (const field of requiredNumeric) {
            const value = Number(formData[field.key]);
            if (formData[field.key] === '' || Number.isNaN(value)) {
                setError(`${field.label} must be a number.`);
                return;
            }
        }

        const phValue = Number(formData.ph);
        if (phValue < 0 || phValue > 14) {
            setError("pH must be between 0 and 14.");
            return;
        }

        const humidityValue = Number(formData.humidity);
        if (humidityValue < 0 || humidityValue > 100) {
            setError("Humidity must be between 0 and 100.");
            return;
        }

        if (Number(formData.rainfall) < 0) {
            setError("Rainfall cannot be negative.");
            return;
        }

        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const mlResponse = await mlApi.post('/predict', { ...formData });
            const predictions = mlResponse.data;
            setPrediction(predictions);

            const newHistoryItem = {
                ...formData,
                predictions: predictions,
                _id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            try {
                await backendApi.post('/history',
                    { ...formData, predictions: predictions }
                );
                fetchHistory(); // Refresh to get real ID
            } catch (historyErr) {
                console.error('Failed to save history:', historyErr);
            }

        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred during prediction.');
            console.error('Prediction error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderMonthlyInput = (label, field, unit) => (
        <div className="col-span-1 md:col-span-2 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-emerald-800">{label} ({unit}) - Monthly</label>
                <button
                    type="button"
                    onClick={() => handleCopyAll(field)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                    title="Copy Jan value to all months"
                >
                    Copy Jan to All
                </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {months.map((m, idx) => (
                    <div key={m} className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">{m}</span>
                        <input
                            type="number"
                            value={formData[field][idx]}
                            onChange={(e) => handleMonthlyChange(idx, field, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0"
                            required
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-beige-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
                    <h2 className="text-3xl font-bold text-center text-emerald-700 mb-2">Crop Prediction Dashboard</h2>
                    <p className="text-center text-gray-600 mb-8">Enter monthly climate details for accurate seasonal prediction.</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Section 0: Test Cases prefill */}
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <h3 className="text-sm font-bold text-emerald-800 mb-3">Auto-Fill Test Cases (Expected Output)</h3>
                            <div className="flex flex-wrap gap-2">
                                {testCases.map(tc => (
                                    <button
                                        key={tc.label}
                                        type="button"
                                        onClick={() => populateTestCase(tc)}
                                        className="px-3 py-1.5 bg-white border border-emerald-300 text-sm font-bold text-emerald-700 rounded-md shadow-sm hover:bg-emerald-100 hover:text-emerald-900 transition-colors shadow-emerald-100"
                                    >
                                        Expected: {tc.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 1: Soil Profile */}
                        <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                            <h3 className="text-xl font-bold text-emerald-800 mb-4 border-b border-emerald-200 pb-2">1. Soil Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {['nitrogen', 'phosphorus', 'potassium', 'ph'].map((key) => (
                                    <div key={key}>
                                        <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">
                                            {key === 'ph' ? 'pH Level' : key}
                                        </label>
                                        <input
                                            type="number"
                                            name={key}
                                            id={key}
                                            value={formData[key]}
                                            onChange={handleChange}
                                            className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                            step="any"
                                            min={key === 'ph' ? 0 : undefined}
                                            max={key === 'ph' ? 14 : undefined}
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label htmlFor="soil_type" className="block text-sm font-medium text-gray-700">
                                        Soil Type
                                    </label>
                                    <select
                                        name="soil_type"
                                        id="soil_type"
                                        value={formData.soil_type}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    >
                                        <option value="Alluvial">Alluvial</option>
                                        <option value="Black">Black</option>
                                        <option value="Red">Red</option>
                                        <option value="Laterite">Laterite</option>
                                        <option value="Arid">Arid</option>
                                        <option value="Forest">Forest</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Atmospheric Conditions */}
                        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-4">
                                <h3 className="text-xl font-bold text-blue-800">2. Atmospheric Conditions</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {renderMonthlyInput('Temperature', 'temperature', '°C')}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor='rainfall' className="block text-sm font-medium text-gray-700 capitalize">
                                            Rainfall (mm)
                                        </label>
                                        <input
                                            type="number"
                                            name='rainfall'
                                            id='rainfall'
                                            value={formData['rainfall']}
                                            onChange={handleChange}
                                            className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                            step="any"
                                            min={0}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor='humidity' className="block text-sm font-medium text-gray-700 capitalize">
                                            Humidity (%)
                                        </label>
                                        <input
                                            type="number"
                                            name='humidity'
                                            id='humidity'
                                            value={formData['humidity']}
                                            onChange={handleChange}
                                            className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                            step="any"
                                            min={0}
                                            max={100}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-4">
                            <button
                                type="submit"
                                className="w-full md:w-1/2 inline-flex justify-center py-4 px-8 border border-transparent shadow-xl text-lg font-bold rounded-full text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 transition-all transform hover:scale-105"
                                disabled={loading}
                            >
                                {loading ? 'Analyzing Soil & Climate...' : 'Get Crop Recommendations'}
                            </button>
                        </div>
                    </form>

                    {error && <p className="mt-6 text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

                    {prediction && (
                        <div className="mt-8 text-center bg-emerald-100 p-6 rounded-xl shadow-inner">
                            <h3 className="text-2xl font-semibold text-emerald-800">Top Recommendations</h3>
                            <div className="mt-4">
                                <div className="bg-emerald-200 p-6 rounded-lg shadow-md border border-emerald-300">
                                    <p className="text-3xl font-bold text-emerald-900 capitalize mb-2">{prediction[0].crop}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-emerald-800 mt-4">
                                        <div className="bg-white/50 p-2 rounded">
                                            <span className="block font-bold">Confidence</span>
                                            {prediction[0].probability}%
                                        </div>
                                        <div className="bg-white/50 p-2 rounded">
                                            <span className="block font-bold">Season</span>
                                            {prediction[0].season}
                                        </div>
                                        <div className="bg-white/50 p-2 rounded">
                                            <span className="block font-bold">Duration</span>
                                            {prediction[0].duration}
                                        </div>
                                        <div className="bg-white/50 p-2 rounded">
                                            <span className="block font-bold">Water Needs</span>
                                            {prediction[0].water_needs}
                                        </div>
                                    </div>
                                </div>
                                
                                <h4 className="text-lg font-semibold text-emerald-700 mt-6 mb-3">Alternative Options</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {prediction.slice(1).map((item, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100 hover:shadow-md transition-shadow text-left">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-lg font-bold text-gray-800 capitalize">{item.crop}</p>
                                                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">{item.probability}%</span>
                                            </div>
                                            <div className="text-xs text-gray-600 space-y-1">
                                                <p><span className="font-semibold">Season:</span> {item.season}</p>
                                                <p><span className="font-semibold">Duration:</span> {item.duration}</p>
                                                <p><span className="font-semibold">Water:</span> {item.water_needs}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <History history={history} />
            </div>
        </div>
    );
};

export default Dashboard;
