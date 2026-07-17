import api from './axiosInstance';

export type ComplaintStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface ComplaintSummary {
  id: string;
  subject: string;
  customerName: string;
  status: ComplaintStatus;
  createdAt: string;
}

export interface ComplaintDetail {
  id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  customer: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const complaintsApi = {
  getComplaints: async (params?: { page?: number; size?: number; status?: string; search?: string }): Promise<ApiResponse<PageResponse<ComplaintSummary>>> => {
    const res = await api.get('/api/manager/complaints', { params });
    return res.data;
  },

  getComplaintDetail: async (id: string): Promise<ApiResponse<ComplaintDetail>> => {
    const res = await api.get(`/api/manager/complaints/${id}`);
    return res.data;
  },

  updateComplaintStatus: async (id: string, payload: { status: ComplaintStatus; resolutionNotes?: string }): Promise<ApiResponse<ComplaintDetail>> => {
    const res = await api.patch(`/api/complaints/${id}/status`, payload);
    return res.data;
  },

  submitComplaint: async (payload: { subject: string; description: string }): Promise<ApiResponse<ComplaintDetail>> => {
    const res = await api.post('/api/complaints', payload);
    return res.data;
  },

  getMyComplaints: async (): Promise<ApiResponse<ComplaintDetail[]>> => {
    const res = await api.get('/api/complaints');
    return res.data;
  }
};
