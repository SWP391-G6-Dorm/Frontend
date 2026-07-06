import api from './axiosInstance';

export interface RoomListItem {
  id: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  area: number;
  status: string;
  primaryImageUrl: string | null;
  propertyId: string;
  propertyName: string;
  floorId?: string;
  floorNumber?: number | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

export interface RoomsPageResponse {
  content: RoomListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PropertyOption {
  id: string;
  name: string;
  address: string;
}

export interface FetchRoomsParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  location?: string;
  propertyId?: string;
  floorId?: string;      // SCR-39: filter by floor
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  checkIn?: string;
  checkOut?: string;
  status?: string;
}

export const ROOM_TYPES = ['Studio', 'Standard', 'Deluxe', 'Suite', 'Villa'] as const;

export function sortToApi(sort: string): string {
  switch (sort) {
    case 'price-asc':
      return 'pricePerNight,asc';
    case 'price-desc':
      return 'pricePerNight,desc';
    default:
      return 'createdAt,desc';
  }
}

/** SCR-07 — public room search (api-spec: GET /api/v1/rooms/search) */
export async function fetchRooms(params: FetchRoomsParams): Promise<RoomsPageResponse> {
  const { capacity, status, ...rest } = params;
  const res = await api.get('/api/v1/rooms/search', {
    params: {
      ...rest,
      guests: capacity,
      status: status ?? 'AVAILABLE',
    },
  });
  return res.data.data;
}

// SCR-39: Manager-only room list with full filter support
export async function fetchRoomsManager(params: FetchRoomsParams): Promise<RoomsPageResponse> {
  const res = await api.get('/api/rooms/manager', { params });
  return res.data.data;
}

// SCR-39: Delete room (only allowed if no active bookings)
export async function deleteRoom(id: string): Promise<void> {
  await api.delete(`/api/rooms/${id}`);
}

export async function fetchPropertyOptions(): Promise<PropertyOption[]> {
  const res = await api.get('/api/properties', {
    params: { page: 0, size: 100, status: 'ACTIVE' },
  });
  return res.data.data.content.map((p: { id: string; name: string; address: string }) => ({
    id: p.id,
    name: p.name,
    address: p.address,
  }));
}

export interface RoomImageInfo {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface RoomReviewInfo {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RoomDetail {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  floorId: string;
  floorNumber: number;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  area: number;
  description: string;
  status: string;
  images: RoomImageInfo[];
  amenities: string[];
  averageRating: number;
  totalReviews: number;
  reviews: RoomReviewInfo[];
  createdAt: string;
}

export async function fetchRoomById(id: string): Promise<RoomDetail> {
  const res = await api.get(`/api/v1/rooms/${id}`);
  return res.data.data;
}

export interface BookedRange {
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
}

export interface RoomCalendarData {
  roomStatus: string;
  bookedRanges: BookedRange[];
}

export async function fetchRoomCalendar(id: string): Promise<RoomCalendarData> {
  const res = await api.get(`/api/v1/rooms/${id}/calendar`);
  return res.data.data;
}

export interface MonthAvailabilityData {
  bookedDates: string[];
  maintenanceDates: string[];
}

/** SCR-09 — month view availability */
export async function fetchRoomMonthAvailability(
  id: string,
  startDate: string,
  endDate: string,
): Promise<MonthAvailabilityData> {
  const res = await api.get(`/api/v1/rooms/${id}/availability`, {
    params: { startDate, endDate },
  });
  return res.data.data;
}

export interface RoomReviewsPage {
  content: RoomReviewInfo[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function fetchRoomReviews(id: string, page = 0, size = 5): Promise<RoomReviewsPage> {
  const res = await api.get(`/api/v1/rooms/${id}/reviews`, { params: { page, size } });
  return res.data.data;
}

export async function fetchPriceStats(): Promise<{ minPrice: number; maxPrice: number }> {
  const res = await api.get('/api/rooms/price-stats');
  return res.data.data;
}

export async function checkRoomAvailability(
  id: string,
  checkIn: string,
  checkOut: string,
): Promise<{ available: boolean; bookedRanges: BookedRange[] }> {
  const res = await api.get(`/api/v1/rooms/${id}/availability`, { params: { checkIn, checkOut } });
  return res.data.data;
}

// ── SCR-40: Booking history for a room (Manager) ─────────────────────────────

export interface RoomBookingSummary {
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

export interface RoomBookingsPage {
  content: RoomBookingSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function fetchRoomBookings(
  roomId: string,
  page = 0,
  size = 5,
): Promise<RoomBookingsPage> {
  const res = await api.get(`/api/rooms/${roomId}/bookings`, {
    params: { page, size, sort: 'checkInDate,desc' },
  });
  return res.data.data;
}

// ── Manager room write operations ─────────────────────────────────────────────

export interface CreateRoomPayload {
  propertyId: string;
  floorId: string;
  roomNumber: string;
  roomType?: string;
  pricePerNight: number;
  capacity: number;
  area?: number;
  description?: string;
}

export interface UpdateRoomPayload {
  roomNumber?: string;
  roomType?: string;
  pricePerNight?: number;
  capacity?: number;
  area?: number | null;
  description?: string | null;
}

export async function createRoom(payload: CreateRoomPayload): Promise<RoomDetail> {
  const res = await api.post('/api/rooms', payload);
  return res.data.data;
}

export async function updateRoom(id: string, payload: UpdateRoomPayload): Promise<RoomDetail> {
  const res = await api.put(`/api/rooms/${id}`, payload);
  return res.data.data;
}

export interface UpdateRoomStatusPayload {
  status: 'AVAILABLE' | 'MAINTENANCE';
  note?: string;
}

export async function updateRoomStatus(
  id: string,
  payload: UpdateRoomStatusPayload,
): Promise<RoomDetail> {
  const res = await api.patch(`/api/rooms/${id}/status`, payload);
  return res.data.data;
}

