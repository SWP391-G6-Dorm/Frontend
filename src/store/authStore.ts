import { create } from 'zustand';
import { AuthResponse } from '../api/authApi';

interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('accessToken'),
  role: localStorage.getItem('userRole'),
  login: (data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userRole', data.role);
    set({ isAuthenticated: true, role: data.role });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    set({ isAuthenticated: false, role: null });
  }
}));
