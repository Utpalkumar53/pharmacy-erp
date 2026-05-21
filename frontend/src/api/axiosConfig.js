import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8084/api',
    withCredentials: true,
});

// REQUEST: Attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // ← was Basic
    }
    return config;
}, (error) => Promise.reject(error));

// RESPONSE: Logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const token = localStorage.getItem('token');
        if (error.response && error.response.status === 401 && token) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;