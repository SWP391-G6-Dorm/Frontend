import api from './axiosInstance';

export interface ContractSummaryResponse {
  id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  roomNumber: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  depositAmount: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
  sentAt: string | null;
}

export interface ContractDetailResponse {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  depositAmount: number;
  totalAmount: number;
  generatedAt: string;
  sentAt: string | null;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  page?: number;
  size?: number;
  pageNumber?: number;
  pageSize?: number;
  totalElements: number;
  totalPages: number;
}

export const contractApi = {
  getAllContracts: async (params: { page?: number; size?: number; status?: string; search?: string; sort?: string }): Promise<{ success: boolean; data: PageResponse<ContractSummaryResponse> }> => {
    const res = await api.get('/api/contracts', { params });
    return res.data;
  },

  /** SCR-21 — Customer my contracts (api-spec: GET /api/v1/customers/me/contracts) */
  getMyContracts: async (params: { page?: number; size?: number; status?: string; search?: string; sort?: string }): Promise<{ success: boolean; data: PageResponse<ContractSummaryResponse> }> => {
    const res = await api.get('/api/v1/customers/me/contracts', { params });
    return res.data;
  },

  getContractDetail: async (id: string): Promise<{ success: boolean; data: ContractDetailResponse }> => {
    const res = await api.get(`/api/contracts/${id}`);
    return res.data;
  },

  getContractByBookingId: async (bookingId: string): Promise<{ success: boolean; data: ContractDetailResponse }> => {
    const res = await api.get(`/api/contracts/booking/${bookingId}`);
    return res.data;
  },

  getContractPdfBlob: async (id: string): Promise<Blob> => {
    const res = await api.get(`/api/v1/contracts/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  },

  downloadContractPdf: async (id: string, filename: string = 'contract.pdf') => {
    const res = await api.get(`/api/v1/contracts/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  resendContractEmail: async (id: string, email?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/api/contracts/${id}/resend`, { email });
    return res.data;
  }
};
