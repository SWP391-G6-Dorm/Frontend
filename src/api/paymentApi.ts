import api from './axiosInstance';

export interface PaymentReceiptInfo {
  fileUrl: string;
}

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
  receipt?: PaymentReceiptInfo | null;
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
  orderRef?: string | null;
  gatewayTransactionId?: string | null;
  gatewayResponseCode?: string | null;
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
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ManagerPaymentsParams {
  propertyId?: string;
  page?: number;
  size?: number;
  status?: string;
  type?: string;
  method?: string;
  search?: string;
  sort?: string;
}

/** SCR-36 — canonical path per docs: /api/v1/managers/payments */
const MANAGER_PAYMENTS_BASE = '/api/v1/managers/payments';

export async function fetchManagerPaymentsV1(
  params: ManagerPaymentsParams,
): Promise<PageResponse<PaymentSummaryResponse>> {
  const res = await api.get(MANAGER_PAYMENTS_BASE, { params });
  return res.data.data;
}

export const paymentApi = {
  getPaymentDetail: async (id: string): Promise<{ success: boolean; data: PaymentDetailResponse }> => {
    const res = await api.get(`${MANAGER_PAYMENTS_BASE}/${id}`);
    return res.data;
  },

  verifyPayment: async (id: string, status: 'PAID' | 'FAILED', note: string) => {
    const res = await api.post(`${MANAGER_PAYMENTS_BASE}/${id}/verify`, { status, note });
    return res.data;
  },

  /**
   * SCR-20 deposit: POST /api/v1/payments/vnpay { bookingId }
   * Remaining balance: legacy create-url with type query (unchanged until remaining screen API is aligned).
   */
  createVnpayUrl: async (
    bookingId: string,
    type: 'DEPOSIT' | 'REMAINING_BALANCE' | 'DAMAGE_FEE' = 'DEPOSIT',
  ): Promise<{ success: boolean; data: { paymentUrl: string }; message?: string }> => {
    if (type === 'DEPOSIT') {
      const res = await api.post('/api/v1/payments/vnpay', { bookingId });
      return res.data;
    }
    const res = await api.post(`/api/v1/payments/vnpay/create-url?bookingId=${bookingId}&type=${type}`);
    return res.data;
  },

  getMyPayments: async (params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data: PaymentPageResponse<PaymentSummaryResponse>;
  }> => {
    const res = await api.get('/api/v1/customers/me/payments', { params });
    return res.data;
  },
};
