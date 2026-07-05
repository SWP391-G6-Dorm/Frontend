// ─── NotificationPages.tsx — SCR-14, 15 ──────────────────────────────────────
// Exports: NotificationCenterPage, NotificationDetailPage

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { notificationApi, Notification } from '../../api/notificationApi';

function NotifIcon({ type }: { type: string }) {
  const m: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    BOOKING_CONFIRMED:   { bg: '#dcfce7', color: '#2b9a66', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> },
    CONTRACT_GENERATED:  { bg: '#dbeafe', color: '#2563eb', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
    PAYMENT_CONFIRMED:   { bg: '#ede9fe', color: '#7c3aed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    MAINTENANCE_UPDATED: { bg: '#fef3c7', color: '#d97706', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
    SYSTEM:              { bg: '#f3f4f6', color: '#4b5563', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  };
  const s = m[type] || { bg: 'var(--surface-bone)', color: 'var(--charcoal)', icon: '🔔' };
  return (
    <div style={{ width: 42, height: 42, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: s.color }}>
      {s.icon}
    </div>
  );
}

function relTime(dt: string) {
  if (!dt) return '';
  const d = (Date.now() - new Date(dt).getTime()) / 1000;
  if (d < 60) return 'Just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ── SCR-14: Notification Center ───────────────────────────────────────────────
export function NotificationCenterPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phân trang
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 10;

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      console.error("Failed to load unread count", err);
    }
  };

  const fetchNotifications = async (targetPage: number, isLoadMore: boolean = false) => {
    if (targetPage === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await notificationApi.getNotifications({
        page: targetPage,
        size,
        unreadOnly: filter === 'UNREAD',
      });
      if (res.success) {
        if (isLoadMore) {
          setNotifs(prev => [...prev, ...res.data.content]);
        } else {
          setNotifs(res.data.content);
        }
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
      } else {
        setError(res.message || "Failed to load notifications");
      }
    } catch (err) {
      setError("An error occurred while fetching notifications");
    } finally {
      setLoading(false);
    }
  };

  // Fetch khi mount hoặc khi thay đổi tab/filter
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications(0, false);
  }, [filter]);

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllRead = async () => {
    try {
      const res = await notificationApi.markAllRead();
      if (res.success) {
        setUnreadCount(0);
        // Cập nhật state locally
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
        if (filter === 'UNREAD') {
          setNotifs([]);
        }
        // Gọi custom event để thông báo cho CustomerLayout update badge chuông
        window.dispatchEvent(new Event('unreadCountChanged'));
      }
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleMarkRead = (id: string) => {
    // Cập nhật local state mượt mà trước khi load detail
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    // Dispatch event update badge
    setTimeout(() => {
      window.dispatchEvent(new Event('unreadCountChanged'));
    }, 100);
  };


  return (
    <CustomerLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="heading-md" style={{ marginBottom: 4 }}>Notifications</h1>
            {unreadCount > 0 && <p className="body-sm text-charcoal">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
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

        {loading && page === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p className="body-md text-charcoal">Loading notifications...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p className="body-md text-charcoal" style={{ color: 'var(--error)' }}>{error}</p>
            <button onClick={() => fetchNotifications(0, false)} className="btn-outline btn-sm" style={{ marginTop: 12 }}>Retry</button>
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <h3 className="heading-sm" style={{ marginBottom: 8 }}>All caught up!</h3>
            <p className="body-md text-charcoal" style={{ marginBottom: 0 }}>No {filter === 'UNREAD' ? 'unread ' : ''}notifications.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ overflow: 'hidden' }}>
              {notifs.map((n, i) => (
                <Link key={n.id} to={`/customer/notifications/${n.id}`}
                  onClick={() => handleMarkRead(n.id)}
                  style={{
                    display: 'flex', gap: 14, padding: '16px 20px', textDecoration: 'none',
                    background: n.isRead ? 'var(--surface-card)' : 'var(--surface-bone)',
                    borderBottom: i < notifs.length - 1 ? '1px solid var(--hairline)' : 'none',
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

            {/* Load More Button */}
            {page < totalPages - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <button
                  onClick={() => fetchNotifications(page + 1, true)}
                  className="btn-outline btn-sm"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

// ── SCR-15: Notification Detail ───────────────────────────────────────────────
export function NotificationDetailPage() {
  const { id } = useParams();
  const [notif, setNotif] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await notificationApi.getNotificationDetail(id);
        if (res.success) {
          setNotif(res.data);
          // Gửi event báo cho Layout cập nhật lại badge chuông khi xem chi tiết xong
          window.dispatchEvent(new Event('unreadCountChanged'));
        } else {
          setError(res.message || "Failed to load notification details");
        }
      } catch (err) {
        setError("An error occurred while fetching notification details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/notifications" className="text-primary" style={{ textDecoration: 'none' }}>Notifications</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Detail</span>
        </div>

        {loading ? (
          <div className="card-lg" style={{ padding: 40, textAlign: 'center' }}>
            <p className="body-md text-charcoal">Loading notification details...</p>
          </div>
        ) : error || !notif ? (
          <div className="card-lg" style={{ padding: 40, textAlign: 'center' }}>
            <p className="body-md text-charcoal" style={{ color: 'var(--error)' }}>{error || "Notification not found"}</p>
            <Link to="/customer/notifications" className="btn-outline btn-sm" style={{ marginTop: 16, display: 'inline-block' }}>← Back to Notifications</Link>
          </div>
        ) : (
          <div className="card-lg" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <NotifIcon type={notif.type} />
              <div style={{ flex: 1 }}>
                <h1 className="heading-md" style={{ marginBottom: 4 }}>{notif.title}</h1>
                <p className="body-sm text-charcoal">
                  {notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : ''}
                </p>
              </div>
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            <p className="body-lg text-body" style={{ lineHeight: 1.75, marginBottom: 28 }}>{notif.content}</p>

            {/* Custom navigation helper depending on type */}
            {notif.relatedEntityId && (
              <div style={{ marginBottom: 28 }}>
                {notif.type === 'BOOKING_CONFIRMED' && (
                  <Link to={`/customer/bookings/${notif.relatedEntityId}`} className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    View Related Booking
                  </Link>
                )}
                {notif.type === 'CONTRACT_GENERATED' && (
                  <Link to={`/customer/contracts/${notif.relatedEntityId}`} className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    View Related Contract
                  </Link>
                )}
                {notif.type === 'MAINTENANCE_UPDATED' && (
                  <Link to={`/customer/maintenance/${notif.relatedEntityId}`} className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    View Related Ticket
                  </Link>
                )}
                {notif.type === 'PAYMENT_CONFIRMED' && (
                  <Link to={`/customer/payments`} className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    View Payment History
                  </Link>
                )}
              </div>
            )}

            <Link to="/customer/notifications" className="btn-outline btn-sm">← Back to Notifications</Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
