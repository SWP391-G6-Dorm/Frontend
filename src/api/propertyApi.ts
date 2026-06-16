import api from './axiosInstance';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  totalFloors: number;
  totalRooms: number;
  availableRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPageResponse {
  content: PropertySummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreatePropertyPayload {
  name: string;
  address: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdatePropertyPayload {
  name?: string;
  address?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const propertyApi = {

  /** SCR-33: Paginated list with optional search + status filter */
  getAll: async (params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{ success: boolean; data: PropertyPageResponse }> => {
    const res = await api.get('/api/properties', { params });
    return res.data;
  },

  /** SCR-34: Full property detail */
  getById: async (id: string): Promise<{ success: boolean; data: PropertySummary }> => {
    const res = await api.get(`/api/properties/${id}`);
    return res.data;
  },

  /** SCR-35: Create new property */
  create: async (payload: CreatePropertyPayload): Promise<{ success: boolean; data: PropertySummary }> => {
    const res = await api.post('/api/properties', payload);
    return res.data;
  },

  /** SCR-36: Update property */
  update: async (id: string, payload: UpdatePropertyPayload): Promise<{ success: boolean; data: PropertySummary }> => {
    const res = await api.put(`/api/properties/${id}`, payload);
    return res.data;
  },

  /** Delete property (MANAGER only) */
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/api/properties/${id}`);
    return res.data;
  },
};
