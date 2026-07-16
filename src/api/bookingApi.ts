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
  damageFeeAmount?: number;
  /** ISO datetime — deposit hold window (SCR-20 countdown) */
  holdExpiresAt?: string | null;
  cancelReason?: string | null;
  status: string;
  specialRequests: string;
  createdAt: string;
  isReviewed?: boolean;
  payments?: BookingPaymentInfo[];
}

/** POST /api/v1/bookings (SCR-16) — may return slim or full booking shape */
export interface CreateBookingResponse {
  id?: string;
  bookingId?: string;
  totalAmount: number;
  depositAmount: number;
  status: string;
  holdExpiresAt?: string | null;
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
  createBooking: async (
    payload: CreateBookingPayload,
  ): Promise<{ success: boolean; message: string; data: CreateBookingResponse & Partial<BookingDetailResponse> }> => {
    const res = await api.post('/api/v1/bookings', payload);
    return res.data;
  },
  getMyBookings: async (params: { page?: number; size?: number; status?: string; sort?: string }): Promise<{ success: boolean; data: PageResponse<BookingSummaryResponse> }> => {
    const res = await api.get('/api/v1/bookings/me', { params });
    return res.data;
  },
  getMyBookingDetail: async (id: string): Promise<{ success: boolean; data: BookingDetailResponse; message?: string }> => {
    const res = await api.get(`/api/v1/bookings/me/${id}`);
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

export interface ManagerBookingsParams {
  propertyId?: string;
  page?: number;
  size?: number;
  status?: string;
  search?: string;
  checkInFrom?: string;
  checkInTo?: string;
  sort?: string;
}

export async function fetchManagerBookingsV1(
  params: ManagerBookingsParams,
): Promise<PageResponse<BookingSummaryResponse>> {
  const res = await api.get('/api/v1/manager/bookings', { params });
  return res.data.data;
}

export interface ManagerBookingDetail extends BookingDetailResponse {
  damageFeeAmount?: number;
  canCheckIn?: boolean;
  canCheckOut?: boolean;
  checkOutBlockedReason?: string | null;
}

export async function fetchManagerBookingV1(id: string): Promise<ManagerBookingDetail> {
  const res = await api.get(`/api/v1/manager/bookings/${id}`);
  return res.data.data;
}

/** SCR-37 — multipart check-in (idCardFront, idCardBack, depositCollected). */
export async function checkInBookingV1(
  id: string,
  payload: ManagerCheckInForm,
): Promise<{ status: string }> {
  const formData = new FormData();
  formData.append('idCardFront', payload.idCardFront);
  formData.append('idCardBack', payload.idCardBack);
  formData.append('depositCollected', String(payload.depositCollected));
  formData.append('keyHandedOver', String(payload.keyHandedOver));
  if (payload.note?.trim()) {
    formData.append('note', payload.note.trim());
  }
  // Prefer docs path; singular alias also registered on BE after restart
  const res = await api.post(`/api/v1/manager/bookings/${id}/check-in`, formData);
  return res.data.data;
}

/** SCR-37 — check-out with depositRefunded + keyReturned. */
export async function checkOutBookingV1(
  id: string,
  payload: ManagerCheckOutPayload,
): Promise<{ status: string }> {
  const res = await api.post(`/api/v1/manager/bookings/${id}/check-out`, payload);
  return res.data.data;
}

export interface ManagerCheckInForm {
  idCardFront: File;
  idCardBack: File;
  depositCollected: boolean;
  keyHandedOver: boolean;
  note?: string;
}

export interface ManagerCheckOutPayload {
  depositRefunded?: boolean;
  keyReturned: boolean;
  note?: string;
}
