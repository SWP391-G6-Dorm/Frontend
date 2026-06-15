import axios from 'axios';
import { authApi } from './authApi';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  timeout: 10000,
});

// Gắn Access Token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý 401 — tự động refresh token rồi retry request gốc
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isUnauthorized = error.response?.status === 401;
    const isNotRetried   = !originalRequest._retry;
    const isNotAuthRoute = !originalRequest.url?.includes('/api/auth/login')
                        && !originalRequest.url?.includes('/api/auth/refresh');

    if (isUnauthorized && isNotRetried && isNotAuthRoute) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await authApi.refreshToken(refreshToken);

          if (res.success && res.data) {
            // Cập nhật tokens trong localStorage
            localStorage.setItem('accessToken',  res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);

            // Đồng bộ Zustand store với data mới
            useAuthStore.getState().login(res.data);

            // Retry request gốc với token mới
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          // Refresh thất bại — đăng xuất và redirect
        }
      }

      // Không có refresh token hoặc refresh thất bại → logout
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
