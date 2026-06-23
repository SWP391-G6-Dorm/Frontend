import api from './axiosInstance';

export interface Review {
  id: string;
  bookingId: string;
  roomNumber: string;
  propertyName: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  roomImageUrl?: string;
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

export const reviewApi = {
  // Tạo đánh giá mới (C)
  createReview: async (request: { bookingId: string; rating: number; comment: string }): Promise<ApiResponse<Review>> => {
    const res = await api.post('/api/reviews', request);
    return res.data;
  },

  // Xem danh sách đánh giá của tôi (R)
  getMyReviews: async (params?: { page?: number; size?: number }): Promise<ApiResponse<PageResponse<Review>>> => {
    const res = await api.get('/api/reviews/my', { params });
    return res.data;
  },

  // Cập nhật đánh giá (U)
  updateReview: async (id: string, request: { rating: number; comment: string }): Promise<ApiResponse<Review>> => {
    const res = await api.put(`/api/reviews/${id}`, request);
    return res.data;
  },

  // Xóa đánh giá (D)
  deleteReview: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/api/reviews/${id}`);
    return res.data;
  },
};
