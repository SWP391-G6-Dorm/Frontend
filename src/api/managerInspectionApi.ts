import api from './axiosInstance';

export interface InspectionEmployeeBrief {
  id: string;
  fullName: string;
}

export interface InspectionRoomBrief {
  id: string;
  roomNumber: string;
}

/** SCR-42 — Manager inspection summary (api-spec). */
export interface InspectionSummary {
  id: string;
  room: InspectionRoomBrief;
  bookingId: string;
  assignedEmployee?: InspectionEmployeeBrief | null;
  inspectedBy?: InspectionEmployeeBrief | null;
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
  unassignedOnly?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export async function fetchManagerInspectionsV1(
  params: ManagerInspectionParams,
): Promise<PageResponse<InspectionSummary>> {
  const res = await api.get('/api/v1/managers/inspections', { params });
  return res.data.data;
}

/** SCR-42 — Assign / Reassign inspector. */
export async function assignInspectionInspectorV1(
  inspectionId: string,
  employeeId: string,
): Promise<void> {
  await api.post(`/api/v1/managers/inspections/${inspectionId}/assign`, { employeeId });
}
