// ─── _sharedAdminData.tsx — Shared mock data & UI atoms for Admin pages ────────

// ─── Mock data ─────────────────────────────────────────────────────────────────
export const CUSTOMERS = [
  { id: 'U001', fullName: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901 234 567', status: 'ACTIVE', bookingCount: 3, createdAt: '2025-01-15' },
  { id: 'U002', fullName: 'Trần Thị Lan', email: 'lan.tran@email.com', phone: '0912 345 678', status: 'ACTIVE', bookingCount: 1, createdAt: '2025-06-01' },
  { id: 'U003', fullName: 'Lê Minh Hoàng', email: 'hoang.le@email.com', phone: '0923 456 789', status: 'SUSPENDED', bookingCount: 2, createdAt: '2025-03-10' },
];

export const COMPLAINTS = [
  { id: 'CP001', customerId: 'U001', customer: 'Nguyễn Văn An', bookingId: 'B001', title: 'Room not clean on arrival', description: 'The room was not properly cleaned when we arrived. Sheets were not changed.', status: 'OPEN', createdAt: '2026-06-13T09:00:00' },
  { id: 'CP002', customerId: 'U002', customer: 'Trần Thị Lan', bookingId: 'B002', title: 'Noise disturbance at night', description: 'There was excessive noise from neighboring room every night.', status: 'RESOLVED', createdAt: '2026-06-10T14:00:00' },
];

export const MGMT_TICKETS = [
  { id: 'M001', bookingId: 'B001', customer: 'Nguyễn Văn An', room: 'Villa 01', property: 'Sunset Resort', title: 'AC not working', status: 'IN_PROGRESS', createdAt: '2026-06-13T09:00:00' },
  { id: 'M002', bookingId: 'B003', customer: 'Lê Minh Hoàng', room: 'Suite 03', property: 'Hội An Garden', title: 'Tap leaking', status: 'RESOLVED', createdAt: '2026-04-06T14:00:00' },
];

export const REVIEWS = [
  { id: 'R001', bookingId: 'B003', customer: 'Lê Minh Hoàng', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', rating: 5, comment: 'Absolutely stunning villa! Perfect for our family getaway.', createdAt: '2026-04-10', visible: true },
  { id: 'R002', bookingId: 'B001', customer: 'Nguyễn Văn An', roomNumber: 'Villa 01', propertyName: 'Sunset Resort', rating: 2, comment: 'Several issues with the AC and cleanliness. Very disappointed.', createdAt: '2026-07-14', visible: true },
];

export const ACTIVITY_LOGS = [
  { id: 'AL001', action: 'LOGIN', userId: 'U001', userEmail: 'an.nguyen@email.com', description: 'User logged in', createdAt: '2026-06-14T10:00:00' },
  { id: 'AL002', action: 'BOOKING_CREATE', userId: 'U002', userEmail: 'lan.tran@email.com', description: 'Booking B002 created', createdAt: '2026-06-14T10:10:00' },
  { id: 'AL003', action: 'PAYMENT_VERIFY', userId: 'MGR001', userEmail: 'manager@system.com', description: 'Payment P001 approved', createdAt: '2026-06-14T10:30:00' },
  { id: 'AL004', action: 'CONTRACT_RESEND', userId: 'MGR001', userEmail: 'manager@system.com', description: 'Contract C001 resent to an.nguyen@email.com', createdAt: '2026-06-14T11:00:00' },
  { id: 'AL005', action: 'ROOM_STATUS_CHANGE', userId: 'MGR001', userEmail: 'manager@system.com', description: 'Room Villa 01 status → MAINTENANCE', createdAt: '2026-06-13T09:00:00' },
];

export const REVENUE_DATA = [
  { month: 'Jan', amount: 85000000 }, { month: 'Feb', amount: 92000000 },
  { month: 'Mar', amount: 78000000 }, { month: 'Apr', amount: 110000000 },
  { month: 'May', amount: 95000000 }, { month: 'Jun', amount: 128000000 },
  { month: 'Jul', amount: 0 },        { month: 'Aug', amount: 0 },
];

export const ACTION_ICON: Record<string, { bg: string; icon: string }> = {
  LOGIN:              { bg: '#dbeafe', icon: '🔐' },
  BOOKING_CREATE:     { bg: '#dcfce7', icon: '📋' },
  PAYMENT_VERIFY:     { bg: '#ede9fe', icon: '✓' },
  CONTRACT_RESEND:    { bg: '#fef3c7', icon: '📄' },
  ROOM_STATUS_CHANGE: { bg: '#fee2e2', icon: '🏠' },
};

// ─── Shared UI atoms ───────────────────────────────────────────────────────────
export function Badge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    ACTIVE:      { cls: 'badge-success', l: 'Active' },
    SUSPENDED:   { cls: 'badge-error',   l: 'Suspended' },
    OPEN:        { cls: 'badge-warning', l: 'Open' },
    IN_PROGRESS: { cls: 'badge-info',    l: 'In Progress' },
    RESOLVED:    { cls: 'badge-success', l: 'Resolved' },
    CLOSED:      { cls: 'badge-neutral', l: 'Closed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? '#ea2804' : '#e5e7eb'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );
}
