import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// Configure global Axios defaults for deployment
const apiUrl = import.meta.env.VITE_BACKEND_API_URL || '';
axios.defaults.baseURL = apiUrl.replace(/\/api$/, '');

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
