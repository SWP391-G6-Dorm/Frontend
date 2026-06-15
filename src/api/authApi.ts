import api from './axiosInstance';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Role = 'CUSTOMER' | 'MANAGER';

/** Thông tin user trong response đăng nhập — khớp với backend AuthResponse.UserInfo */
export interface UserInfo {
  id:        string;
  fullName:  string;
  email:     string;
  phone?:    string;
  avatarUrl?: string;
  role:      string;   // 'CUSTOMER' | 'MANAGER'
  status:    string;   // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

/** Response đăng nhập / refresh token — khớp với backend AuthResponse */
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user:         UserInfo;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data:    T;
}

export interface RegisterRequest {
  fullName: string;
  email:    string;
  password: string;
  phone:    string;
}

export interface OtpVerifyRequest {
  email:   string;
  otpCode: string;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  // Đăng nhập email/password
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  // Đăng ký tài khoản mới (mặc định role CUSTOMER)
  register: async (payload: RegisterRequest): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/register', payload);
    return res.data;
  },

  // Xác thực OTP sau khi đăng ký
  verifyOtp: async (req: OtpVerifyRequest): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/verify-otp', req);
    return res.data;
  },

  // Gửi lại OTP
  resendOtp: async (email: string): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/resend-otp', { email });
    return res.data;
  },

  // Đăng nhập bằng Google (ID Token từ frontend)
  loginWithGoogle: async (idToken: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/google', { idToken });
    return res.data;
  },

  // Refresh access token — gửi JSON object { refreshToken } theo backend RefreshTokenRequest
  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/refresh', { refreshToken });
    return res.data;
  },

  // Đăng xuất — gửi JSON object { refreshToken } theo backend RefreshTokenRequest
  logout: async (refreshToken: string): Promise<ApiResponse<void>> => {
    const res = await api.post('/api/auth/logout', { refreshToken });
    return res.data;
  },

  // Quên mật khẩu
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/forgot-password', { email });
    return res.data;
  },

  // Đặt lại mật khẩu — backend ResetPasswordRequest cần email + otpCode + newPassword
  resetPassword: async (email: string, otpCode: string, newPassword: string): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/reset-password', { email, otpCode, newPassword });
    return res.data;
  },
};
