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

/**
 * Banner management moved to Admin role.
 * Uses /api/admin/banners (not /api/admin/promotions — that path belongs to
 * AdminPromotionController's paged promotion CRUD).
 */
export const promotionApi = {
  getAll: async (): Promise<PromotionItem[]> => {
    const res = await api.get('/api/admin/banners');
    return res.data.data ?? [];
  },
  create: async (payload: PromotionPayload): Promise<PromotionItem> => {
    const res = await api.post('/api/admin/banners', payload);
    return res.data.data;
  },
  update: async (id: string, payload: PromotionPayload): Promise<PromotionItem> => {
    const res = await api.put(`/api/admin/banners/${id}`, payload);
    return res.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/banners/${id}`);
  },
  /** Upload ảnh banner từ máy → trả URL /uploads/banners/... */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // Không set Content-Type thủ công — axios tự thêm boundary cho multipart
    const res = await api.post('/api/admin/banners/upload-image', formData, {
      timeout: 180000,
    });
    const imageUrl = res.data?.data?.imageUrl;
    if (!imageUrl) {
      throw new Error(res.data?.message || 'Upload không trả về imageUrl');
    }
    return imageUrl;
  },
};

// ── About Page CMS (singleton) ─────────────────────────────────────────────

export interface AboutStatItem {
  value: string;
  label: string;
}

export interface AboutValueItem {
  num: string;
  title: string;
  desc: string;
}

export interface AboutContentPayload {
  heroBrand: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl: string;
  ctaSecondaryText?: string;
  storyEyebrow: string;
  storyTitle: string;
  storyBody1: string;
  storyBody2: string;
  storyImage1Url?: string;
  storyImage2Url?: string;
  storyImage3Url?: string;
  storyCtaText?: string;
  storyCtaUrl?: string;
  valuesEyebrow: string;
  valuesTitle: string;
  contactEyebrow: string;
  contactTitle: string;
  contactIntro: string;
  address: string;
  email: string;
  phone: string;
  workingHours: string;
  stats: AboutStatItem[];
  values: AboutValueItem[];
}

export interface AboutContentItem extends AboutContentPayload {
  id: string;
  updatedAt: string;
}

export const aboutApi = {
  get: async (): Promise<AboutContentItem> => {
    const res = await api.get('/api/admin/about');
    return res.data.data;
  },
  update: async (payload: AboutContentPayload): Promise<AboutContentItem> => {
    const res = await api.put('/api/admin/about', payload);
    return res.data.data;
  },
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/admin/about/upload-image', formData, {
      timeout: 180000,
    });
    const imageUrl = res.data?.data?.imageUrl;
    if (!imageUrl) {
      throw new Error(res.data?.message || 'Upload không trả về imageUrl');
    }
    return imageUrl;
  },
  /** Upload ảnh banner từ máy → trả URL /uploads/banners/... */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // Không set Content-Type thủ công — axios tự thêm boundary cho multipart
    const res = await api.post('/api/manager/promotions/upload-image', formData, {
      timeout: 180000,
    });
    const imageUrl = res.data?.data?.imageUrl;
    if (!imageUrl) {
      throw new Error(res.data?.message || 'Upload không trả về imageUrl');
    }
    return imageUrl;
  },
};
