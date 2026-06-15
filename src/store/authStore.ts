import { create } from 'zustand';
import { AuthResponse } from '../api/authApi';

// Trạng thái xác thực người dùng — lưu vào localStorage để giữ phiên
interface AuthState {
  isAuthenticated: boolean;
  role:      string | null;  // 'CUSTOMER' | 'MANAGER'
  userId:    string | null;
  fullName:  string | null;
  email:     string | null;
  phone:     string | null;
  avatarUrl: string | null;

  login:         (data: AuthResponse) => void;
  logout:        () => void;
  updateProfile: (data: { fullName?: string; avatarUrl?: string; phone?: string }) => void;
}

const STORAGE_KEYS = ['accessToken', 'refreshToken', 'userRole', 'userId', 'fullName', 'userEmail', 'userPhone', 'avatarUrl'] as const;

export const useAuthStore = create<AuthState>((set) => ({
  // Khôi phục state từ localStorage khi load lại trang
  isAuthenticated: !!localStorage.getItem('accessToken'),
  role:      localStorage.getItem('userRole'),
  userId:    localStorage.getItem('userId'),
  fullName:  localStorage.getItem('fullName'),
  email:     localStorage.getItem('userEmail'),
  phone:     localStorage.getItem('userPhone'),
  avatarUrl: localStorage.getItem('avatarUrl'),

  login: (data: AuthResponse) => {
    // Persist tokens và thông tin user vào localStorage
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userRole',     data.user.role);
    localStorage.setItem('userId',       data.user.id       ?? '');
    localStorage.setItem('fullName',     data.user.fullName ?? '');
    localStorage.setItem('userEmail',    data.user.email    ?? '');
    localStorage.setItem('userPhone',    data.user.phone    ?? '');
    localStorage.setItem('avatarUrl',    data.user.avatarUrl ?? '');

    set({
      isAuthenticated: true,
      role:      data.user.role,
      userId:    data.user.id        ?? null,
      fullName:  data.user.fullName  ?? null,
      email:     data.user.email     ?? null,
      phone:     data.user.phone     ?? null,
      avatarUrl: data.user.avatarUrl ?? null,
    });
  },

  logout: () => {
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    set({
      isAuthenticated: false,
      role:      null,
      userId:    null,
      fullName:  null,
      email:     null,
      phone:     null,
      avatarUrl: null,
    });
  },

  // Cập nhật profile mà không cần logout/login lại
  updateProfile: (data) => {
    if (data.fullName  !== undefined) localStorage.setItem('fullName',  data.fullName);
    if (data.avatarUrl !== undefined) localStorage.setItem('avatarUrl', data.avatarUrl);
    if (data.phone     !== undefined) localStorage.setItem('userPhone', data.phone);

    set((prev) => ({
      fullName:  data.fullName  !== undefined ? data.fullName  : prev.fullName,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : prev.avatarUrl,
      phone:     data.phone     !== undefined ? data.phone     : prev.phone,
    }));
  },
}));
