import { Link } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-16 — Tenant Dashboard
// KPI sources: Contract.monthlyRent · Bill.dueDate · count(Bills PENDING/OVERDUE) · count(Tickets OPEN/IN_PROGRESS)

const MOCK_CONTRACT = {
  id: 'C-2024-001', status: 'ACTIVE',
  effectiveFrom: '2024-09-01', effectiveTo: '2026-01-31',
  monthlyRent: 3500000, depositAmount: 7000000,
  room: { roomNumber: 'A-301', blockName: 'Block A', propertyName: 'Sunset Apartments' },
};
const MOCK_BILLS = [
  { id: 'B-001', billingPeriod: 'October 2025', totalAmount: 4200000, dueDate: '2025-11-10', status: 'PENDING' },
  { id: 'B-002', billingPeriod: 'September 2025', totalAmount: 3980000, dueDate: '2025-10-10', status: 'PAID' },
  { id: 'B-003', billingPeriod: 'August 2025', totalAmount: 4050000, dueDate: '2025-09-10', status: 'PAID' },
];
const MOCK_TICKETS = [
  { id: 'MT-042', title: 'Broken AC', status: 'IN_PROGRESS', createdAt: '2025-10-20T10:00:00Z' },
  { id: 'MT-039', title: 'Leaking faucet in bathroom', status: 'OPEN', createdAt: '2025-10-05T08:00:00Z' },
  { id: 'MT-035', title: 'Broken window latch', status: 'RESOLVED', createdAt: '2025-09-28T09:00:00Z' },
];
const MOCK_NOTIFICATIONS = [
  { id: 'n-001', title: 'Your October bill is ready',    isRead: false, createdAt: '2025-10-28T08:30:00Z', type: 'bill' },
  { id: 'n-002', title: 'Maintenance ticket updated',    isRead: false, createdAt: '2025-10-26T15:00:00Z', type: 'maintenance' },
  { id: 'n-003', title: 'Contract renewal reminder',     isRead: false, createdAt: '2025-10-22T09:00:00Z', type: 'contract' },
  { id: 'n-004', title: 'Payment confirmed',             isRead: true,  createdAt: '2025-10-01T10:30:00Z', type: 'payment' },
  { id: 'n-005', title: 'Rental request approved',       isRead: true,  createdAt: '2025-09-15T14:00:00Z', type: 'rental' },
];

function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d > 0 ? `${d}d ago` : 'Today';
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="body-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="heading-lg" style={{ color: color ?? 'var(--ink)', fontSize: 26 }}>{value}</p>
      {sub && <p className="caption mt-1" style={{ color: 'var(--ash)' }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-success', PENDING: 'badge-warning', OVERDUE: 'badge-error', PAID: 'badge-success',
    OPEN: 'badge-warning', IN_PROGRESS: 'badge-info', RESOLVED: 'badge-success', CLOSED: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`} style={{ fontSize: 11 }}>{status.replace('_', ' ')}</span>;
}

const pendingBills = MOCK_BILLS.filter(b => b.status === 'PENDING' || b.status === 'OVERDUE');
const openTickets = MOCK_TICKETS.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
const nearestBill = pendingBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

export default function TenantDashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <TenantLayout>
      <div className="flex flex-col gap-6 animate-fade-up">
        {/* Greeting */}
        <div>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{greeting}, Nguyen Van A 👋</h1>
          <p className="body-md mt-1" style={{ color: 'var(--charcoal)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Contract.monthlyRent */}
          <KpiCard icon="💰" label="Monthly Rent" value={formatPrice(MOCK_CONTRACT.monthlyRent)} sub="Active contract" color="var(--primary)" />
          {/* KPI 2: nearest Bill.dueDate */}
          <KpiCard
            icon="📅"
            label="Next Due Date"
            value={nearestBill ? formatDate(nearestBill.dueDate) : '—'}
            sub={nearestBill ? nearestBill.billingPeriod : 'No pending bills'}
            color={nearestBill && new Date(nearestBill.dueDate) < new Date() ? 'var(--error)' : 'var(--warning)'}
          />
          {/* KPI 3: count Bills PENDING/OVERDUE */}
          <KpiCard
            icon="🧾"
            label="Outstanding Bills"
            value={String(pendingBills.length)}
            sub={pendingBills.length === 0 ? 'All settled ✓' : `${pendingBills.length} unpaid`}
            color={pendingBills.length > 0 ? 'var(--error)' : 'var(--success)'}
          />
          {/* KPI 4: count MaintenanceTickets OPEN/IN_PROGRESS */}
          <KpiCard
            icon="🔧"
            label="Open Tickets"
            value={String(openTickets.length)}
            sub={openTickets.length === 0 ? 'All clear ✓' : `${openTickets.length} active`}
            color={openTickets.length > 0 ? 'var(--primary)' : 'var(--success)'}
          />
        </div>

        {/* ── Main 2-col layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Active Contract Card */}
            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Active Contract</h2>
                <StatusBadge status={MOCK_CONTRACT.status} />
              </div>
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--surface-bone)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Contract ID</p>
                    <p className="code-md font-semibold" style={{ color: 'var(--ink)' }}>{MOCK_CONTRACT.id}</p>
                  </div>
                  <div>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Room</p>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {MOCK_CONTRACT.room.roomNumber} · {MOCK_CONTRACT.room.blockName}
                    </p>
                  </div>
                  <div>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Property</p>
                    <p className="body-sm" style={{ color: 'var(--ink)' }}>{MOCK_CONTRACT.room.propertyName}</p>
                  </div>
                  <div>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Period</p>
                    <p className="body-sm" style={{ color: 'var(--ink)' }}>
                      {formatDate(MOCK_CONTRACT.effectiveFrom)} → {formatDate(MOCK_CONTRACT.effectiveTo)}
                    </p>
                  </div>
                  <div>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Monthly Rent</p>
                    <p className="font-bold" style={{ color: 'var(--primary)', fontSize: 18 }}>{formatPrice(MOCK_CONTRACT.monthlyRent)}</p>
                  </div>
                  <div>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Deposit Paid</p>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(MOCK_CONTRACT.depositAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/tenant/contracts/c-001" className="btn-outline" style={{ height: 36, padding: '0 18px', fontSize: 13 }}>View Contract →</Link>
                <Link to="/tenant/room" className="btn-ghost" style={{ height: 36, padding: '0 16px', fontSize: 13, color: 'var(--charcoal)' }}>View Room →</Link>
              </div>
            </div>

            {/* Recent Bills */}
            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Recent Bills</h2>
                <Link to="/tenant/bills" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {MOCK_BILLS.slice(0, 3).map((bill, i) => (
                  <Link
                    key={bill.id}
                    to={`/tenant/bills/${bill.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
                    style={{
                      textDecoration: 'none',
                      background: i % 2 === 0 ? 'var(--surface-bone)' : 'transparent',
                      border: '1px solid var(--hairline)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fdf6f0')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-bone)' : 'transparent')}
                  >
                    <div>
                      <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{bill.billingPeriod}</p>
                      <p className="caption" style={{ color: 'var(--ash)' }}>Due: {formatDate(bill.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={{ color: 'var(--ink)', fontSize: 15 }}>{formatPrice(bill.totalAmount)}</span>
                      <StatusBadge status={bill.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Maintenance Tickets */}
            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>My Maintenance Tickets</h2>
                <Link to="/tenant/maintenance" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {MOCK_TICKETS.slice(0, 3).map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/tenant/maintenance/${ticket.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border transition-colors"
                    style={{ textDecoration: 'none', borderColor: 'var(--hairline)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-3">
                      <span>🔧</span>
                      <div>
                        <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>#{ticket.id} — {ticket.title}</p>
                        <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(ticket.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1/3 — Notifications */}
          <div className="card" style={{ padding: 24, alignSelf: 'flex-start' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Notifications</h2>
              <Link to="/tenant/notifications" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>See all →</Link>
            </div>
            <div className="flex flex-col gap-0">
              {MOCK_NOTIFICATIONS.slice(0, 5).map((n, i) => (
                <Link
                  key={n.id}
                  to={`/tenant/notifications/${n.id}`}
                  className="flex items-start gap-3 py-3 transition-colors"
                  style={{
                    textDecoration: 'none',
                    borderBottom: i < 4 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <div className="flex-shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{ width: 8, height: 8, background: n.isRead ? 'var(--stone)' : 'var(--primary)', marginTop: 6 }} />
                  <div className="flex-1 min-w-0">
                    <p className="body-sm" style={{ color: 'var(--ink)', fontWeight: n.isRead ? 400 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.title}
                    </p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(n.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
