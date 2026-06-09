import axios from 'axios';
import { authApi } from './authApi';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/login' && originalRequest.url !== '/api/auth/refresh') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await authApi.refreshToken(refreshToken);
          if (res.success && res.data) {
             localStorage.setItem('accessToken', res.data.accessToken);
             localStorage.setItem('refreshToken', res.data.refreshToken);
             originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
             return api(originalRequest);
          }
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
