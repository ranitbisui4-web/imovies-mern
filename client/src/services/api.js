import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://imovies-api-xy3q.onrender.com/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('imovies_user');
  if (savedUser) {
    const { token } = JSON.parse(savedUser);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
