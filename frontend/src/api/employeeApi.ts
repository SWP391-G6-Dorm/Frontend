import api from './axiosInstance';
import {
  fetchEmployeeHousekeepingTasks,
  startEmployeeHousekeepingTask,
  finishEmployeeHousekeepingTask,
  type EmployeeHousekeepingTask,
} from './housekeepingApi';

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

export type HousekeepingTask = EmployeeHousekeepingTask;

export async function getHousekeepingTasks(params?: {
  page?: number;
  size?: number;
  status?: string;
}): Promise<{ success: boolean; data: { content: HousekeepingTask[]; totalPages: number } }> {
  const data = await fetchEmployeeHousekeepingTasks(params);
  return { success: true, data: { content: data.content, totalPages: data.totalPages } };
}

export async function updateHousekeepingTaskStatus(
  id: string,
  status: 'IN_PROGRESS' | 'COMPLETED',
): Promise<void> {
  if (status === 'IN_PROGRESS') {
    await startEmployeeHousekeepingTask(id);
  } else {
    await finishEmployeeHousekeepingTask(id);
  }
}

// ── SCR-61: Maintenance Workspace ────────────────────────────────────────────

export interface MaintenanceTicket {
  id: string;
  roomName: string;
  issueType: string;
  description: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
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
): Promise<void> {
  await api.put(`/api/v1/employees/maintenance/${id}/status`, { status });
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
  room?: { id: string; roomNumber?: string };
  roomId?: string;
  roomNumber?: string;
  roomName?: string;
  bookingId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED_WITH_DAMAGE';
  inspectedAt?: string | null;
  createdAt?: string;
  note?: string | null;
}

export async function getEmployeeInspections(params?: {
  page?: number;
  size?: number;
  status?: 'PENDING' | 'IN_PROGRESS';
}): Promise<{ success: boolean; data: { content: InspectionSummary[]; totalPages: number } }> {
  const res = await api.get('/api/v1/employees/inspections', { params });
  return res.data;
}

export async function passInspection(
  id: string,
  body?: { note?: string; checklist?: InspectionChecklist },
): Promise<{ success: boolean; data?: Record<string, never> }> {
  const res = await api.post(`/api/v1/employees/inspections/${id}/pass`, body ?? {});
  return res.data;
}

export async function failInspection(
  id: string,
  body: { note: string; checklist?: InspectionChecklist },
): Promise<{ success: boolean; data?: Record<string, never> }> {
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
  totalCost: number;
  createdAt: string;
}

export async function getEmployeeDamageReports(params?: {
  page?: number;
  size?: number;
}): Promise<{ success: boolean; data: { content: DamageReport[]; totalPages: number } }> {
  const res = await api.get('/api/v1/employees/damage-reports', { params });
  return res.data;
}

export async function createDamageReport(payload: {
  roomId: string;
  items: DamageItem[];
  attachments?: { url: string; type: string }[];
  notes?: string;
}): Promise<{ success: boolean }> {
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
