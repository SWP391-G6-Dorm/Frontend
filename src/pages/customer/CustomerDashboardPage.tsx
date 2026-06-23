import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { useAuthStore } from '../../store/authStore';
import {
  fetchCustomerDashboard,
  type CustomerDashboardData,
  type UpcomingEvent,
} from '../../api/customersApi';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Chờ cọc' },
    CONFIRMED:       { cls: 'badge-success', label: 'Đã xác nhận' },
    CHECKED_IN:      { cls: 'badge-info',    label: 'Đang ở' },
    CHECKED_OUT:     { cls: 'badge-purple',  label: 'Đã trả phòng' },
    CANCELLED:       { cls: 'badge-error',   label: 'Đã hủy' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { bg: string; icon: string }> = {
    BOOKING_CONFIRMED:   { bg: '#dcfce7', icon: '✓' },
    BOOKING_CANCELLED:   { bg: '#fee2e2', icon: '✕' },
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

function KpiCard({ value, label, sub, color = 'var(--ink)', icon }: {
  value: string | number; label: string; sub?: string; color?: string; icon: React.ReactNode;
}) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--charcoal)' }}>{icon}</div>
      </div>
      <div>
        <div className="kpi-value" style={{ color, fontSize: typeof value === 'number' ? undefined : 22 }}>{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="body-sm text-charcoal" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLabel(n: number) {
  if (n === 0) return 'Hôm nay';
  if (n === 1) return 'Ngày mai';
  return `Còn ${n} ngày`;
}

function EventCard({ title, event, type }: { title: string; event: UpcomingEvent | null; type: 'checkin' | 'checkout' }) {
  const accent = type === 'checkin' ? 'var(--success)' : 'var(--info)';
  const bg = type === 'checkin' ? '#f0fdf4' : '#eff6ff';

  if (!event) {
    return (
      <div className="card" style={{ padding: 20, background: 'var(--surface-bone)', border: '1px dashed var(--hairline)' }}>
        <p className="body-sm text-charcoal" style={{ fontWeight: 600, marginBottom: 4 }}>{title}</p>
        <p className="body-sm text-charcoal">Không có lịch sắp tới</p>
      </div>
    );
  }

  return (
    <Link
      to={`/customer/bookings/${event.bookingId}`}
      className="card"
      style={{
        padding: 20, textDecoration: 'none', display: 'block',
        background: bg, border: `1px solid ${accent}33`,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <span className="badge badge-neutral" style={{ fontSize: 11 }}>{daysLabel(event.daysUntil)}</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>{event.roomNumber}</p>
      <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>📍 {event.propertyName}</p>
      <p style={{ fontWeight: 600, fontSize: 14, color: accent }}>📅 {formatDate(event.date)}</p>
    </Link>
  );
}

function relativeTime(dt: string) {
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60)   return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function CustomerDashboardPage() {
  const fullName = useAuthStore(s => s.fullName);
  const firstName = fullName?.split(' ').slice(-1)[0] || 'bạn';

  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchCustomerDashboard()
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Không tải được dữ liệu dashboard. Vui lòng thử lại.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const checkInDisplay = loading ? '…' : (
    data?.upcomingCheckIn
      ? formatDate(data.upcomingCheckIn.date)
      : '—'
  );
  const checkOutDisplay = loading ? '…' : (
    data?.upcomingCheckOut
      ? formatDate(data.upcomingCheckOut.date)
      : '—'
  );

  return (
    <CustomerLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 className="heading-md" style={{ marginBottom: 4 }}>Xin chào, {firstName} 👋</h1>
        <p className="body-md text-charcoal">Tổng quan đặt phòng, check-in/out sắp tới và hoạt động gần đây.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

      {/* Quick Stats — 4 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
        <KpiCard
          value={loading ? '…' : (data?.activeBookings ?? 0)}
          label="Booking đang active"
          color="var(--primary)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <KpiCard
          value={checkInDisplay}
          label="Check-in sắp tới"
          sub={data?.upcomingCheckIn ? `${data.upcomingCheckIn.roomNumber} · ${daysLabel(data.upcomingCheckIn.daysUntil)}` : 'Chưa có'}
          color="var(--success)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
        />
        <KpiCard
          value={checkOutDisplay}
          label="Check-out sắp tới"
          sub={data?.upcomingCheckOut ? `${data.upcomingCheckOut.roomNumber} · ${daysLabel(data.upcomingCheckOut.daysUntil)}` : 'Chưa có'}
          color="var(--info)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
        />
        <KpiCard
          value={loading ? '…' : (data?.pendingPayments ?? 0)}
          label="Thanh toán chờ xử lý"
          color={(data?.pendingPayments ?? 0) > 0 ? 'var(--warning)' : 'var(--ink)'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
      </div>

      {/* Check-in / Check-out highlight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <EventCard title="Check-in sắp tới" event={data?.upcomingCheckIn ?? null} type="checkin" />
        <EventCard title="Check-out sắp tới" event={data?.upcomingCheckOut ?? null} type="checkout" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>
        {/* Upcoming Bookings */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-sm">Booking sắp tới</h2>
            <Link to="/customer/bookings" className="btn-ghost btn-sm">Xem tất cả →</Link>
          </div>

          {loading ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <p className="body-md text-charcoal">Đang tải...</p>
            </div>
          ) : !data?.upcomingBookings?.length ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <h3 className="heading-sm" style={{ marginBottom: 8 }}>Chưa có booking sắp tới</h3>
              <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Khám phá homestay & resort ngay hôm nay!</p>
              <Link to="/rooms" className="btn-primary">Tìm phòng</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.upcomingBookings.map(b => (
                <div key={b.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{b.roomNumber} — {b.roomType}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>📍 {b.propertyName}</p>
                    <p className="body-sm text-charcoal">
                      📅 {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      {b.status === 'CONFIRMED' && (
                        <span style={{ marginLeft: 8, color: 'var(--success)', fontWeight: 600 }}>
                          · Check-in {daysLabel(Math.max(0, Math.ceil((new Date(b.checkInDate).getTime() - Date.now()) / 86400000)))}
                        </span>
                      )}
                      {b.status === 'CHECKED_IN' && (
                        <span style={{ marginLeft: 8, color: 'var(--info)', fontWeight: 600 }}>
                          · Check-out {daysLabel(Math.max(0, Math.ceil((new Date(b.checkOutDate).getTime() - Date.now()) / 86400000)))}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>₫{Number(b.totalAmount).toLocaleString('vi-VN')}</p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {b.status === 'PENDING_DEPOSIT' && (
                        <Link to={`/customer/payments/${b.id}/pay`} className="btn-primary btn-sm">Thanh toán cọc</Link>
                      )}
                      <Link to={`/customer/bookings/${b.id}`} className="btn-outline btn-sm">Chi tiết</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Notifications + Quick Actions */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-sm">
              Thông báo
              {!loading && (data?.unreadNotifications ?? 0) > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: 8, fontSize: 11 }}>{data!.unreadNotifications} mới</span>
              )}
            </h2>
            <Link to="/customer/notifications" className="btn-ghost btn-sm">Tất cả →</Link>
          </div>

          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            {loading ? (
              <div style={{ padding: 28, textAlign: 'center' }}><p className="body-sm text-charcoal">Đang tải...</p></div>
            ) : !data?.recentNotifications?.length ? (
              <div style={{ padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p className="body-sm text-charcoal">Không có thông báo mới</p>
              </div>
            ) : (
              data.recentNotifications.map((n, i) => (
                <Link key={n.id} to={`/customer/notifications/${n.id}`} style={{
                  display: 'flex', gap: 12, padding: '14px 16px', textDecoration: 'none',
                  borderBottom: i < data.recentNotifications.length - 1 ? '1px solid var(--hairline)' : 'none',
                  background: n.isRead ? 'var(--surface-card)' : 'var(--surface-bone)',
                  borderLeft: n.isRead ? 'none' : '3px solid var(--primary)',
                }}>
                  <NotifIcon type={n.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: 'var(--ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</p>
                    <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 3 }}>{relativeTime(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Extra quick stats */}
          {!loading && data && (
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <p className="body-sm text-charcoal" style={{ fontWeight: 600, marginBottom: 10 }}>Thống kê nhanh</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="body-sm text-charcoal">Ticket bảo trì mở</span>
                  <span style={{ fontWeight: 700 }}>{data.openTickets}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="body-sm text-charcoal">Thông báo chưa đọc</span>
                  <span style={{ fontWeight: 700, color: data.unreadNotifications > 0 ? 'var(--primary)' : undefined }}>{data.unreadNotifications}</span>
                </div>
              </div>
            </div>
          )}

          <h3 className="heading-sm" style={{ marginBottom: 12 }}>Thao tác nhanh</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/rooms" className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
              🔍 Tìm phòng
            </Link>
            <Link to="/customer/bookings" className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
              📋 Booking của tôi
            </Link>
            <Link to="/customer/maintenance/create" className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
              🔧 Báo cáo sự cố
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
