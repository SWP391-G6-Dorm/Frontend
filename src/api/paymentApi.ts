import api from './axiosInstance';

export interface PaymentSummaryResponse {
  id: string;
  bookingId: string;
  customerName: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface PaymentPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PaymentDetailResponse {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  verifiedByName: string | null;
  verifiedAt: string | null;
  paidAt: string | null;
  verificationNote: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export const paymentApi = {
  getAllPayments: async (params: { page?: number; size?: number; status?: string; search?: string; sort?: string }): Promise<{ success: boolean; data: PageResponse<PaymentSummaryResponse> }> => {
    const res = await api.get('/api/manager/payments', { params });
    return res.data;
  },

  getPaymentDetail: async (id: string): Promise<{ success: boolean; data: PaymentDetailResponse }> => {
    const res = await api.get(`/api/manager/payments/${id}`);
    return res.data;
  },

  verifyPayment: async (id: string, status: 'PAID' | 'FAILED', note: string) => {
    const res = await api.post(`/api/manager/payments/${id}/verify`, { status, note });
    return res.data;
  },

  createVnpayUrl: async (bookingId: string, type: 'DEPOSIT' | 'REMAINING_BALANCE'): Promise<{ success: boolean; data: { paymentUrl: string } }> => {
    const res = await api.post(`/api/v1/payments/vnpay/create-url?bookingId=${bookingId}&type=${type}`);
    return res.data;
  },

  getMyPayments: async (params?: { page?: number; size?: number; status?: string }): Promise<{ success: boolean; message?: string; data: PaymentPageResponse<PaymentSummaryResponse> }> => {
    const res = await api.get('/api/v1/customers/me/payments', { params });
    return res.data;
  },
};
