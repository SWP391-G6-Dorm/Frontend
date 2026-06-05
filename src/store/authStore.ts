import { create } from 'zustand';
import { AuthResponse } from '../api/authApi';

interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  landlordVerified: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('accessToken'),
  role: localStorage.getItem('userRole'),
  landlordVerified: localStorage.getItem('landlordVerified') === 'true',

  login: (data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('landlordVerified', String(data.landlordVerified ?? false));
    set({
      isAuthenticated: true,
      role: data.role,
      landlordVerified: data.landlordVerified ?? false,
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('landlordVerified');
    set({ isAuthenticated: false, role: null, landlordVerified: false });
  },
}));
