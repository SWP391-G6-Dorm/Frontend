import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-14 — Notification Center
// Entity: Notification
// Fields: Notification.id · title · content · isRead · createdAt
// Filter: isRead (All / Unread)

const MOCK_NOTIFICATIONS = [
  { id: 'n-001', title: 'Your October bill is ready',         content: 'Your bill for October 2025 totalling ₫4,200,000 is now available. Due date: Nov 10, 2025.',               isRead: false, createdAt: '2025-10-28T08:30:00Z', type: 'bill' },
  { id: 'n-002', title: 'Maintenance ticket updated',         content: 'Your maintenance ticket #MT-042 (Broken AC) has been updated to IN_PROGRESS.',                           isRead: false, createdAt: '2025-10-26T15:00:00Z', type: 'maintenance' },
  { id: 'n-003', title: 'Contract renewal reminder',          content: 'Your contract (C-2024-001) expires on Jan 31, 2026. Please contact your landlord to discuss renewal.',    isRead: false, createdAt: '2025-10-22T09:00:00Z', type: 'contract' },
  { id: 'n-004', title: 'Payment confirmed',                  content: 'Your payment of ₫3,800,000 for September 2025 has been confirmed. Transaction: TXN-8821.',               isRead: true,  createdAt: '2025-10-01T10:30:00Z', type: 'payment' },
  { id: 'n-005', title: 'Rental request approved',            content: 'Congratulations! Your rental request for Room A-301 at Sunset Apartments has been approved.',              isRead: true,  createdAt: '2025-09-15T14:00:00Z', type: 'rental' },
  { id: 'n-006', title: 'Viewing appointment confirmed',      content: 'Your viewing appointment for Room B-102 on Sep 10, 2025 at 10:00 AM has been confirmed.',                isRead: true,  createdAt: '2025-09-08T11:00:00Z', type: 'viewing' },
];

const TYPE_ICON: Record<string, string> = {
  bill: '💳', maintenance: '🔧', contract: '📄', payment: '✅', rental: '🏠', viewing: '📅', default: '🔔',
};

const TYPE_COLOR: Record<string, string> = {
  bill: '#fde8e3', maintenance: '#fef3c7', contract: '#e0f2fe',
  payment: '#dcfce7', rental: '#fde8e3', viewing: '#ede9fe', default: 'var(--surface-bone)',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 30) return new Date(iso).toLocaleDateString('en-GB');
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const displayed = tab === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} unread</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="btn-ghost"
              style={{ fontSize: 13, color: 'var(--primary)' }}
            >
              ✓ Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unread'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="btn-ghost rounded-full font-semibold text-sm px-4"
              style={{
                height: 36,
                background: tab === t ? 'var(--surface-dark)' : 'transparent',
                color: tab === t ? 'var(--on-dark)' : 'var(--charcoal)',
              }}
            >
              {t === 'all' ? 'All' : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {displayed.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>You're all caught up ✓</h3>
            <p className="body-md" style={{ color: 'var(--charcoal)' }}>No {tab === 'unread' ? 'unread ' : ''}notifications.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {displayed.map((notif, i) => (
              <div
                key={notif.id}
                onClick={() => { markRead(notif.id); navigate(`/tenant/notifications/${notif.id}`); }}
                className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{
                  background: notif.isRead ? 'var(--surface-card)' : '#fdf6f0',
                  borderBottom: i < displayed.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = notif.isRead ? 'var(--surface-card)' : '#fdf6f0')}
              >
                {/* Type icon */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full text-base"
                  style={{ width: 40, height: 40, background: TYPE_COLOR[notif.type] ?? TYPE_COLOR.default }}
                >
                  {TYPE_ICON[notif.type] ?? TYPE_ICON.default}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="body-md"
                    style={{
                      color: 'var(--ink)',
                      fontWeight: notif.isRead ? 400 : 600,
                      marginBottom: 2,
                    }}
                  >
                    {notif.title}
                  </p>
                  <p className="body-sm" style={{ color: 'var(--charcoal)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {notif.content}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <span className="caption" style={{ color: 'var(--ash)', whiteSpace: 'nowrap' }}>
                    {relativeTime(notif.createdAt)}
                  </span>
                  {!notif.isRead && (
                    <div className="rounded-full" style={{ width: 8, height: 8, background: 'var(--primary)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
