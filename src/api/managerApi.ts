import api from './axiosInstance';
import type { ApiResponse } from './authApi';

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
   * GET /api/manager/dashboard
   * Lấy toàn bộ KPI, chart data và recent bookings cho SCR-32.
   * Yêu cầu role MANAGER.
   */
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const res = await api.get('/api/manager/dashboard');
    return res.data;
  },
};
