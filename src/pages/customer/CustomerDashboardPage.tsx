import { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

// ── Shared types ──────────────────────────────────────────────────────────────
interface Booking {
  id: string; roomNumber: string; roomType: string; propertyName: string;
  checkInDate: string; checkOutDate: string; status: string; totalAmount: number;
}
interface Notification {
  id: string; title: string; content: string; type: string; isRead: boolean; createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const CUSTOMER_NAME = 'Nguyễn Văn An';
const CUSTOMER_EMAIL = 'an.nguyen@email.com';

const ACTIVE_BOOKINGS: Booking[] = [
  { id: 'B001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', status: 'CONFIRMED', totalAmount: 7500000 },
  { id: 'B002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', status: 'PENDING_DEPOSIT', totalAmount: 2400000 },
];

const RECENT_NOTIFICATIONS: Notification[] = [
  { id: 'N1', title: 'Booking Confirmed', content: 'Your booking for Villa 01 has been confirmed.', type: 'BOOKING_CONFIRMED', isRead: false, createdAt: '2026-06-14T10:30:00' },
  { id: 'N2', title: 'Contract Generated', content: 'Your accommodation contract has been sent to your email.', type: 'CONTRACT_GENERATED', isRead: false, createdAt: '2026-06-14T10:32:00' },
  { id: 'N3', title: 'Payment Confirmed', content: 'Your deposit payment of ₫3,000,000 has been verified.', type: 'PAYMENT_CONFIRMED', isRead: true, createdAt: '2026-06-13T14:00:00' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending Deposit' },
    CONFIRMED:       { cls: 'badge-success', label: 'Confirmed' },
    CHECKED_IN:      { cls: 'badge-info',    label: 'Checked In' },
    CHECKED_OUT:     { cls: 'badge-purple',  label: 'Checked Out' },
    CANCELLED:       { cls: 'badge-error',   label: 'Cancelled' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { bg: string; icon: string }> = {
    BOOKING_CONFIRMED:   { bg: '#dcfce7', icon: '✓' },
    CONTRACT_GENERATED:  { bg: '#dbeafe', icon: '📄' },
    PAYMENT_CONFIRMED:   { bg: '#ede9fe', icon: '₫' },
    MAINTENANCE_UPDATED: { bg: '#fef3c7', icon: '🔧' },
    SYSTEM:              { bg: 'var(--surface-bone)', icon: '🔔' },
  };
  const s = map[type] || { bg: 'var(--surface-bone)', icon: '🔔' };
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
      {s.icon}
    </div>
  );
}

function KpiCard({ value, label, sub, color = 'var(--ink)', icon }: { value: string | number; label: string; sub?: string; color?: string; icon: React.ReactNode }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--charcoal)' }}>{icon}</div>
      </div>
      <div>
        <div className="kpi-value" style={{ color }}>{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="body-sm text-charcoal" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const upcomingCheckin = ACTIVE_BOOKINGS.find(b => b.status === 'CONFIRMED');
  const pendingPayments = ACTIVE_BOOKINGS.filter(b => b.status === 'PENDING_DEPOSIT').length;
  const unread = RECENT_NOTIFICATIONS.filter(n => !n.isRead).length;

  function relativeTime(dt: string) {
    const diff = (Date.now() - new Date(dt).getTime()) / 1000;
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <CustomerLayout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="heading-md" style={{ marginBottom: 4 }}>Welcome back, {CUSTOMER_NAME.split(' ')[0]} 👋</h1>
        <p className="body-md text-charcoal">Here's an overview of your current bookings and account.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 32 }}>
        <KpiCard
          value={ACTIVE_BOOKINGS.length}
          label="Active Bookings"
          color="var(--primary)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <KpiCard
          value={upcomingCheckin ? upcomingCheckin.checkInDate : '—'}
          label="Next Check-in"
          sub={upcomingCheckin?.propertyName || 'No upcoming'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
        />
        <KpiCard
          value={pendingPayments}
          label="Pending Payments"
          color={pendingPayments > 0 ? 'var(--warning)' : 'var(--ink)'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
        <KpiCard
          value={unread}
          label="Unread Notifications"
          color={unread > 0 ? 'var(--info)' : 'var(--ink)'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>
        {/* Active Bookings */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-sm">Active Bookings</h2>
            <Link to="/customer/bookings" className="btn-ghost btn-sm">View all →</Link>
          </div>

          {ACTIVE_BOOKINGS.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <h3 className="heading-sm" style={{ marginBottom: 8 }}>No active bookings</h3>
              <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Ready to plan your next getaway?</p>
              <Link to="/rooms" className="btn-primary">Browse Rooms</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACTIVE_BOOKINGS.map(b => (
                <div key={b.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{b.roomNumber} — {b.roomType}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>📍 {b.propertyName}</p>
                    <p className="body-sm text-charcoal">
                      📅 {b.checkInDate} → {b.checkOutDate}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>₫{b.totalAmount.toLocaleString()}</p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {b.status === 'PENDING_DEPOSIT' && (
                        <Link to={`/customer/payments/${b.id}/pay`} className="btn-primary btn-sm">Pay Deposit</Link>
                      )}
                      <Link to={`/customer/bookings/${b.id}`} className="btn-outline btn-sm">Details</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-sm">Notifications</h2>
            <Link to="/customer/notifications" className="btn-ghost btn-sm">All →</Link>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {RECENT_NOTIFICATIONS.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--charcoal)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p className="body-sm">All caught up!</p>
              </div>
            ) : (
              RECENT_NOTIFICATIONS.map((n, i) => (
                <Link key={n.id} to={`/customer/notifications/${n.id}`} style={{
                  display: 'flex', gap: 12, padding: '14px 16px', textDecoration: 'none',
                  borderBottom: i < RECENT_NOTIFICATIONS.length - 1 ? '1px solid var(--hairline)' : 'none',
                  background: n.isRead ? 'var(--surface-card)' : 'var(--surface-bone)',
                  borderLeft: n.isRead ? 'none' : '3px solid var(--primary)',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f0e8')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'var(--surface-card)' : 'var(--surface-bone)')}>
                  <NotifIcon type={n.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: 'var(--ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</p>
                    <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 3 }}>{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: 20 }}>
            <h3 className="heading-sm" style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/rooms" className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Browse Rooms
              </Link>
              <Link to="/customer/maintenance/create" className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Report Maintenance Issue
              </Link>
              <Link to="/customer/profile/edit" className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
