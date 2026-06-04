// SCR-71 — Admin Dashboard
// Entity: User · Property · Room · Bill · Complaint · AuditLog
// KPIs: Total Active Users · Total Properties · Platform MTD Revenue · Open Complaints
// Charts: UserGrowthChart (area) · OccupancyChart (donut)
// Bottom: Recent Complaints mini-table · Recent AuditLog feed

import AdminLayout from '../../layouts/AdminLayout';
import { Link } from 'react-router-dom';
import {
  KpiCard, StatusBadge, RoleBadge,
  formatPrice, relTime,
  MOCK_ADMIN_USERS, MOCK_COMPLAINTS, MOCK_AUDIT_LOGS, MOCK_PLATFORM_PROPERTIES,
  USER_GROWTH, actionBorderColor, actionBadgeStyle,
} from './shared';

const activeUsers      = MOCK_ADMIN_USERS.filter(u => u.status === 'ACTIVE').length;
const activeProperties = MOCK_PLATFORM_PROPERTIES.filter(p => p.status === 'ACTIVE').length;
const openComplaints   = MOCK_COMPLAINTS.filter(c => c.status === 'OPEN').length;
const mtdRevenue       = 148000000; // sum(Bill.totalAmount where status=PAID, Nov 2025)

// Platform-wide room status (aggregated mock)
const roomStats = { occupied: 10, available: 4, maintenance: 1, reserved: 2, total: 17 };

// Chart max
const maxUsers = Math.max(...USER_GROWTH.map(d => d.total));

export default function AdminDashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 animate-fade-up">
        {/* Greeting */}
        <div>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{greeting}, System Admin 👋</h1>
          <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp;Admin Console Overview
          </p>
        </div>

        {/* KPI Row — 4 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon="👥"
            label="Total Active Users"
            value={activeUsers.toLocaleString()}
            sub={`${MOCK_ADMIN_USERS.length} total registered`}
            trend="+12% this month"
          />
          <KpiCard
            icon="🏢"
            label="Total Properties"
            value={activeProperties}
            sub={`${MOCK_PLATFORM_PROPERTIES.length} total on platform`}
            trend="+2 this month"
          />
          <KpiCard
            icon="💰"
            label="Platform MTD Revenue"
            value={`${(mtdRevenue / 1000000).toFixed(0)}M`}
            sub="November 2025 (Bill.status=PAID)"
            color="var(--success)"
            trend="+8.5% vs Oct"
          />
          <KpiCard
            icon="🚩"
            label="Open Complaints"
            value={openComplaints}
            sub={openComplaints > 0 ? 'Needs attention' : 'All handled'}
            color={openComplaints > 0 ? 'var(--error)' : 'var(--success)'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* UserGrowthChart — area chart mock (2/3 width) */}
          <div className="card lg:col-span-2" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>User Growth</h2>
                <p className="caption" style={{ color: 'var(--ash)' }}>Three series: Total · Tenant · Landlord (User.createdAt month-grouped)</p>
              </div>
              <span className="caption px-3 py-1 rounded-full" style={{ background: 'var(--surface-bone)', color: 'var(--charcoal)' }}>Last 12 months</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-5 mb-4">
              {[
                { label: 'Total',    color: '#1E293B' },
                { label: 'Tenant',  color: '#0891B2' },
                { label: 'Landlord',color: '#EA5A1E' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="rounded-full" style={{ width: 8, height: 8, background: s.color }} />
                  <span className="caption" style={{ color: 'var(--charcoal)' }}>{s.label}</span>
                </div>
              ))}
            </div>
            {/* SVG area chart */}
            <svg width="100%" viewBox="0 0 600 140" preserveAspectRatio="none" style={{ height: 140 }}>
              {/* Grid lines */}
              {[0, 35, 70, 105, 140].map(y => (
                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--hairline)" strokeWidth="1" />
              ))}
              {/* Total area */}
              <polyline
                fill="none" stroke="#1E293B" strokeWidth="2"
                points={USER_GROWTH.map((d, i) => `${(i / 11) * 600},${140 - (d.total / maxUsers) * 130}`).join(' ')}
              />
              {/* Tenant area */}
              <polyline
                fill="none" stroke="#0891B2" strokeWidth="2" strokeDasharray="4 2"
                points={USER_GROWTH.map((d, i) => `${(i / 11) * 600},${140 - (d.tenant / maxUsers) * 130}`).join(' ')}
              />
              {/* Landlord area */}
              <polyline
                fill="none" stroke="#EA5A1E" strokeWidth="2" strokeDasharray="2 2"
                points={USER_GROWTH.map((d, i) => `${(i / 11) * 600},${140 - (d.landlord / maxUsers) * 130}`).join(' ')}
              />
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between mt-1">
              {USER_GROWTH.filter((_, i) => i % 3 === 0).map(d => (
                <span key={d.month} className="caption" style={{ color: 'var(--ash)', fontSize: 10 }}>{d.month}</span>
              ))}
            </div>
          </div>

          {/* OccupancyChart — platform-wide donut (1/3 width) */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm mb-1" style={{ color: 'var(--ink)' }}>Platform Occupancy</h2>
            <p className="caption mb-4" style={{ color: 'var(--ash)' }}>Room.status across all properties</p>
            <div className="flex justify-center mb-4">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-bone)" strokeWidth="18" />
                {/* Occupied */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#16A34A" strokeWidth="18"
                  strokeDasharray={`${(roomStats.occupied / roomStats.total) * 314} 314`}
                  strokeDashoffset="0" transform="rotate(-90 60 60)" />
                {/* Available */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#EA5A1E" strokeWidth="18"
                  strokeDasharray={`${(roomStats.available / roomStats.total) * 314} 314`}
                  strokeDashoffset={`-${(roomStats.occupied / roomStats.total) * 314}`} transform="rotate(-90 60 60)" />
                {/* Maintenance */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#D97706" strokeWidth="18"
                  strokeDasharray={`${(roomStats.maintenance / roomStats.total) * 314} 314`}
                  strokeDashoffset={`-${((roomStats.occupied + roomStats.available) / roomStats.total) * 314}`} transform="rotate(-90 60 60)" />
                <text x="60" y="55" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--ink)' }}>{roomStats.occupied}</text>
                <text x="60" y="70" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--ash)' }}>occupied</text>
              </svg>
            </div>
            {[
              { label: 'Occupied',    count: roomStats.occupied,    color: '#16A34A' },
              { label: 'Available',   count: roomStats.available,   color: '#EA5A1E' },
              { label: 'Maintenance', count: roomStats.maintenance, color: '#D97706' },
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

        {/* Bottom Row — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Complaints mini-table */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Recent Complaints</h2>
              <Link to="/admin/complaints" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
            </div>
            {/* Mini table header */}
            <div className="grid gap-0 border-b mb-1" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', borderColor: 'var(--hairline)' }}>
              {['Subject', 'Reporter', 'Status', 'Submitted'].map(col => (
                <div key={col} className="label-sm px-2 py-2" style={{ color: 'var(--charcoal)', fontSize: 11 }}>{col}</div>
              ))}
            </div>
            {MOCK_COMPLAINTS.slice(0, 5).map((c, i) => (
              <Link
                key={c.id}
                to={`/admin/complaints/${c.id}`}
                className="grid py-2.5 border-b transition-colors"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  textDecoration: 'none',
                  borderColor: i < 4 ? 'var(--hairline)' : 'transparent',
                  borderLeft: c.status === 'OPEN' ? '3px solid #EA5A1E' : '3px solid transparent',
                  paddingLeft: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <p className="body-sm font-medium truncate pr-2" style={{ color: 'var(--ink)' }}>{c.subject}</p>
                <p className="caption truncate" style={{ color: 'var(--charcoal)' }}>{c.userName.split(' ').slice(-1)[0]}</p>
                <div><StatusBadge status={c.status} /></div>
                <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(c.createdAt)}</p>
              </Link>
            ))}
          </div>

          {/* Recent Activity feed — AuditLog last 10 */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Recent Activity</h2>
              <Link to="/admin/logs" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
            </div>
            <div className="flex flex-col gap-0">
              {MOCK_AUDIT_LOGS.slice(0, 8).map((log, i) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2.5 border-b"
                  style={{ borderColor: i < 7 ? 'var(--hairline)' : 'transparent' }}
                >
                  {/* Actor avatar */}
                  <img
                    src={`https://i.pravatar.cc/32?img=${log.actorId.replace('u-', '')}`}
                    alt={log.actorName}
                    className="rounded-full flex-shrink-0"
                    style={{ width: 28, height: 28 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{log.actorName}</span>
                      <span style={actionBadgeStyle(log.action)}>{log.action}</span>
                      <span className="caption" style={{ color: 'var(--ash)' }}>{log.entityName}</span>
                    </div>
                    <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>{relTime(log.createdAt)}</p>
                  </div>
                  <div style={{
                    width: 3, height: 36, borderRadius: 2, flexShrink: 0,
                    background: actionBorderColor(log.action),
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
