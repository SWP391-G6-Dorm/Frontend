import api from './axiosInstance';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FloorSummary {
  id: string;
  propertyId: string;
  floorNumber: number;
  description: string | null;
  roomCount: number;
}

export interface CreateFloorPayload {
  propertyId: string;
  floorNumber: number;
  description?: string;
}

export interface UpdateFloorPayload {
  floorNumber?: number;
  description?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const floorApi = {

  /** SCR-37/38: List floors by property */
  getByProperty: async (propertyId: string): Promise<{ success: boolean; data: FloorSummary[] }> => {
    const res = await api.get('/api/floors', { params: { propertyId } });
    return res.data;
  },

  /** SCR-37/38: Add floor to a property */
  create: async (payload: CreateFloorPayload): Promise<{ success: boolean; data: FloorSummary }> => {
    const res = await api.post('/api/floors', payload);
    return res.data;
  },

  /** SCR-38: Update floor info */
  update: async (id: string, payload: UpdateFloorPayload): Promise<{ success: boolean; data: FloorSummary }> => {
    const res = await api.put(`/api/floors/${id}`, payload);
    return res.data;
  },

  /** SCR-38: Delete floor — only if no rooms exist (409 otherwise) */
  remove: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/api/floors/${id}`);
    return res.data;
  },
};
