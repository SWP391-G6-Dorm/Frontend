/**
 * adminApi.ts — REST API calls for Admin Portal (SCR-45 to SCR-58)
 * Source of truth: docs/api-spec-by-screen.md
 */
import api from './axiosInstance';

// ── Shared types ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminProperty {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
  managerId?: string;
  managerName?: string;
  createdAt: string;
}

export interface GlobalKpis {
  totalRevenue: number;
  totalBookings: number;
  totalProperties?: number;
  totalCustomers?: number;
}

export interface PaymentReconciliationItem {
  id: string;
  bookingId: string;
  amount: number;
  vnpayStatus: string;
  systemStatus: string;
  discrepancyReason?: string;
  createdAt: string;
}

export interface AdminDamageReport {
  id: string;
  roomId: string;
  roomName: string;
  propertyName: string;
  reportedBy: string;
  totalFee: number;
  status: 'ESCALATED' | 'APPROVED' | 'PENDING_REVIEW';
  items: { name: string; estimatedCost: number }[];
  attachments: { url: string; type: string }[];
  createdAt: string;
}

export interface AdminComplaint {
  id: string;
  customerId: string;
  customerName: string;
  bookingId: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  createdAt: string;
}

/** Banner promotion — khop entity Promotion / Manager PromotionItem (SCR-57/58) */
export interface Promotion {
  id: string;
  subtitle: string;
  title: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  colorTheme: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionPayload {
  subtitle: string;
  title: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  colorTheme: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SystemSettings {
  depositPercentage: number;
  cancelTimeoutHours: number;
}

export interface MonthlyRevenue {
  month: number;
  revenue: number;
}

// ── SCR-45: Admin Dashboard ────────────────────────────────────────────────────

/** GET /api/reports/global-kpis */
export async function getGlobalKpis(): Promise<{ success: boolean; data: GlobalKpis }> {
  const res = await api.get('/api/reports/global-kpis');
  return res.data;
}

// ── SCR-46: Property List ──────────────────────────────────────────────────────

/** GET /api/admin/properties */
export async function getAdminProperties(params?: { page?: number; size?: number; status?: string }): Promise<{ success: boolean; data: PageResponse<AdminProperty> }> {
  const res = await api.get('/api/admin/properties', { params });
  return res.data;
}

// ── SCR-47: Create Property ────────────────────────────────────────────────────

/** POST /api/admin/properties */
export async function createAdminProperty(payload: { name: string; location: string }): Promise<{ success: boolean; data: AdminProperty }> {
  const res = await api.post('/api/admin/properties', payload);
  return res.data;
}

// ── SCR-48: Edit Property ──────────────────────────────────────────────────────

/** PUT /api/admin/properties/{id} */
export async function updateAdminProperty(id: string, payload: { name?: string; status?: 'ACTIVE' | 'INACTIVE' }): Promise<{ success: boolean; data: AdminProperty }> {
  const res = await api.put(`/api/admin/properties/${id}`, payload);
  return res.data;
}

// ── SCR-49: Manager Assignment ─────────────────────────────────────────────────

/** PATCH /api/admin/properties/{id}/manager */
export async function assignManagerToProperty(propertyId: string, managerId: string): Promise<{ success: boolean }> {
  const res = await api.patch(`/api/admin/properties/${propertyId}/manager`, { managerId });
  return res.data;
}

// ── SCR-50: Manager Directory ──────────────────────────────────────────────────

/** GET /api/admin/users?role=MANAGER */
export async function getManagers(params?: { page?: number; size?: number; keyword?: string; status?: string }): Promise<{ success: boolean; data: PageResponse<AdminUser> }> {
  const res = await api.get('/api/admin/users', { params: { role: 'MANAGER', ...params } });
  return res.data;
}

// ── SCR-51: Customer Directory ─────────────────────────────────────────────────

/** GET /api/admin/users?role=CUSTOMER */
export async function getCustomers(params?: { page?: number; size?: number; keyword?: string; status?: string }): Promise<{ success: boolean; data: PageResponse<AdminUser> }> {
  const res = await api.get('/api/admin/users', { params: { role: 'CUSTOMER', ...params } });
  return res.data;
}

/** GET /api/admin/users/{id} */
export async function getAdminUserById(id: string): Promise<{ success: boolean; data: AdminUser }> {
  const res = await api.get(`/api/admin/users/${id}`);
  return res.data;
}

/** PUT /api/admin/users/{id} — activate/deactivate user */
export async function updateAdminUser(id: string, payload: { role?: string; status?: string }): Promise<{ success: boolean }> {
  const res = await api.put(`/api/admin/users/${id}`, payload);
  return res.data;
}

// ── SCR-52: Payment Reconciliation ────────────────────────────────────────────

/** GET /api/admin/payments/reconciliation?status=DISCREPANCY */
export async function getPaymentReconciliation(params?: { status?: string; page?: number; size?: number }): Promise<{ success: boolean; data: PageResponse<PaymentReconciliationItem> }> {
  const res = await api.get('/api/admin/payments/reconciliation', { params });
  return res.data;
}

// ── SCR-53: Damage Escalation ──────────────────────────────────────────────────

/** GET /api/admin/damage-reports?status=ESCALATED */
export async function getEscalatedDamageReports(params?: { page?: number; size?: number }): Promise<{ success: boolean; data: PageResponse<AdminDamageReport> }> {
  const res = await api.get('/api/admin/damage-reports', { params: { status: 'ESCALATED', ...params } });
  return res.data;
}

/** PATCH /api/admin/damage-reports/{id}/co-approve */
export async function coApproveDamageReport(id: string, approvedFee: number): Promise<{ success: boolean }> {
  const res = await api.patch(`/api/admin/damage-reports/${id}/co-approve`, { approvedFee });
  return res.data;
}

// ── SCR-54: Complaint Management ──────────────────────────────────────────────

/** GET /api/admin/complaints */
export async function getAdminComplaints(params?: { page?: number; size?: number; status?: string }): Promise<{ success: boolean; data: PageResponse<AdminComplaint> }> {
  const res = await api.get('/api/admin/complaints', { params });
  return res.data;
}

/** PATCH /api/admin/complaints/{id}/resolve */
export async function resolveComplaint(id: string, resolution: string): Promise<{ success: boolean }> {
  const res = await api.patch(`/api/admin/complaints/${id}/resolve`, { resolution });
  return res.data;
}

// ── SCR-55: Global Reports ─────────────────────────────────────────────────────

/** GET /api/admin/reports/revenue?year= */
export async function getGlobalRevenueReport(year: number): Promise<{ success: boolean; data: { monthlyData: MonthlyRevenue[] } }> {
  const res = await api.get('/api/admin/reports/revenue', { params: { year } });
  return res.data;
}

// ── SCR-56: System Administration ─────────────────────────────────────────────

/** GET /api/admin/settings */
export async function getSystemSettings(): Promise<{ success: boolean; data: SystemSettings }> {
  const res = await api.get('/api/admin/settings');
  return res.data;
}

/** PUT /api/admin/settings */
export async function updateSystemSettings(payload: Partial<SystemSettings>): Promise<{ success: boolean }> {
  const res = await api.put('/api/admin/settings', payload);
  return res.data;
}

// ── SCR-57: Promotion Management ──────────────────────────────────────────────

/** GET /api/admin/promotions */
export async function getAdminPromotions(params?: { page?: number; size?: number }): Promise<{ success: boolean; data: PageResponse<Promotion> }> {
  const res = await api.get('/api/admin/promotions', { params });
  return res.data;
}

// ── SCR-58: Add / Edit Promotion ──────────────────────────────────────────────

/** POST /api/admin/promotions — SCR-58 (BE may not exist yet) */
export async function createPromotion(payload: PromotionPayload): Promise<{ success: boolean; data: Promotion }> {
  const res = await api.post('/api/admin/promotions', payload);
  return res.data;
}

/** PUT /api/admin/promotions/{id} — SCR-58 (BE may not exist yet) */
export async function updatePromotion(id: string, payload: Partial<PromotionPayload>): Promise<{ success: boolean }> {
  const res = await api.put(`/api/admin/promotions/${id}`, payload);
  return res.data;
}

/** DELETE /api/admin/promotions/{id} */
export async function deletePromotion(id: string): Promise<{ success: boolean }> {
  const res = await api.delete(`/api/admin/promotions/${id}`);
  return res.data;
}

// ── Legacy export (backward compat with any existing imports) ──────────────────
export const adminApi = {
  searchUsers:  (params: { page?: number; size?: number; role?: string; status?: string; keyword?: string }) =>
    getCustomers(params),
  getUserById:  getAdminUserById,
  updateUser:   (id: string, payload: { role: string; status: string }) => updateAdminUser(id, payload),
};
