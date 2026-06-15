import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

// ── Mock data ─────────────────────────────────────────────────────────────────
const KPI = [
  { label: 'Total Properties', value: 8,   color: 'var(--ink)',    icon: '🏠' },
  { label: 'Total Rooms',      value: 95,  color: 'var(--ink)',    icon: '🛏️' },
  { label: 'Available Now',    value: 42,  color: 'var(--success)', icon: '✅' },
  { label: 'Occupied',         value: 38,  color: 'var(--primary)', icon: '🔴' },
  { label: 'Upcoming Check-ins',  value: 12, color: 'var(--info)', icon: '📅' },
  { label: 'Upcoming Check-outs', value: 8, color: 'var(--warning)', icon: '🚪' },
  { label: 'Pending Payments',    value: 6, color: 'var(--warning)', icon: '💳' },
  { label: 'Monthly Revenue',   value: '₫128.5M', color: 'var(--ink)', icon: '📈' },
];

const RECENT_BOOKINGS = [
  { id: 'B001', customer: 'Nguyễn Văn An', room: 'Villa 01', property: 'Sunset Resort', checkIn: '2026-07-10', checkOut: '2026-07-13', status: 'CONFIRMED', amount: 7500000 },
  { id: 'B002', customer: 'Trần Thị Lan', room: 'Deluxe 05', property: 'Mountain View', checkIn: '2026-08-01', checkOut: '2026-08-03', status: 'PENDING_DEPOSIT', amount: 2400000 },
  { id: 'B003', customer: 'Lê Minh Hoàng', room: 'Suite 03', property: 'Hội An Garden', checkIn: '2026-08-15', checkOut: '2026-08-18', status: 'CONFIRMED', amount: 5400000 },
  { id: 'B004', customer: 'Phạm Quốc Dũng', room: 'Standard 12', property: 'Phú Quốc Beach', checkIn: '2026-09-01', checkOut: '2026-09-02', status: 'PENDING_DEPOSIT', amount: 750000 },
];

const RECENT_PAYMENTS = [
  { id: 'P001', bookingId: 'B001', customer: 'Nguyễn Văn An', type: 'DEPOSIT', amount: 3000000, status: 'PENDING', createdAt: '2026-06-14T09:00:00' },
  { id: 'P002', bookingId: 'B002', customer: 'Trần Thị Lan', type: 'DEPOSIT', amount: 960000, status: 'PENDING', createdAt: '2026-06-13T14:30:00' },
];

const MAINTENANCE_ALERTS = [
  { id: 'M001', room: 'Villa 01', property: 'Sunset Resort', title: 'AC not working', status: 'OPEN' },
  { id: 'M002', room: 'Deluxe 05', property: 'Mountain View', title: 'Shower leak', status: 'IN_PROGRESS' },
];

function StatusBadge({ s, compact = false }: { s: string; compact?: boolean }) {
  const m: Record<string, { cls: string; l: string }> = {
    PENDING_DEPOSIT: { cls: 'badge-warning', l: compact ? 'Pending' : 'Pending Deposit' },
    CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
    CHECKED_IN:      { cls: 'badge-info',    l: 'Checked In' },
    CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
    CANCELLED:       { cls: 'badge-error',   l: 'Cancelled' },
    OPEN:            { cls: 'badge-warning', l: 'Open' },
    IN_PROGRESS:     { cls: 'badge-info',    l: 'In Progress' },
    RESOLVED:        { cls: 'badge-success', l: 'Resolved' },
    PENDING:         { cls: 'badge-warning', l: 'Pending Verification' },
    PAID:            { cls: 'badge-success', l: 'Paid' },
    FAILED:          { cls: 'badge-error',   l: 'Failed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

// Inline mini bar chart
function RevenueBar({ months }: { months: number[] }) {
  const max = Math.max(...months, 1);
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, paddingBottom: 20, position: 'relative' }}>
      {months.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', background: i === months.length - 1 ? 'var(--primary)' : 'var(--stone)', borderRadius: '3px 3px 0 0', height: `${(v / max) * 60}px`, transition: 'height 0.3s' }} />
          <span style={{ fontSize: 9, color: 'var(--ash)', marginTop: 4 }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ManagerDashboardPage() {
  const REVENUE_MONTHS = [85, 92, 78, 110, 95, 128, 115, 0, 0, 0, 0, 0];

  return (
    <ManagerLayout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="heading-md" style={{ marginBottom: 4 }}>Dashboard</h1>
        <p className="body-md text-charcoal">Overview of your homestay & resort operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 28 }}>
        {KPI.map(k => (
          <div key={k.label} className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
            <div className="kpi-value" style={{ color: k.color, fontSize: 28 }}>{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'flex-start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Revenue Chart */}
          <div className="card-lg" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="heading-sm">Monthly Revenue (2026)</h2>
              <Link to="/manager/reports/revenue" className="btn-ghost btn-sm">View Report →</Link>
            </div>
            <RevenueBar months={REVENUE_MONTHS} />
            <p className="body-sm text-charcoal" style={{ marginTop: 4 }}>All amounts in millions (₫M)</p>
          </div>

          {/* Recent Bookings */}
          <div className="card-lg" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="heading-sm">Recent Bookings</h2>
              <Link to="/manager/bookings" className="btn-ghost btn-sm">View All →</Link>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Room</th>
                    <th>Check-in</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_BOOKINGS.map(b => (
                    <tr key={b.id}>
                      <td><span className="code-sm">{b.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{b.customer}</td>
                      <td className="text-charcoal">{b.room}</td>
                      <td className="text-charcoal">{b.checkIn}</td>
                      <td style={{ fontWeight: 600 }}>₫{b.amount.toLocaleString()}</td>
                      <td><StatusBadge s={b.status} compact /></td>
                      <td><Link to={`/manager/bookings/${b.id}`} className="btn-ghost btn-sm">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pending Payments */}
          <div className="card-lg" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="heading-sm">Pending Verifications</h2>
              <Link to="/manager/payments" className="btn-ghost btn-sm">All →</Link>
            </div>
            {RECENT_PAYMENTS.length === 0 ? (
              <p className="body-sm text-charcoal" style={{ padding: '12px 0' }}>No pending verifications</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {RECENT_PAYMENTS.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{p.customer}</p>
                      <p className="body-sm text-charcoal">{p.type === 'DEPOSIT' ? 'Deposit' : 'Balance'} · ₫{p.amount.toLocaleString()}</p>
                    </div>
                    <Link to={`/manager/payments/${p.id}/verify`} className="btn-primary btn-sm">Verify</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Alerts */}
          <div className="card-lg" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="heading-sm">Maintenance Alerts</h2>
              <Link to="/manager/maintenance" className="btn-ghost btn-sm">All →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MAINTENANCE_ALERTS.map(m => (
                <Link key={m.id} to={`/manager/maintenance/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-bone)', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#ebe8e0')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-bone)')}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{m.title}</p>
                    <p className="body-sm text-charcoal">{m.room} · {m.property}</p>
                  </div>
                  <StatusBadge s={m.status} compact />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-lg" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { to: '/manager/properties/add',   label: '+ Add Property' },
                { to: '/manager/rooms/add',         label: '+ Add Room' },
                { to: '/manager/reports/revenue',   label: '📊 Revenue Report' },
                { to: '/manager/customers',         label: '👥 Manage Customers' },
              ].map(a => (
                <Link key={a.to} to={a.to} className="btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>{a.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
