import axios from 'axios';

const api = axios.create({
  baseURL: 'https://be-social-media-api-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tambahkan token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;