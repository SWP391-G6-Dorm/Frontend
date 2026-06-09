import api from './axiosInstance';

// ── Auth response types ───────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
  /** False for new LANDLORD accounts until admin verifies them */
  landlordVerified: boolean;
  /** True if LANDLORD has already submitted CCCD/identity info */
  identityInfoSubmitted: boolean;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

// ── Request types ─────────────────────────────────────────────────────────────

export type Role = 'TENANT' | 'LANDLORD';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  // LANDLORD-specific (optional for TENANT)
  identityNumber?: string;
  taxCode?: string;
  businessLicense?: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

/** Returned by POST /api/auth/verify-otp */
export interface OtpVerifyResponse {
  role: string;
  landlordVerified: boolean;
  message: string;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  /**
   * Register a new account.
   * On success, backend creates a PENDING user and logs the OTP to console (dev mode).
   */
  register: async (payload: RegisterRequest): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/register', payload);
    return res.data;
  },

  /**
   * Verify the 6-digit OTP received after registration.
   * Returns role + landlordVerified for redirect logic.
   */
  verifyOtp: async (req: OtpVerifyRequest): Promise<ApiResponse<OtpVerifyResponse>> => {
    const res = await api.post('/api/auth/verify-otp', req);
    return res.data;
  },

  /**
   * Resend a new OTP for a PENDING account.
   */
  resendOtp: async (email: string): Promise<ApiResponse> => {
    const res = await api.post('/api/auth/resend-otp', { email });
    return res.data;
  },

  /**
   * Sign in / register via Google OAuth.
   * @param idToken  - Google ID token from the OAuth popup
   * @param role     - Selected role (TENANT | LANDLORD); used only when creating a new account
   * Returns ApiResponse<AuthResponse> so landlordVerified is accessible for redirect logic.
   */
  loginWithGoogle: async (idToken: string, role: Role = 'TENANT'): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/google', { idToken, role });
    return res.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/refresh', refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    });
    return res.data;
  },

  logout: async (refreshToken: string): Promise<ApiResponse<void>> => {
    const res = await api.post('/api/auth/logout', refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    });
    return res.data;
  },

  /**
   * LANDLORD submits CCCD / identity info after Google OAuth registration.
   * Requires valid JWT in Authorization header.
   */
  submitLandlordVerifyInfo: async (payload: {
    identityNumber: string;
    taxCode?: string;
    businessLicense?: string;
  }): Promise<ApiResponse> => {
    const res = await api.put('/api/landlords/me/verify-info', payload);
    return res.data;
  },
};
