import api from './axiosInstance';

export interface InspectionSummary {
  id: string;
  roomId: string;
  roomNumber: string;
  propertyId: string;
  propertyName: string;
  bookingId: string;
  inspectorId?: string | null;
  inspectorName?: string | null;
  status: string;
  note?: string | null;
  inspectedAt?: string | null;
  createdAt: string;
  inspectionDurationMinutes?: number | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ManagerInspectionParams {
  propertyId: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export async function fetchManagerInspectionsV1(
  params: ManagerInspectionParams,
): Promise<PageResponse<InspectionSummary>> {
  const res = await api.get('/api/v1/manager/inspections', { params });
  return res.data.data;
}
