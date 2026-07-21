import api from './axiosInstance';


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

export interface PropertyDetailStats {
  totalFloors: number;
  totalRooms: number;
  availableRooms: number;
  pendingDepositRooms: number;
  reservedRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
}

export interface PropertyFloorSummary {
  id: string;
  floorNumber: number;
  description: string | null;
  roomCount: number;
  availableCount: number;
}

export interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  stats: PropertyDetailStats;
  floors: PropertyFloorSummary[];
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

// ── Structure Tree (SCR-37) ──────────────────────────────────────────────────

export interface RoomNode {
  id: string;
  roomNumber: string;
  roomType: string;
  status: 'AVAILABLE' | 'PENDING_DEPOSIT' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';
  pricePerNight?: number;
  capacity?: number;
}

export interface FloorNode {
  id: string;
  floorNumber: number;
  description: string | null;
  roomCount?: number;
  rooms: RoomNode[];
}

export interface PropertyStructure {
  propertyId: string;
  propertyName: string;
  floors: FloorNode[];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const propertyApi = {

  /** FR-06: Paginated list of assigned properties (Manager, read-only) */
  getAll: async (params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{ success: boolean; data: PropertyPageResponse }> => {
    const res = await api.get('/api/properties', { params });
    return res.data;
  },

  /** Property summary by id */
  getById: async (id: string): Promise<{ success: boolean; data: PropertySummary }> => {
    const res = await api.get(`/api/properties/${id}`);
    return res.data;
  },

  /** FR-06: Rich property detail (stats + floors) — Manager assigned only */
  getDetail: async (id: string): Promise<{ success: boolean; data: PropertyDetail }> => {
    const res = await api.get(`/api/properties/${id}/detail`);
    return res.data;
  },

  /** @deprecated Manager write removed (FR-06). Use Admin property APIs. */
  create: async (payload: CreatePropertyPayload): Promise<{ success: boolean; data: PropertySummary }> => {
    const res = await api.post('/api/properties', payload);
    return res.data;
  },

  /** @deprecated Manager write removed (FR-06). Use Admin property APIs. */
  update: async (id: string, payload: UpdatePropertyPayload): Promise<{ success: boolean; data: PropertySummary }> => {
    const res = await api.put(`/api/properties/${id}`, payload);
    return res.data;
  },

  /** @deprecated Manager write removed (FR-06). Use Admin property APIs. */
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/api/properties/${id}`);
    return res.data;
  },

  /** @deprecated SCR-28 — dùng getStructureTree thay thế */
  getStructure: async (id: string): Promise<{ success: boolean; data: PropertyStructure }> => {
    const res = await api.get(`/api/properties/${id}/structure`);
    return res.data;
  },

  /** SCR-28 — Property → Floor → Room tree (v1, manager-scoped) */
  getStructureTree: async (id: string): Promise<{ success: boolean; data: PropertyStructure }> => {
    const res = await api.get(`/api/v1/properties/${id}/tree`);
    return res.data;
  },
};
