import api from './axiosInstance';

export interface BookingSummary {
  bookingId: string;
  roomId: string;
  roomNumber: string;
  propertyId: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export interface BookingSummaryResponse {
  id: string;
  customerName: string;
  customerEmail: string;
  roomNumber: string;
  roomType: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  isReviewed?: boolean;
}

export interface BookingPaymentInfo {
  id: string;
  type: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
}

export interface BookingDetailResponse {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  status: string;
  specialRequests: string;
  createdAt: string;
  isReviewed?: boolean;
  payments?: BookingPaymentInfo[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateBookingPayload {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  specialRequests?: string;
}

export interface CancellationPreview {
  daysUntilCheckIn: number;
  refundPercent: number;
  refundAmount: number;
  forfeitAmount: number;
  policyText: string;
}

export const bookingApi = {
  getMyActiveBookings: async (): Promise<{ success: boolean; data: BookingSummary[] }> => {
    const res = await api.get('/api/bookings/my-active');
    return res.data;
  },
  createBooking: async (payload: CreateBookingPayload): Promise<{ success: boolean; message: string; data: BookingDetailResponse }> => {
    const res = await api.post('/api/v1/bookings', payload);
    return res.data;
  },
  getMyBookings: async (params: { page?: number; size?: number; status?: string; sort?: string }): Promise<{ success: boolean; data: PageResponse<BookingSummaryResponse> }> => {
    const res = await api.get('/api/v1/bookings/me', { params });
    return res.data;
  },
  getAllBookings: async (params: { page?: number; size?: number; status?: string; search?: string; sort?: string }): Promise<{ success: boolean; data: PageResponse<BookingSummaryResponse> }> => {
    const res = await api.get('/api/bookings', { params });
    return res.data;
  },
  getBookingDetail: async (id: string): Promise<{ success: boolean; data: BookingDetailResponse }> => {
    const res = await api.get(`/api/bookings/${id}`);
    return res.data;
  },
  getMyBookingDetail: async (id: string): Promise<{ success: boolean; data: BookingDetailResponse }> => {
    const res = await api.get(`/api/v1/bookings/me/${id}`);
    return res.data;
  },
  markCheckedIn: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.patch(`/api/bookings/${id}/check-in`);
    return res.data;
  },
  markCheckedOut: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.patch(`/api/bookings/${id}/check-out`);
    return res.data;
  },
  cancelBooking: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.patch(`/api/bookings/${id}/cancel`);
    return res.data;
  },
  getCancellationPreview: async (id: string): Promise<{ success: boolean; data: CancellationPreview }> => {
    const res = await api.get(`/api/v1/bookings/me/${id}/cancel/preview`);
    return res.data;
  },
  cancelMyBooking: async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/api/v1/bookings/me/${id}/cancel`, reason ? { reason } : {});
    return res.data;
  },
};
