import api from './axiosInstance';
import type { ApiResponse } from './authApi';
import type { AssignedProperty } from './reportApi';

export const managerApi = {
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
  imageUrl?: string | null;
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
