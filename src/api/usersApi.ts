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
