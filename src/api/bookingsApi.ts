import api from './axiosInstance';

export interface BookingSummary {
  id: string;
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

export interface PagedBookings {
  content: BookingSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function fetchMyBookings(params?: {
  page?: number;
  size?: number;
  status?: string;
  sort?: string;
}): Promise<PagedBookings> {
  const res = await api.get('/api/bookings', { params });
  return res.data.data;
}
