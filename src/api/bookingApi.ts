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
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export const bookingApi = {
  getMyActiveBookings: async (): Promise<{ success: boolean; data: BookingSummary[] }> => {
    const res = await api.get('/api/bookings/my-active');
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
  markCheckedIn: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.patch(`/api/bookings/${id}/check-in`);
    return res.data;
  },
  markCheckedOut: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.patch(`/api/bookings/${id}/check-out`);
    return res.data;
  },
};
