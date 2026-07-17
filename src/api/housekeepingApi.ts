import api from './axiosInstance';

export interface HousekeepingTaskSummary {
  id: string;
  propertyId?: string;
  propertyName?: string;
  roomId: string;
  roomNumber: string;
  bookingId?: string | null;
  status: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
}

/** SCR-66 schedule board (api-spec). */
export interface ScheduleTaskCard {
  id: string;
  room: { id: string; roomNumber: string };
  status: string;
  createdAt: string;
}

export interface HousekeepingSchedule {
  date: string;
  kpis: {
    pending: number;
    inProgress: number;
    completedToday: number;
    unassigned: number;
  };
  columns: {
    assigneeId: string | null;
    assigneeName: string;
    tasks: ScheduleTaskCard[];
  }[];
}

export interface HousekeepingBoardParams {
  propertyId: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** SCR-66 — GET schedule (canonical /managers). */
export async function fetchHousekeepingScheduleV1(
  propertyId: string,
  date?: string,
): Promise<HousekeepingSchedule> {
  const res = await api.get('/api/v1/managers/housekeeping/schedule', {
    params: { propertyId, date: date || undefined },
  });
  return res.data.data;
}

/** SCR-66 — POST assign (docs: employeeId). */
export async function assignHousekeepingScheduleTaskV1(
  taskId: string,
  employeeId: string,
): Promise<void> {
  await api.post(`/api/v1/managers/housekeeping/${taskId}/assign`, { employeeId });
}

/** SCR-40 — list. */
export async function fetchManagerHousekeepingTasksV1(
  params: HousekeepingBoardParams,
): Promise<PageResponse<HousekeepingTaskSummary>> {
  const res = await api.get('/api/v1/managers/housekeeping-tasks', { params });
  return res.data.data;
}

/** SCR-40 — create. */
export async function createHousekeepingTaskV1(payload: {
  roomId: string;
  assigneeId?: string;
}): Promise<HousekeepingTaskSummary> {
  const res = await api.post('/api/v1/managers/housekeeping-tasks', payload);
  return res.data.data;
}

/** SCR-40 — assign (legacy PATCH + assigneeId). */
export async function assignHousekeepingTaskV1(
  taskId: string,
  assigneeId: string,
): Promise<HousekeepingTaskSummary> {
  const res = await api.patch(`/api/v1/managers/housekeeping-tasks/${taskId}/assign`, {
    assigneeId,
  });
  return res.data.data;
}

/** SCR-40 — cancel. */
export async function cancelHousekeepingTaskV1(
  taskId: string,
  note?: string,
): Promise<HousekeepingTaskSummary> {
  const res = await api.patch(`/api/v1/managers/housekeeping-tasks/${taskId}/cancel`, {
    note: note || undefined,
  });
  return res.data.data;
}
