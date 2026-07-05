// ─── NotificationPages.tsx — SCR-13, 14 ──────────────────────────────────────
// Exports: NotificationCenterPage, NotificationDetailPage

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import ManagerLayout from '../../layouts/ManagerLayout';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import AdminLayout from '../../layouts/AdminLayout';
import Alert from '../../components/ui/Alert';
import { useAuthStore } from '../../store/authStore';
import { notificationApi, Notification } from '../../api/notificationApi';

function getNotifBase(role: string | null): string {
  switch (role) {
    case 'MANAGER':
      return '/manager/notifications';
    case 'EMPLOYEE':
      return '/employee/notifications';
    case 'ADMIN':
      return '/admin/notifications';
    default:
      return '/customer/notifications';
  }
}

function RoleLayout({ children }: { children: React.ReactNode }) {
  const role = useAuthStore(s => s.role);
  if (role === 'MANAGER') return <ManagerLayout>{children}</ManagerLayout>;
  if (role === 'EMPLOYEE') return <EmployeeLayout>{children}</EmployeeLayout>;
  if (role === 'ADMIN') return <AdminLayout>{children}</AdminLayout>;
  return <CustomerLayout>{children}</CustomerLayout>;
}

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
  if (d < 60) return 'Vừa xong';
  if (d < 3600) return `${Math.floor(d / 60)} phút trước`;
  if (d < 86400) return `${Math.floor(d / 3600)} giờ trước`;
  return `${Math.floor(d / 86400)} ngày trước`;
}

function formatNotifDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRelatedAction(
  role: string | null,
  type: Notification['type'],
  relatedEntityId: string,
): { to: string; label: string } | null {
  if (role === 'CUSTOMER') {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return { to: `/customer/bookings/${relatedEntityId}`, label: 'Xem booking liên quan' };
      case 'CONTRACT_GENERATED':
        return { to: `/customer/contracts/${relatedEntityId}`, label: 'Xem hợp đồng' };
      case 'PAYMENT_CONFIRMED':
        return { to: '/customer/payments', label: 'Xem thanh toán' };
      case 'MAINTENANCE_UPDATED':
        return { to: `/customer/maintenance/${relatedEntityId}`, label: 'Xem ticket bảo trì' };
      default:
        return null;
    }
  }
  if (role === 'MANAGER') {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return { to: `/manager/bookings/${relatedEntityId}`, label: 'Xem booking liên quan' };
      case 'MAINTENANCE_UPDATED':
        return { to: `/manager/maintenance/${relatedEntityId}`, label: 'Xem ticket bảo trì' };
      default:
        return null;
    }
  }
  return null;
}

// ── SCR-13: Notification Center ───────────────────────────────────────────────
export function NotificationCenterPage() {
  const role = useAuthStore(s => s.role);
  const notifBase = getNotifBase(role);

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
        setError(res.message || 'Không thể tải thông báo');
      }
    } catch {
      setError('Đã xảy ra lỗi khi tải thông báo. Vui lòng thử lại.');
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
    <RoleLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="heading-md" style={{ marginBottom: 4 }}>Thông báo</h1>
            {unreadCount > 0 && <p className="body-sm text-charcoal">{unreadCount} chưa đọc</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
          {(['ALL', 'UNREAD'] as const).map(tab => (
            <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
              {tab === 'ALL' ? 'Tất cả' : `Chưa đọc (${unreadCount})`}
            </button>
          ))}
        </div>

        {loading && page === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p className="body-md text-charcoal">Đang tải thông báo...</p>
          </div>
        ) : error ? (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <Alert variant="error" message={error} />
            <button
              type="button"
              onClick={() => fetchNotifications(0, false)}
              className="btn-outline btn-sm"
              style={{ marginTop: 16 }}
            >
              Thử lại
            </button>
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <h3 className="heading-sm" style={{ marginBottom: 8 }}>Bạn đã xem hết!</h3>
            <p className="body-md text-charcoal" style={{ marginBottom: 0 }}>
              {filter === 'UNREAD' ? 'Không có thông báo chưa đọc.' : 'Không có thông báo mới.'}
            </p>
          </div>
        ) : (
          <>
            <div className="card" style={{ overflow: 'hidden' }}>
              {notifs.map((n, i) => (
                <Link key={n.id} to={`${notifBase}/${n.id}`}
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
                  {loading ? 'Đang tải...' : 'Tải thêm'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </RoleLayout>
  );
}

// ── SCR-14: Notification Detail ───────────────────────────────────────────────
export function NotificationDetailPage() {
  const { id } = useParams();
  const role = useAuthStore(s => s.role);
  const notifBase = getNotifBase(role);

  const [notif, setNotif] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchDetail() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await notificationApi.getNotificationDetail(id);
        if (cancelled) return;
        if (res.success) {
          setNotif(res.data);
          window.dispatchEvent(new Event('unreadCountChanged'));
        } else {
          setError(res.message || 'Không thể tải chi tiết thông báo');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr?.response?.data?.message ?? 'Đã xảy ra lỗi khi tải chi tiết thông báo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDetail();
    return () => { cancelled = true; };
  }, [id]);

  const breadcrumbTitle = notif
    ? (notif.title.length > 40 ? `${notif.title.slice(0, 40)}…` : notif.title)
    : 'Chi tiết';
  const relatedAction = notif?.relatedEntityId
    ? getRelatedAction(role, notif.type, notif.relatedEntityId)
    : null;

  return (
    <RoleLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={notifBase} className="text-primary" style={{ textDecoration: 'none' }}>Thông báo</Link>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>{breadcrumbTitle}</span>
        </div>

        {loading ? (
          <div className="card-lg" style={{ padding: 40, textAlign: 'center' }}>
            <p className="body-md text-charcoal">Đang tải chi tiết thông báo...</p>
          </div>
        ) : error || !notif ? (
          <div>
            <Alert variant="error" message={error || 'Không tìm thấy thông báo'} />
            <Link to={notifBase} className="btn-outline btn-sm" style={{ marginTop: 16, display: 'inline-block' }}>
              ← Quay lại danh sách
            </Link>
          </div>
        ) : (
          <div className="card-lg" style={{ padding: 32, boxShadow: '0 4px 16px rgba(32,32,32,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <NotifIcon type={notif.type} />
              <div style={{ flex: 1 }}>
                <h1 className="heading-md" style={{ marginBottom: 4 }}>{notif.title}</h1>
                <p className="body-sm text-charcoal">
                  {notif.createdAt ? formatNotifDate(notif.createdAt) : ''}
                  {!notif.isRead && (
                    <span style={{ marginLeft: 8, color: 'var(--primary)', fontWeight: 600 }}>· Mới</span>
                  )}
                </p>
              </div>
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            <p className="body-lg text-body" style={{ lineHeight: 1.75, marginBottom: 28, whiteSpace: 'pre-wrap' }}>
              {notif.content}
            </p>

            {relatedAction && (
              <div style={{ marginBottom: 28 }}>
                <Link to={relatedAction.to} className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                  {relatedAction.label}
                </Link>
              </div>
            )}

            <Link to={notifBase} className="btn-outline btn-sm">← Quay lại danh sách</Link>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
