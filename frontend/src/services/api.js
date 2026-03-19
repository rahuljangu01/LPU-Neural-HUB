import axios from 'axios';

/**
 * API Service Configuration
 * Backend URL ko .env se uthayega, warna localhost use karega.
 * Team Work ke liye: Sabhi members apne .env mein REACT_APP_API_URL set kar sakte hain.
 */
const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 1. REQUEST INTERCEPTOR: Har request ke sath Token bhejne ke liye
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. RESPONSE INTERCEPTOR: Global Error Handling ke liye
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Agar Token expire ho jaye ya invalid ho (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Logging out...");
            localStorage.clear(); // Saara data clear karein
            window.location.href = '/'; // Seedha Login page par bhej dein
        }
        return Promise.reject(error);
    }
);

export default API;