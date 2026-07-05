/**
 * employeeApi.ts — REST API calls for Employee Portal (SCR-59 to SCR-65)
 * Source of truth: docs/api-spec-by-screen.md
 */
import api from './axiosInstance';

// ── Shared types ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EmployeeKpis {
  pendingHousekeeping: number;
  pendingMaintenance: number;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomName: string;
  roomNumber?: string;
  floorName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedAt: string;
  completedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  roomName: string;
  issueType: string;
  description: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  assignedAt: string;
  resolvedAt?: string;
}

export interface InspectionChecklist {
  tv: boolean;
  minibar: boolean;
  ac: boolean;
  bathroom: boolean;
  beds: boolean;
  [key: string]: boolean;
}

export interface RoomInspectionPayload {
  roomId: string;
  status: 'PASS' | 'FAIL';
  checklist: InspectionChecklist;
  notes?: string;
}

export interface DamageItem {
  name: string;
  estimatedCost: number;
}

export interface DamageReport {
  id: string;
  roomId: string;
  roomName: string;
  items: DamageItem[];
  totalCost: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'ESCALATED' | 'REJECTED';
  attachments: { url: string; type: string }[];
  createdAt: string;
}

export interface EmployeeRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'PENDING_CLEANING' | 'CLEANING_IN_PROGRESS' | 'RESERVED' | 'PENDING_DEPOSIT' | 'OUT_OF_SERVICE';
  capacity: number;
  pricePerNight: number;
  floorName?: string;
}


// ── SCR-59: Employee Dashboard KPIs ───────────────────────────────────────────

/** GET /api/employee/kpis */
export async function getEmployeeKpis(): Promise<{ success: boolean; data: EmployeeKpis }> {
  const res = await api.get('/api/employee/kpis');
  return res.data;
}

// ── SCR-60: Housekeeping Workspace ────────────────────────────────────────────

/** GET /api/employee/housekeeping-tasks */
export async function getHousekeepingTasks(params?: { page?: number; size?: number; status?: string }): Promise<{ success: boolean; data: PageResponse<HousekeepingTask> }> {
  const res = await api.get('/api/employee/housekeeping-tasks', { params });
  return res.data;
}

/** PATCH /api/employee/housekeeping-tasks/{id}/status */
export async function updateHousekeepingTaskStatus(
  id: string,
  status: 'IN_PROGRESS' | 'COMPLETED'
): Promise<{ success: boolean }> {
  const res = await api.patch(`/api/employee/housekeeping-tasks/${id}/status`, { status });
  return res.data;
}

// ── SCR-61: Maintenance Workspace ─────────────────────────────────────────────

/** GET /api/employee/maintenance-tickets */
export async function getEmployeeMaintenanceTickets(params?: { page?: number; size?: number; status?: string }): Promise<{ success: boolean; data: PageResponse<MaintenanceTicket> }> {
  const res = await api.get('/api/employee/maintenance-tickets', { params });
  return res.data;
}

/** PATCH /api/employee/maintenance-tickets/{id}/status */
export async function updateMaintenanceTicketStatus(
  id: string,
  status: 'IN_PROGRESS' | 'RESOLVED'
): Promise<{ success: boolean }> {
  const res = await api.patch(`/api/employee/maintenance-tickets/${id}/status`, { status });
  return res.data;
}

// ── SCR-62: Room Inspection Hub ────────────────────────────────────────────────

/** POST /api/employee/room-inspections */
export async function submitRoomInspection(payload: RoomInspectionPayload): Promise<{ success: boolean }> {
  const res = await api.post('/api/employee/room-inspections', payload);
  return res.data;
}

// ── SCR-63: Damage Report List ─────────────────────────────────────────────────

/** GET /api/employee/damage-reports */
export async function getEmployeeDamageReports(params?: { page?: number; size?: number }): Promise<{ success: boolean; data: PageResponse<DamageReport> }> {
  const res = await api.get('/api/employee/damage-reports', { params });
  return res.data;
}

// ── SCR-64: Create Damage Report ───────────────────────────────────────────────

/** POST /api/employee/damage-reports */
export async function createDamageReport(payload: {
  roomId: string;
  items: DamageItem[];
  attachments: { url: string; type: string }[];
  notes?: string;
}): Promise<{ success: boolean; data: DamageReport }> {
  const res = await api.post('/api/employee/damage-reports', payload);
  return res.data;
}

// ── SCR-65: Property Room List ─────────────────────────────────────────────────

/** GET /api/employee/rooms */
export async function getEmployeeRooms(params?: { page?: number; size?: number; status?: string }): Promise<{ success: boolean; data: PageResponse<EmployeeRoom> }> {
  const res = await api.get('/api/employee/rooms', { params });
  return res.data;
}
