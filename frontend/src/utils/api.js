import axios from 'axios';

// Get base URLs from env or use provided fallbacks
const BACKEND_FALLBACK = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

const ML_FALLBACK = window.location.hostname === 'localhost'
    ? 'http://localhost:5002' 
    : 'https://armaan-siddiqui-crop-wizard.hf.space';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || BACKEND_FALLBACK;
const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || ML_FALLBACK;

// Create axios instances
const backendApi = axios.create({
    baseURL: BACKEND_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const mlApi = axios.create({
    baseURL: ML_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token to backend requests
backendApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export { backendApi, mlApi, BACKEND_BASE_URL, ML_BASE_URL };
