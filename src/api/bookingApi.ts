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

export const bookingApi = {
  getMyActiveBookings: async (): Promise<{ success: boolean; data: BookingSummary[] }> => {
    const res = await api.get('/api/bookings/my-active');
    return res.data;
  },
};
