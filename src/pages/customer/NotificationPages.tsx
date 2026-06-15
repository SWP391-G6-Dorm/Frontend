// ─── NotificationPages.tsx — SCR-14, 15 ──────────────────────────────────────
// Exports: NotificationCenterPage, NotificationDetailPage

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const NOTIFS = [
  { id: 'N1', title: 'Booking Confirmed', content: 'Your booking B001 for Villa 01 at Sunset Resort Đà Nẵng has been confirmed. Check-in on July 10, 2026.', type: 'BOOKING_CONFIRMED', isRead: false, createdAt: '2026-06-14T10:30:00' },
  { id: 'N2', title: 'Contract Generated', content: 'Your accommodation contract for booking B001 has been generated and sent to your email address.', type: 'CONTRACT_GENERATED', isRead: false, createdAt: '2026-06-14T10:32:00' },
  { id: 'N3', title: 'Payment Verified', content: 'Your deposit payment of ₫3,000,000 for booking B001 has been verified by the manager.', type: 'PAYMENT_CONFIRMED', isRead: true, createdAt: '2026-06-13T14:00:00' },
  { id: 'N4', title: 'Maintenance Update', content: 'Your maintenance ticket M001 (Air conditioner) has been updated to IN PROGRESS.', type: 'MAINTENANCE_UPDATED', isRead: true, createdAt: '2026-06-14T08:00:00' },
];

function NotifIcon({ type }: { type: string }) {
  const m: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    BOOKING_CONFIRMED:   { bg: '#dcfce7', color: '#2b9a66', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> },
    CONTRACT_GENERATED:  { bg: '#dbeafe', color: '#2563eb', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
    PAYMENT_CONFIRMED:   { bg: '#ede9fe', color: '#7c3aed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    MAINTENANCE_UPDATED: { bg: '#fef3c7', color: '#d97706', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  };
  const s = m[type] || { bg: 'var(--surface-bone)', color: 'var(--charcoal)', icon: '🔔' };
  return (
    <div style={{ width: 42, height: 42, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: s.color }}>
      {s.icon}
    </div>
  );
}

function relTime(dt: string) {
  const d = (Date.now() - new Date(dt).getTime()) / 1000;
  if (d < 60) return 'Just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ── SCR-14: Notification Center ───────────────────────────────────────────────
export function NotificationCenterPage() {
  const [notifs, setNotifs] = useState(NOTIFS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const displayed = filter === 'UNREAD' ? notifs.filter(n => !n.isRead) : notifs;
  const unreadCount = notifs.filter(n => !n.isRead).length;

  function markAllRead() {
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
  }

  function markRead(id: string) {
    setNotifs(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="heading-md" style={{ marginBottom: 4 }}>Notifications</h1>
            {unreadCount > 0 && <p className="body-sm text-charcoal">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
          {(['ALL', 'UNREAD'] as const).map(tab => (
            <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
              {tab === 'ALL' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <h3 className="heading-sm" style={{ marginBottom: 8 }}>All caught up!</h3>
            <p className="body-md text-charcoal">No {filter === 'UNREAD' ? 'unread ' : ''}notifications.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {displayed.map((n, i) => (
              <Link key={n.id} to={`/customer/notifications/${n.id}`}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex', gap: 14, padding: '16px 20px', textDecoration: 'none',
                  background: n.isRead ? 'var(--surface-card)' : 'var(--surface-bone)',
                  borderBottom: i < displayed.length - 1 ? '1px solid var(--hairline)' : 'none',
                  borderLeft: n.isRead ? 'none' : '3px solid var(--primary)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f0e8')}
                onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'var(--surface-card)' : 'var(--surface-bone)')}>
                <NotifIcon type={n.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                    <p style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14, color: 'var(--ink)' }}>{n.title}</p>
                    {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</p>
                  <p style={{ fontSize: 11, color: 'var(--ash)' }}>{relTime(n.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

// ── SCR-15: Notification Detail ───────────────────────────────────────────────
export function NotificationDetailPage() {
  const { id } = useParams();
  const n = NOTIFS.find(x => x.id === id) || NOTIFS[0];

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/notifications" className="text-primary" style={{ textDecoration: 'none' }}>Notifications</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Detail</span>
        </div>

        <div className="card-lg" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
            <NotifIcon type={n.type} />
            <div style={{ flex: 1 }}>
              <h1 className="heading-md" style={{ marginBottom: 4 }}>{n.title}</h1>
              <p className="body-sm text-charcoal">{new Date(n.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: 20 }} />

          <p className="body-lg text-body" style={{ lineHeight: 1.75, marginBottom: 28 }}>{n.content}</p>

          <Link to="/customer/notifications" className="btn-outline btn-sm">← Back to Notifications</Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
