// Admin Portal — shared mock data + reusable components
// Entity-driven per figma-generation-prompt.md

// ─── MOCK DATA ───────────────────────────────────────────────

export const MOCK_ADMIN_USERS = [
  { id: 'u-001', name: 'Nguyen Van A',   email: 'vana@example.com',    phone: '+84 912 345 678', role: 'TENANT',   status: 'ACTIVE',    createdAt: '2024-08-15', updatedAt: '2025-10-01', avatarUrl: 'https://i.pravatar.cc/40?img=1',  googleId: null },
  { id: 'u-002', name: 'Tran Thi B',    email: 'bbb@example.com',     phone: '+84 908 111 222', role: 'TENANT',   status: 'ACTIVE',    createdAt: '2024-07-01', updatedAt: '2025-09-20', avatarUrl: 'https://i.pravatar.cc/40?img=2',  googleId: 'google-ub002' },
  { id: 'u-003', name: 'Le Van C',      email: 'ccc@example.com',     phone: '+84 901 333 444', role: 'TENANT',   status: 'ACTIVE',    createdAt: '2024-09-01', updatedAt: '2025-11-10', avatarUrl: 'https://i.pravatar.cc/40?img=3',  googleId: null },
  { id: 'u-004', name: 'Pham Thi D',    email: 'ddd@example.com',     phone: '+84 912 555 666', role: 'TENANT',   status: 'PENDING',   createdAt: '2025-01-10', updatedAt: '2025-01-10', avatarUrl: 'https://i.pravatar.cc/40?img=4',  googleId: null },
  { id: 'u-005', name: 'Le Quoc Hung',  email: 'hung@property.vn',    phone: '+84 909 777 888', role: 'LANDLORD', status: 'ACTIVE',    createdAt: '2023-06-01', updatedAt: '2025-10-05', avatarUrl: 'https://i.pravatar.cc/40?img=12', googleId: null },
  { id: 'u-006', name: 'Minh Lan',      email: 'lan@greehouse.vn',    phone: '+84 907 222 333', role: 'LANDLORD', status: 'ACTIVE',    createdAt: '2023-09-15', updatedAt: '2025-09-15', avatarUrl: 'https://i.pravatar.cc/40?img=13', googleId: 'google-lan006' },
  { id: 'u-007', name: 'Hoang Van E',   email: 'eee@example.com',     phone: '+84 916 888 999', role: 'TENANT',   status: 'SUSPENDED', createdAt: '2024-11-20', updatedAt: '2025-08-01', avatarUrl: 'https://i.pravatar.cc/40?img=7',  googleId: null },
  { id: 'u-008', name: 'System Admin',  email: 'admin@boardinghub.vn',phone: '+84 900 000 001', role: 'ADMIN',    status: 'ACTIVE',    createdAt: '2023-01-01', updatedAt: '2025-11-01', avatarUrl: 'https://i.pravatar.cc/40?img=50', googleId: null },
];

export const MOCK_COMPLAINTS = [
  { id: 'CMP-015', userId: 'u-001', userName: 'Nguyen Van A',   userEmail: 'vana@example.com',    subject: 'Bill amount incorrect for October',        description: 'The electricity fee in my October bill seems inflated compared to actual usage. Previous month was 80 kWh but this month shows 250 kWh with no explanation.',        status: 'OPEN',        createdAt: '2025-11-18T09:00:00Z' },
  { id: 'CMP-014', userId: 'u-002', userName: 'Tran Thi B',    userEmail: 'bbb@example.com',     subject: 'Landlord not responding to maintenance',    description: 'I submitted a maintenance ticket for a broken AC 2 weeks ago and the landlord has not responded or updated the status. This is urgent as weather is very hot.',         status: 'IN_PROGRESS', createdAt: '2025-11-10T14:30:00Z' },
  { id: 'CMP-013', userId: 'u-004', userName: 'Pham Thi D',    userEmail: 'ddd@example.com',     subject: 'Cannot access my account after registration',description: 'I registered 3 days ago but my account status is still PENDING. I verified my email but still cannot login to access any features.',                               status: 'RESOLVED',    createdAt: '2025-11-05T11:00:00Z' },
  { id: 'CMP-012', userId: 'u-003', userName: 'Le Van C',      userEmail: 'ccc@example.com',     subject: 'Room listing has wrong photos',             description: 'The room I rented (A-101) looks completely different from the photos in the listing. The amenities shown do not match what is actually in the room.',                status: 'CLOSED',      createdAt: '2025-10-28T16:00:00Z' },
  { id: 'CMP-011', userId: 'u-007', userName: 'Hoang Van E',   userEmail: 'eee@example.com',     subject: 'Account suspended without reason',          description: 'My account was suspended and I received no explanation or notification. I need access to download my contract and payment receipts.',                            status: 'OPEN',        createdAt: '2025-10-20T08:00:00Z' },
];

export const MOCK_REVIEWS = [
  { id: 'rv-001', tenantId: 'u-001', tenantName: 'Nguyen Van A',  roomId: 'r-001', roomNumber: 'A-301', propertyName: 'Sunset Apartments', rating: 5, comment: 'Great room, very clean and quiet. The AC works well and the WiFi is fast. Landlord is responsive. Highly recommended!',  moderationStatus: 'VISIBLE', createdAt: '2025-10-15T10:00:00Z' },
  { id: 'rv-002', tenantId: 'u-002', tenantName: 'Tran Thi B',   roomId: 'r-003', roomNumber: 'B-101', propertyName: 'Sunset Apartments', rating: 3, comment: 'Room is okay but the bathroom needs renovation. Price is fair for the location. Noise from traffic at night is sometimes an issue.', moderationStatus: 'VISIBLE', createdAt: '2025-09-20T14:00:00Z' },
  { id: 'rv-003', tenantId: 'u-003', tenantName: 'Le Van C',     roomId: 'r-004', roomNumber: 'A-101', propertyName: 'Green House',       rating: 1, comment: 'Terrible experience. The room had cockroaches and the landlord ignored all maintenance requests. Smell of mold everywhere. AVOID THIS PLACE.',  moderationStatus: 'VISIBLE', createdAt: '2025-11-01T09:00:00Z' },
  { id: 'rv-004', tenantId: 'u-007', tenantName: 'Hoang Van E',  roomId: 'r-002', roomNumber: 'A-302', propertyName: 'Sunset Apartments', rating: 2, comment: 'Scam landlord! Added fees not mentioned in contract. Go find another place.',                                                    moderationStatus: 'HIDDEN',  createdAt: '2025-10-05T16:00:00Z' },
];

export const MOCK_AUDIT_LOGS = [
  { id: 'al-001', actorId: 'u-001', actorName: 'Nguyen Van A',  actorRole: 'TENANT',   action: 'PAYMENT',       entityName: 'Payment',  entityId: 'PMT-001', ipAddress: '113.23.45.67',  meta: { amount: 4080000, method: 'VNPAY', status: 'SUCCESS' },           createdAt: '2025-11-18T10:30:00Z' },
  { id: 'al-002', actorId: 'u-008', actorName: 'System Admin',  actorRole: 'ADMIN',    action: 'ROLE_CHANGE',   entityName: 'User',     entityId: 'u-005',   ipAddress: '192.168.1.1',  meta: { from: 'TENANT', to: 'LANDLORD', reason: 'Verified landlord' },  createdAt: '2025-11-17T14:20:00Z' },
  { id: 'al-003', actorId: 'u-005', actorName: 'Le Quoc Hung',  actorRole: 'LANDLORD', action: 'CONTRACT',      entityName: 'Contract', entityId: 'C-2024-001', ipAddress: '58.187.21.9', meta: { action: 'SIGNED', contractId: 'C-2024-001' },                createdAt: '2025-11-16T09:15:00Z' },
  { id: 'al-004', actorId: 'u-002', actorName: 'Tran Thi B',   actorRole: 'TENANT',   action: 'LOGIN',         entityName: 'User',     entityId: 'u-002',   ipAddress: '27.74.200.11', meta: { method: 'PASSWORD' },                                          createdAt: '2025-11-15T08:00:00Z' },
  { id: 'al-005', actorId: 'u-008', actorName: 'System Admin',  actorRole: 'ADMIN',    action: 'MODERATION',    entityName: 'Review',   entityId: 'rv-004',  ipAddress: '192.168.1.1',  meta: { action: 'HIDE', reason: 'Inappropriate content' },             createdAt: '2025-11-14T11:00:00Z' },
  { id: 'al-006', actorId: 'u-001', actorName: 'Nguyen Van A',  actorRole: 'TENANT',   action: 'LOGIN',         entityName: 'User',     entityId: 'u-001',   ipAddress: '113.23.45.67', meta: { method: 'GOOGLE_OAUTH' },                                      createdAt: '2025-11-13T07:45:00Z' },
  { id: 'al-007', actorId: 'u-005', actorName: 'Le Quoc Hung',  actorRole: 'LANDLORD', action: 'PAYMENT',       entityName: 'Bill',     entityId: 'B-003',   ipAddress: '58.187.21.9',  meta: { action: 'MARK_PAID', amount: 4640000 },                       createdAt: '2025-11-12T15:30:00Z' },
  { id: 'al-008', actorId: 'u-007', actorName: 'Hoang Van E',   actorRole: 'TENANT',   action: 'LOGOUT',        entityName: 'User',     entityId: 'u-007',   ipAddress: '171.250.40.22',meta: {},                                                              createdAt: '2025-11-11T22:00:00Z' },
  { id: 'al-009', actorId: 'u-008', actorName: 'System Admin',  actorRole: 'ADMIN',    action: 'MODERATION',    entityName: 'Property', entityId: 'p-003',   ipAddress: '192.168.1.1',  meta: { action: 'SUSPEND', reason: 'Policy violation' },               createdAt: '2025-11-10T10:00:00Z' },
  { id: 'al-010', actorId: 'u-003', actorName: 'Le Van C',      actorRole: 'TENANT',   action: 'CONTRACT',      entityName: 'Contract', entityId: 'C-2024-003', ipAddress: '42.119.68.11', meta: { action: 'SIGNED' },                                      createdAt: '2025-11-09T14:00:00Z' },
];

export const MOCK_PLATFORM_PROPERTIES = [
  { id: 'p-001', name: 'Sunset Apartments', ownerName: 'Le Quoc Hung',  ownerEmail: 'hung@property.vn', status: 'ACTIVE',    createdAt: '2023-06-01', totalRooms: 12 },
  { id: 'p-002', name: 'Green House',       ownerName: 'Le Quoc Hung',  ownerEmail: 'hung@property.vn', status: 'ACTIVE',    createdAt: '2023-09-15', totalRooms: 8  },
  { id: 'p-003', name: 'City Center',       ownerName: 'Minh Lan',      ownerEmail: 'lan@greenehouse.vn',status: 'SUSPENDED',createdAt: '2024-02-20', totalRooms: 6  },
  { id: 'p-004', name: 'University Dorms',  ownerName: 'Minh Lan',      ownerEmail: 'lan@greenehouse.vn',status: 'DRAFT',    createdAt: '2025-08-01', totalRooms: 4  },
];

// ─── USER GROWTH DATA (area chart mock) ─────────────────────
export const USER_GROWTH = [
  { month: 'Dec 24', total: 820,  tenant: 640, landlord: 180 },
  { month: 'Jan 25', total: 950,  tenant: 740, landlord: 210 },
  { month: 'Feb 25', total: 1050, tenant: 815, landlord: 235 },
  { month: 'Mar 25', total: 1230, tenant: 960, landlord: 270 },
  { month: 'Apr 25', total: 1410, tenant: 1100, landlord: 310 },
  { month: 'May 25', total: 1590, tenant: 1230, landlord: 360 },
  { month: 'Jun 25', total: 1750, tenant: 1360, landlord: 390 },
  { month: 'Jul 25', total: 1920, tenant: 1490, landlord: 430 },
  { month: 'Aug 25', total: 2100, tenant: 1640, landlord: 460 },
  { month: 'Sep 25', total: 2280, tenant: 1770, landlord: 510 },
  { month: 'Oct 25', total: 2450, tenant: 1900, landlord: 550 },
  { month: 'Nov 25', total: 2634, tenant: 2050, landlord: 584 },
];

export const REVENUE_DATA = [
  { month: 'Dec 24', paid: 85000000,  pending: 12000000 },
  { month: 'Jan 25', paid: 91000000,  pending: 8000000  },
  { month: 'Feb 25', paid: 78000000,  pending: 15000000 },
  { month: 'Mar 25', paid: 102000000, pending: 9000000  },
  { month: 'Apr 25', paid: 110000000, pending: 14000000 },
  { month: 'May 25', paid: 118000000, pending: 7000000  },
  { month: 'Jun 25', paid: 125000000, pending: 11000000 },
  { month: 'Jul 25', paid: 132000000, pending: 9500000  },
  { month: 'Aug 25', paid: 141000000, pending: 13000000 },
  { month: 'Sep 25', paid: 138000000, pending: 10000000 },
  { month: 'Oct 25', paid: 152000000, pending: 16000000 },
  { month: 'Nov 25', paid: 148000000, pending: 14500000 },
];

// ─── HELPERS ────────────────────────────────────────────────

export function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
export function formatDate(d: string)  { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
export function formatDateTime(iso: string) { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }
export function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`;
}

// ─── STATUS BADGE ────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-success', AVAILABLE: 'badge-success', PAID: 'badge-success', RESOLVED: 'badge-success', SUCCESS: 'badge-success', APPROVED: 'badge-success', VISIBLE: 'badge-success',
    PENDING: 'badge-warning', IN_PROGRESS: 'badge-info', PENDING_SIGN: 'badge-warning',
    OVERDUE: 'badge-error', REJECTED: 'badge-error', FAILED: 'badge-error', TERMINATED: 'badge-error', SUSPENDED: 'badge-error', DELETED: 'badge-error',
    OCCUPIED: 'badge-info', CONFIRMED: 'badge-info', DRAFT: 'badge-neutral',
    MAINTENANCE: 'badge-warning', HIDDEN: 'badge-warning',
    EXPIRED: 'badge-neutral', ARCHIVED: 'badge-neutral', CANCELLED: 'badge-neutral', CLOSED: 'badge-neutral', INACTIVE: 'badge-neutral',
    OPEN: 'badge-warning', LANDLORD: 'badge-primary', ADMIN: 'badge-error', TENANT: 'badge-info',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
    {status.replace(/_/g, ' ')}
  </span>;
}

// ─── ROLE BADGE ──────────────────────────────────────────────

export function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    ADMIN:    { bg: '#FEF2F2', color: '#DC2626', label: 'Admin' },
    LANDLORD: { bg: '#FDF0E8', color: '#EA5A1E', label: 'Landlord' },
    TENANT:   { bg: '#ECFEFF', color: '#0891B2', label: 'Tenant' },
  };
  const c = cfg[role] ?? { bg: '#F3F0E8', color: '#475569', label: role };
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 9999,
      background: c.bg, color: c.color,
    }}>{c.label}</span>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────

export function KpiCard({ icon, label, value, sub, color, trend }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string; trend?: string;
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="body-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--ink)', lineHeight: 1 }}>{value}</p>
      {sub && <p className="caption mt-1.5" style={{ color: 'var(--ash)' }}>{sub}</p>}
      {trend && <p className="caption mt-1" style={{ color: trend.startsWith('+') ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{trend}</p>}
    </div>
  );
}

// ─── PAGE HEADER ─────────────────────────────────────────────

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{title}</h1>
        {sub && <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── FILTER BAR ──────────────────────────────────────────────

export function FilterBar({ search, onSearch, children }: { search: string; onSearch: (v: string) => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="relative flex-1" style={{ minWidth: 240, maxWidth: 360 }}>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="input-field-rect"
          style={{ paddingLeft: 36, height: 38 }}
          placeholder="Search…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}

// ─── ACTION LOG COLOR ────────────────────────────────────────

export function actionBorderColor(action: string): string {
  if (action === 'PAYMENT') return '#EA5A1E';
  if (action === 'LOGIN' || action === 'LOGOUT') return '#0891B2';
  if (action === 'MODERATION' || action === 'ROLE_CHANGE') return '#DC2626';
  if (action === 'CONTRACT') return '#16A34A';
  return '#94A3B8';
}

export function actionBadgeStyle(action: string): React.CSSProperties {
  const color = actionBorderColor(action);
  return {
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 4,
    background: color + '15', color,
    fontFamily: 'monospace',
  };
}
