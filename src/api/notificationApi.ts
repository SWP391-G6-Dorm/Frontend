import api from './axiosInstance';

export interface Notification {
  id: string;
  type: 'BOOKING_CONFIRMED' | 'CONTRACT_GENERATED' | 'PAYMENT_CONFIRMED' | 'MAINTENANCE_UPDATED' | 'SYSTEM';
  title: string;
  content: string;
  isRead: boolean;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export const notificationApi = {
  // Lấy danh sách thông báo phân trang
  getNotifications: async (params?: { page?: number; size?: number; unreadOnly?: boolean }): Promise<ApiResponse<PageResponse<Notification>>> => {
    const res = await api.get('/api/notifications', { params });
    return res.data;
  },

  // Đếm số thông báo chưa đọc
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const res = await api.get('/api/notifications/unread-count');
    return res.data;
  },

  // Đánh dấu tất cả là đã đọc
  markAllRead: async (): Promise<ApiResponse<{ updated: number }>> => {
    const res = await api.patch('/api/notifications/mark-all-read');
    return res.data;
  },

  // Lấy chi tiết thông báo
  getNotificationDetail: async (id: string): Promise<ApiResponse<Notification>> => {
    const res = await api.get(`/api/notifications/${id}`);
    return res.data;
  },

  // Xóa thông báo (MANAGER)
  deleteNotification: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/api/notifications/${id}`);
    return res.data;
  },

  // DEV ONLY: Seed demo notifications
  seedNotifications: async (): Promise<ApiResponse<void>> => {
    const res = await api.get('/api/notifications/test-seed');
    return res.data;
  },
};
