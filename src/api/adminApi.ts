import api from './axiosInstance';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

export const adminApi = {
  searchUsers: async (params: { page?: number; size?: number; role?: string; status?: string; keyword?: string }) => {
    const res = await api.get('/api/admin/users', { params });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await api.get(`/api/admin/users/${id}`);
    return res.data;
  },

  updateUser: async (id: string, payload: { role: string; status: string }) => {
    const res = await api.put(`/api/admin/users/${id}`, payload);
    return res.data;
  },
};
