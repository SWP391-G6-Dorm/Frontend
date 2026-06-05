import { Link } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { KpiCard, StatusBadge, formatPrice, formatDate, relTime, MOCK_REQUESTS, MOCK_MAINTENANCE, MOCK_BILLS, MOCK_ROOMS, MOCK_PROPERTIES } from './shared';
import { useAuthStore } from '../../store/authStore';

// SCR-34 — Landlord Dashboard
// KPIs: count(Property) · count(Room status=OCCUPIED)/total · count(RentalRequest PENDING) · count(Bill OVERDUE)
// Charts: Revenue (last 6 months) · Occupancy donut
// Activity: Recent Requests · Open Maintenance

const REVENUE_MONTHS = [
  { month: 'May', revenue: 18200000 },
  { month: 'Jun', revenue: 21500000 },
  { month: 'Jul', revenue: 19800000 },
  { month: 'Aug', revenue: 23100000 },
  { month: 'Sep', revenue: 22400000 },
  { month: 'Oct', revenue: 20300000 },
];
const MAX_REV = Math.max(...REVENUE_MONTHS.map(m => m.revenue));

const totalRooms    = MOCK_ROOMS.length;
const occupiedRooms = MOCK_ROOMS.filter(r => r.status === 'OCCUPIED').length;
const availableRooms = MOCK_ROOMS.filter(r => r.status === 'AVAILABLE').length;
const maintenanceRooms = MOCK_ROOMS.filter(r => r.status === 'MAINTENANCE').length;
const pendingRequests = MOCK_REQUESTS.filter(r => r.status === 'PENDING').length;
const overdueBills  = MOCK_BILLS.filter(b => b.status === 'OVERDUE').length;

export default function LandlordDashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const landlordVerified = useAuthStore(s => s.landlordVerified);

  return (
    <LandlordLayout>
      <div className="flex flex-col gap-6 animate-fade-up">
        {/* Greeting */}
        <div>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{greeting}, Le Quoc Hung 👋</h1>
          <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Pending Verification Banner ──────────────────────────────────── */}
        {!landlordVerified && (
          <div
            className="animate-fade-in"
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              background: '#fefce8',
              border: '1px solid #fde047',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>⏳</span>
            <div className="flex-1">
              <p className="body-sm font-semibold" style={{ color: '#92400e', marginBottom: 4 }}>
                Account Pending Admin Verification
              </p>
              <p className="caption" style={{ color: '#a16207', lineHeight: 1.6 }}>
                Your landlord account is active but some features are restricted until our team
                verifies your identity. Typical review time: <strong>1–2 business days</strong>.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  '🏢 Add Properties',
                  '🏠 Manage Rooms',
                  '📋 Accept Requests',
                  '💳 Billing',
                ].map(f => (
                  <span key={f} className="caption font-semibold"
                    style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: '#fde047', color: '#92400e',
                    }}
                  >
                    🔒 {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="🏢" label="Total Properties" value={MOCK_PROPERTIES.length} sub="2 active · 1 draft" />
          <KpiCard icon="🏠" label="Occupied Rooms" value={`${occupiedRooms} / ${totalRooms}`} sub={`${Math.round(occupiedRooms/totalRooms*100)}% occupancy`} color="var(--success)" />
          <KpiCard icon="📋" label="Pending Requests" value={pendingRequests} sub={pendingRequests > 0 ? 'Needs review' : 'All handled'} color={pendingRequests > 0 ? 'var(--warning)' : 'var(--success)'} />
          <KpiCard icon="⚠️" label="Overdue Bills" value={overdueBills} sub={overdueBills > 0 ? 'Action needed' : 'All current'} color={overdueBills > 0 ? 'var(--error)' : 'var(--success)'} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue bar chart (last 6 months) */}
          <div className="card lg:col-span-2" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Monthly Revenue</h2>
              <span className="body-sm" style={{ color: 'var(--ash)' }}>Last 6 months</span>
            </div>
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {REVENUE_MONTHS.map(m => {
                const pct = (m.revenue / MAX_REV) * 100;
                const isLast = m.month === 'Oct';
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end" style={{ height: 120 }}>
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${pct}%`,
                          background: isLast ? 'var(--primary)' : 'var(--surface-bone)',
                          border: isLast ? 'none' : '1px solid var(--hairline)',
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="caption font-semibold" style={{ color: isLast ? 'var(--primary)' : 'var(--ink)' }}>
                        {(m.revenue / 1000000).toFixed(1)}M
                      </p>
                      <p className="caption" style={{ color: 'var(--ash)', fontSize: 10 }}>{m.month}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Occupancy donut */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm mb-5" style={{ color: 'var(--ink)' }}>Room Status</h2>
            {/* SVG donut */}
            <div className="flex justify-center mb-4">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-bone)" strokeWidth="18" />
                {/* Occupied arc */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--success)" strokeWidth="18"
                  strokeDasharray={`${(occupiedRooms/totalRooms)*314} 314`}
                  strokeDashoffset="0" transform="rotate(-90 60 60)" />
                {/* Available arc */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" strokeWidth="18"
                  strokeDasharray={`${(availableRooms/totalRooms)*314} 314`}
                  strokeDashoffset={`-${(occupiedRooms/totalRooms)*314}`} transform="rotate(-90 60 60)" />
                <text x="60" y="55" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--ink)' }}>{occupiedRooms}</text>
                <text x="60" y="70" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--ash)' }}>occupied</text>
              </svg>
            </div>
            {[
              { label: 'Occupied',    count: occupiedRooms,    color: 'var(--success)' },
              { label: 'Available',   count: availableRooms,   color: 'var(--primary)' },
              { label: 'Maintenance', count: maintenanceRooms, color: 'var(--warning)' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full" style={{ width: 8, height: 8, background: item.color, flexShrink: 0 }} />
                  <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{item.label}</span>
                </div>
                <span className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.count} rooms</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Rental Requests */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Recent Requests</h2>
              <Link to="/landlord/requests" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
            </div>
            {MOCK_REQUESTS.map((req, i) => (
              <Link key={req.id} to={`/landlord/requests/${req.id}`}
                className="flex items-center justify-between py-3 border-b transition-colors"
                style={{ textDecoration: 'none', borderColor: i < MOCK_REQUESTS.length - 1 ? 'var(--hairline)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full flex items-center justify-center text-sm"
                    style={{ width: 32, height: 32, background: 'var(--surface-bone)', flexShrink: 0 }}>👤</div>
                  <div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{req.tenantName}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{req.roomNumber} · {relTime(req.createdAt)}</p>
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </Link>
            ))}
          </div>

          {/* Open Maintenance */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Open Tickets</h2>
              <Link to="/landlord/maintenance" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
            </div>
            {MOCK_MAINTENANCE.filter(t => t.status !== 'CLOSED').slice(0, 4).map((ticket, i) => (
              <Link key={ticket.id} to={`/landlord/maintenance/${ticket.id}`}
                className="flex items-center justify-between py-3 border-b transition-colors"
                style={{ textDecoration: 'none', borderColor: i < 3 ? 'var(--hairline)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔧</span>
                  <div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{ticket.title}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Room {ticket.roomNumber} · {ticket.tenantName}</p>
                  </div>
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
