import api from './axiosInstance';

// ── SCR-59: Employee Dashboard KPIs ─────────────────────────────────────────

export interface EmployeeKpis {
  pendingHousekeeping: number;
  pendingMaintenance: number;
  pendingInspections: number;
}

export async function getEmployeeKpis(): Promise<{ success: boolean; data: EmployeeKpis }> {
  const res = await api.get('/api/v1/employee/kpis');
  return res.data;
}

// ── SCR-60: Housekeeping Workspace ───────────────────────────────────────────

export interface HousekeepingTask {
  id: string;
  roomName?: string;
  roomNumber?: string;
  floorName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedAt?: string;
}

export async function getHousekeepingTasks(params?: {
  page?: number;
  size?: number;
  status?: string;
}): Promise<{ success: boolean; data: { content: HousekeepingTask[]; totalPages: number } }> {
  const res = await api.get('/api/v1/employees/housekeeping', { params });
  return res.data;
}

export async function updateHousekeepingTaskStatus(
  id: string,
  status: 'IN_PROGRESS' | 'COMPLETED',
): Promise<void> {
  if (status === 'IN_PROGRESS') {
    await api.post(`/api/v1/employees/housekeeping/${id}/start`);
  } else {
    await api.post(`/api/v1/employees/housekeeping/${id}/finish`);
  }
}

// ── SCR-61: Maintenance Workspace ────────────────────────────────────────────

export interface MaintenanceTicket {
  id: string;
  roomName: string;
  /** Ticket title (free text), not a category enum. */
  issueType: string;
  description: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionNote?: string | null;
  assignedAt?: string;
  resolvedAt?: string | null;
}

export async function getEmployeeMaintenanceTickets(params?: {
  page?: number;
  size?: number;
  status?: string;
}): Promise<{ success: boolean; data: { content: MaintenanceTicket[]; totalPages: number } }> {
  const res = await api.get('/api/v1/employees/maintenance', { params });
  return res.data;
}

export async function updateMaintenanceTicketStatus(
  id: string,
  status: 'IN_PROGRESS' | 'RESOLVED',
  resolutionNote?: string,
): Promise<{ success: boolean; data: MaintenanceTicket }> {
  const res = await api.put(`/api/v1/employees/maintenance/${id}/status`, {
    status,
    ...(resolutionNote != null && resolutionNote !== '' ? { resolutionNote } : {}),
  });
  return res.data;
}

// ── SCR-62: Room Inspection Hub ──────────────────────────────────────────────

export interface InspectionChecklist {
  tv: boolean;
  minibar: boolean;
  ac: boolean;
  bathroom: boolean;
  beds: boolean;
}

export interface InspectionSummary {
  id: string;
  roomId: string;
  roomNumber?: string;
  roomName?: string;
  bookingId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED_WITH_DAMAGE';
  createdAt?: string;
  note?: string | null;
}

export async function getEmployeeInspections(params?: {
  page?: number;
  size?: number;
}): Promise<{ success: boolean; data: { content: InspectionSummary[]; totalPages: number } }> {
  const res = await api.get('/api/v1/employees/inspections', { params });
  return res.data;
}

export async function passInspection(
  id: string,
  body?: { notes?: string; checklist?: InspectionChecklist },
): Promise<{ success: boolean; data?: InspectionSummary }> {
  const res = await api.post(`/api/v1/employees/inspections/${id}/pass`, body ?? {});
  return res.data;
}

export async function failInspection(
  id: string,
  body: { notes: string; checklist?: InspectionChecklist },
): Promise<{ success: boolean; data?: InspectionSummary }> {
  const res = await api.post(`/api/v1/employees/inspections/${id}/fail`, body);
  return res.data;
}

// ── SCR-63/64: Damage Reports ────────────────────────────────────────────────

export interface DamageItem {
  name: string;
  estimatedCost: number;
}

export interface DamageReport {
  id: string;
  roomName: string;
  status: string;
  items: DamageItem[];
  itemCount?: number;
  totalCost: number;
  requiresAdminEscalation?: boolean;
  note?: string | null;
  createdAt: string;
}

export async function getEmployeeDamageReports(params?: {
  page?: number;
  size?: number;
}): Promise<{ success: boolean; data: { content: DamageReport[]; totalPages: number } }> {
  const res = await api.get('/api/v1/employees/damage-reports', { params });
  return res.data;
}

/** SCR-64 — Rooms with FAILED inspection that still need a damage report. */
export interface EligibleDamageRoom {
  roomId: string;
  roomNumber: string;
  inspectionId: string;
  inspectedAt?: string;
}

export async function getEligibleDamageRooms(): Promise<{
  success: boolean;
  data: EligibleDamageRoom[];
}> {
  const res = await api.get('/api/v1/employees/damage-reports/eligible-rooms');
  return res.data;
}

/** SCR-64 — Upload evidence photos; returns /uploads/damage/... URLs. */
export async function uploadDamagePhotos(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await api.post('/api/v1/employees/damage-reports/photos', formData, {
    timeout: 60_000,
  });
  return res.data.data ?? [];
}

export async function createDamageReport(payload: {
  roomId: string;
  inspectionId?: string;
  items: DamageItem[];
  attachments: { url: string; type: string }[];
  notes?: string;
}): Promise<{ success: boolean; data?: DamageReport }> {
  const res = await api.post('/api/v1/employees/damage-reports', payload);
  return res.data;
}

// ── SCR-65: Employee Rooms ─────────────────────────────────────────────────

export interface EmployeeRoom {
  id: string;
  name?: string;
  roomNumber?: string;
  floorName?: string;
  status: string;
}

export async function getEmployeeRooms(params?: {
  page?: number;
  size?: number;
}): Promise<{ success: boolean; data: { content: EmployeeRoom[] } }> {
  const res = await api.get('/api/v1/employees/rooms', { params });
  return res.data;
}
