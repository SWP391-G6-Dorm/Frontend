import api from './axiosInstance';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const res = await api.get('/api/users/me');
  return res.data.data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await api.put('/api/users/me', payload);
  return res.data.data;
}

export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
  await api.patch('/api/users/me/password', payload);
}

// --- MANAGER API ---
export interface CustomerSummaryResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  bookingCount: number;
}

export interface CustomerDetailResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  bookingCount: number;
}

export const usersApi = {
  getAllCustomers: async (params: { page?: number; size?: number; status?: string; search?: string }): Promise<{ success: boolean; data: any }> => {
    const res = await api.get('/api/users/customers', { params });
    return res.data;
  },

  getCustomerDetail: async (id: string): Promise<{ success: boolean; data: CustomerDetailResponse }> => {
    const res = await api.get(`/api/users/customers/${id}`);
    return res.data;
  },

  updateCustomerStatus: async (id: string, status: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/api/users/customers/${id}/status`, { status });
    return res.data;
  }
};
