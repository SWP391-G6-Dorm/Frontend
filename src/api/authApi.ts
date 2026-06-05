import api from './axiosInstance';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/google', { idToken });
    return res.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/refresh', refreshToken, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return res.data;
  }
};
