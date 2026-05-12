import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

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

API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Token expired or invalid - redirect to login
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Logging out...");
            localStorage.clear();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default API;
