import axios from 'axios';

export const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => {
  if (!e.response) return 'Cannot reach the server. Is the backend running?';
  return e.response.data?.message || 'Something went wrong. Please try again.';
};

export default api;
