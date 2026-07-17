import api from './axiosInstance';

export interface DamageReportSummary {
  id: string;
  bookingId: string;
  roomNumber: string;
  propertyId: string;
  propertyName: string;
  totalEstimatedCost: number;
  approvedAmount?: number | null;
  status: string;
  inspectorName?: string | null;
  approvedByName?: string | null;
  requiresAdminEscalation: boolean;
  note?: string | null;
  createdAt: string;
  /** Hạng mục hư hại (SCR-43 table column). */
  itemsDamaged?: string | null;
}

export interface DamageItem {
  id: string;
  itemName: string;
  description?: string | null;
  estimatedCost: number;
}

export interface DamagePhoto {
  url: string;
  fileName?: string | null;
}

export interface DamageReportDetail extends DamageReportSummary {
  items: DamageItem[];
  photos?: DamagePhoto[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ManagerDamageParams {
  propertyId: string;
  status?: string;
  escalated?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

/** Docs: GET /api/v1/managers/damage-reports (legacy /manager still dual-mapped on BE). */
export async function fetchManagerDamageReportsV1(
  params: ManagerDamageParams,
): Promise<PageResponse<DamageReportSummary>> {
  const res = await api.get('/api/v1/managers/damage-reports', { params });
  return res.data.data;
}

export async function fetchManagerDamageReportDetailV1(
  id: string,
): Promise<DamageReportDetail> {
  const res = await api.get(`/api/v1/managers/damage-reports/${id}`);
  return res.data.data;
}

/** Docs: POST .../approve body { approvedAmount, note }. */
export async function approveDamageReportV1(
  id: string,
  payload: { approvedAmount?: number; note?: string },
): Promise<DamageReportDetail> {
  const res = await api.post(`/api/v1/managers/damage-reports/${id}/approve`, payload);
  return res.data.data;
}

/** Docs: POST .../reject body { note }. */
export async function rejectDamageReportV1(
  id: string,
  payload: { note: string },
): Promise<DamageReportDetail> {
  const res = await api.post(`/api/v1/managers/damage-reports/${id}/reject`, payload);
  return res.data.data;
}
