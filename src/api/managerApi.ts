import api from './axiosInstance';
import type { ApiResponse } from './authApi';
import type { AssignedProperty } from './reportApi';

// ── Dashboard Types ────────────────────────────────────────────────────────────

export interface DashboardKpis {
  totalProperties: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  bookingsThisMonth: number;
  checkInsToday: number;
  checkOutsToday: number;
  monthlyRevenue: number;
}

export interface RevenueDataPoint {
  month: string;    // "2026-01"
  revenue: number;
}

export interface OccupancyData {
  available: number;
  occupied: number;
  maintenance: number;
  pendingDeposit: number;
}

export interface BookingTrendPoint {
  week: string;         // "2026-W22"
  newBookings: number;
  cancellations: number;
}

export interface RecentBooking {
  id: string;
  customerName: string;
  roomNumber: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  revenueChartData: RevenueDataPoint[];
  occupancyData: OccupancyData;
  bookingTrendData: BookingTrendPoint[];
  recentBookings: RecentBooking[];
}

// ── Manager API ────────────────────────────────────────────────────────────────

export const managerApi = {
  /**
   * @deprecated SCR-27 — dùng reportApi.getPropertyKpis + getMyAssignedProperties thay thế.
   * GET /api/manager/dashboard
   */
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const res = await api.get('/api/manager/dashboard');
    return res.data;
  },

  /** SCR-27 — Property ACTIVE được gán cho Manager */
  getMyAssignedProperties: async (): Promise<ApiResponse<AssignedProperty[]>> => {
    const res = await api.get('/api/v1/managers/me/properties');
    return res.data;
  },
};

// ── Promotion (Banner) Management ──────────────────────────────────────────

export interface PromotionItem {
  id: string;
  subtitle: string;
  title: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  colorTheme: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionPayload {
  subtitle: string;
  title: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  colorTheme: string;
  isActive: boolean;
  sortOrder: number;
}

export const promotionApi = {
  getAll: async (): Promise<PromotionItem[]> => {
    const res = await api.get('/api/manager/promotions');
    return res.data.data ?? [];
  },
  create: async (payload: PromotionPayload): Promise<PromotionItem> => {
    const res = await api.post('/api/manager/promotions', payload);
    return res.data.data;
  },
  update: async (id: string, payload: PromotionPayload): Promise<PromotionItem> => {
    const res = await api.put(`/api/manager/promotions/${id}`, payload);
    return res.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/manager/promotions/${id}`);
  },
};
