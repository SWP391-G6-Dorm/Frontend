import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faDoorOpen,
  faCircleCheck,
  faUser,
  faCalendarCheck,
  faCalendarXmark,
  faFileLines,
  faChartLine,
  faArrowsRotate,
  faCircleInfo,
  faCalendar,
  faChartArea,
  faChartPie,
  faPlus,
  faBookmark,
  faChartBar,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import ManagerLayout from '../../layouts/ManagerLayout';
import { managerApi, type DashboardData } from '../../api/managerApi';

// ── FontAwesome Icon components ───────────────────────────────────────────────

const Icons = {
  Property:      () => <FontAwesomeIcon icon={faHouse}          style={{ fontSize: 18 }} />,
  Room:          () => <FontAwesomeIcon icon={faDoorOpen}        style={{ fontSize: 18 }} />,
  Available:     () => <FontAwesomeIcon icon={faCircleCheck}     style={{ fontSize: 18 }} />,
  Occupied:      () => <FontAwesomeIcon icon={faUser}            style={{ fontSize: 18 }} />,
  CheckIn:       () => <FontAwesomeIcon icon={faCalendarCheck}   style={{ fontSize: 18 }} />,
  CheckOut:      () => <FontAwesomeIcon icon={faCalendarXmark}   style={{ fontSize: 18 }} />,
  Booking:       () => <FontAwesomeIcon icon={faFileLines}       style={{ fontSize: 18 }} />,
  Revenue:       () => <FontAwesomeIcon icon={faChartLine}       style={{ fontSize: 18 }} />,
  Refresh:       () => <FontAwesomeIcon icon={faArrowsRotate}    style={{ fontSize: 13 }} />,
  Alert:         () => <FontAwesomeIcon icon={faCircleInfo}      style={{ fontSize: 18 }} />,
  EmptyCalendar: () => <FontAwesomeIcon icon={faCalendar}        style={{ fontSize: 42 }} />,
  EmptyChart:    () => <FontAwesomeIcon icon={faChartArea}       style={{ fontSize: 42 }} />,
  EmptyPie:      () => <FontAwesomeIcon icon={faChartPie}        style={{ fontSize: 42 }} />,
  AddProperty:   () => <FontAwesomeIcon icon={faHouse}           style={{ fontSize: 14 }} />,
  AddRoom:       () => <FontAwesomeIcon icon={faPlus}            style={{ fontSize: 14 }} />,
  Bookings:      () => <FontAwesomeIcon icon={faBookmark}        style={{ fontSize: 14 }} />,
  Report:        () => <FontAwesomeIcon icon={faChartBar}        style={{ fontSize: 14 }} />,
  Customers:     () => <FontAwesomeIcon icon={faUsers}           style={{ fontSize: 14 }} />,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending Deposit' },
  CONFIRMED:       { cls: 'badge-success', label: 'Confirmed' },
  CHECKED_IN:      { cls: 'badge-info',    label: 'Checked In' },
  CHECKED_OUT:     { cls: 'badge-purple',  label: 'Checked Out' },
  CANCELLED:       { cls: 'badge-error',   label: 'Cancelled' },
  OPEN:            { cls: 'badge-warning', label: 'Open' },
  IN_PROGRESS:     { cls: 'badge-info',    label: 'In Progress' },
  RESOLVED:        { cls: 'badge-success', label: 'Resolved' },
  PENDING:         { cls: 'badge-warning', label: 'Pending Verify' },
  PAID:            { cls: 'badge-success', label: 'Paid' },
  FAILED:          { cls: 'badge-error',   label: 'Failed' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const v = STATUS_MAP[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${v.cls}`}>{v.label}</span>;
}

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor: string;
  sublabel?: string;
}

function KpiCard({ icon, iconBg, iconColor, label, value, valueColor }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="body-sm text-charcoal" style={{ fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div className="kpi-value" style={{ color: valueColor, fontSize: 28, lineHeight: 1.1 }}>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </div>
    </div>
  );
}

function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{
      background: 'var(--surface-card)', borderRadius: 14, height,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--hairline)', borderRadius: 8, padding: '8px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ color: 'var(--primary)' }}>₫{(payload[0].value / 1_000_000).toFixed(1)}M</p>
    </div>
  );
}

function OccupancyLabel({ cx, cy, percent }: { cx?: number; cy?: number; percent?: number }) {
  if (!percent || percent < 0.06) return null;
  return (
    <text x={cx} y={cy} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const [data, setData]             = useState<DashboardData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
        setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      } else {
        setError(res.message || 'Không thể tải dữ liệu dashboard.');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || 'Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  // ── KPI config ─────────────────────────────────────────────────────────────

  const kpiCards: KpiCardProps[] = data ? [
    {
      icon: <Icons.Property />, iconBg: '#fff1ee', iconColor: 'var(--primary)',
      label: 'Total Properties',
      value: data.kpis.totalProperties,
      valueColor: 'var(--ink)',
    },
    {
      icon: <Icons.Room />, iconBg: '#eff6ff', iconColor: '#2563EB',
      label: 'Total Rooms',
      value: data.kpis.totalRooms,
      valueColor: 'var(--ink)',
    },
    {
      icon: <Icons.Available />, iconBg: '#f0fdf4', iconColor: '#2b9a66',
      label: 'Available Rooms',
      value: data.kpis.availableRooms,
      valueColor: '#2b9a66',
    },
    {
      icon: <Icons.Occupied />, iconBg: '#fef2f2', iconColor: '#DC2626',
      label: 'Occupied Rooms',
      value: data.kpis.occupiedRooms,
      valueColor: '#DC2626',
    },
    {
      icon: <Icons.CheckIn />, iconBg: '#eff6ff', iconColor: '#2563EB',
      label: 'Check-ins Today',
      value: data.kpis.checkInsToday,
      valueColor: '#2563EB',
    },
    {
      icon: <Icons.CheckOut />, iconBg: '#fffbeb', iconColor: '#D97706',
      label: 'Check-outs Today',
      value: data.kpis.checkOutsToday,
      valueColor: '#D97706',
    },
    {
      icon: <Icons.Booking />, iconBg: '#f5f3ff', iconColor: '#7c3aed',
      label: 'Bookings This Month',
      value: data.kpis.bookingsThisMonth,
      valueColor: 'var(--ink)',
    },
    {
      icon: <Icons.Revenue />, iconBg: '#fff1ee', iconColor: 'var(--primary)',
      label: 'Monthly Revenue',
      value: `₫${(data.kpis.monthlyRevenue / 1_000_000).toFixed(1)}M`,
      valueColor: 'var(--primary)',
    },
  ] : [];

  // ── Occupancy donut data ───────────────────────────────────────────────────

  const occupancyPieData = data
    ? [
        { name: 'Available',   value: data.occupancyData.available,      color: '#2b9a66' },
        { name: 'Occupied',    value: data.occupancyData.occupied,        color: '#DC2626' },
        { name: 'Maintenance', value: data.occupancyData.maintenance,     color: '#6b7280' },
        { name: 'Pending',     value: data.occupancyData.pendingDeposit,  color: '#F59E0B' },
      ].filter(d => d.value > 0)
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ManagerLayout>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: 4 }}>Dashboard</h1>
          <p className="body-md text-charcoal">
            Tổng quan hoạt động homestay &amp; resort
            {lastUpdated && (
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ash)' }}>
                · Cập nhật lúc {lastUpdated}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none', display: 'flex' }}>
            <Icons.Refresh />
          </span>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-error" style={{ marginBottom: 24, alignItems: 'flex-start' }}>
          <Icons.Alert />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Không thể tải dashboard</p>
            <p style={{ fontSize: 13 }}>{error}</p>
          </div>
          <button onClick={fetchDashboard} className="btn-primary btn-sm">Thử lại</button>
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {loading
          ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} height={108} />)
          : kpiCards.map(k => <KpiCard key={k.label} {...k} />)
        }
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>

        {/* Revenue Line Chart */}
        <div className="card-lg" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 className="heading-sm" style={{ marginBottom: 2 }}>Doanh thu theo tháng</h2>
              <p className="body-sm text-charcoal">Đơn vị: triệu đồng (₫M)</p>
            </div>
            <Link to="/manager/reports/revenue" className="btn-ghost btn-sm">Xem báo cáo →</Link>
          </div>

          {loading ? <SkeletonCard height={200} /> : (data?.revenueChartData?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data!.revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#888' }} width={48} />
                <Tooltip content={<RevenueTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#ea2804" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ea2804', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#ea2804' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.4 }}>
              <Icons.EmptyChart />
              <p className="body-sm">Chưa có dữ liệu doanh thu</p>
              <p style={{ fontSize: 11, color: 'var(--ash)' }}>Sẽ hiển thị sau khi có Booking</p>
            </div>
          )}
        </div>

        {/* Occupancy Donut */}
        <div className="card-lg" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 className="heading-sm" style={{ marginBottom: 2 }}>Tình trạng phòng</h2>
            <p className="body-sm text-charcoal">Phân bổ theo trạng thái</p>
          </div>

          {loading ? <SkeletonCard height={220} /> : occupancyPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={occupancyPieData}
                    cx="50%" cy="50%"
                    innerRadius={44} outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={OccupancyLabel}
                  >
                    {occupancyPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any, name: any) => [`${val} phòng`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
                {occupancyPieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--charcoal)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.4 }}>
              <Icons.EmptyPie />
              <p className="body-sm">Chưa có phòng nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Trend BarChart */}
      {!loading && (data?.bookingTrendData?.length ?? 0) > 0 && (
        <div className="card-lg" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 className="heading-sm" style={{ marginBottom: 2 }}>Booking Trend</h2>
              <p className="body-sm text-charcoal">Số booking mới và huỷ theo tuần</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data!.bookingTrendData} barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} width={32} />
              <Tooltip />
              <Bar dataKey="newBookings" name="Booking mới" fill="#ea2804" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancellations" name="Huỷ" fill="#fca5a5" radius={[3, 3, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'flex-start' }}>

        {/* Recent Bookings */}
        <div className="card-lg" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="heading-sm">Recent Bookings</h2>
            <Link to="/manager/bookings" className="btn-ghost btn-sm">Xem tất cả →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} height={44} />)}
            </div>
          ) : (data?.recentBookings?.length ?? 0) > 0 ? (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Phòng</th>
                    <th>Check-in</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data!.recentBookings.map(b => (
                    <tr key={b.id}>
                      <td><span className="code-sm">{b.id.slice(0, 8)}</span></td>
                      <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                      <td className="text-charcoal">{b.roomNumber}</td>
                      <td className="text-charcoal">{b.checkInDate}</td>
                      <td style={{ fontWeight: 600 }}>₫{b.totalAmount.toLocaleString('vi-VN')}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td>
                        <Link to={`/manager/bookings/${b.id}`} className="btn-ghost btn-sm">Xem</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.45 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <Icons.EmptyCalendar />
              </div>
              <p className="body-md" style={{ marginBottom: 4 }}>Chưa có booking nào</p>
              <p className="body-sm">Booking sẽ hiển thị ở đây sau khi khách đặt phòng.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick Stats */}
          {!loading && data && (
            <div className="card-lg" style={{ padding: 20 }}>
              <h2 className="heading-sm" style={{ marginBottom: 14 }}>Thống kê nhanh</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    label: 'Tỉ lệ lấp đầy',
                    value: data.kpis.totalRooms > 0
                      ? `${Math.round((data.kpis.occupiedRooms / data.kpis.totalRooms) * 100)}%`
                      : '—',
                  },
                  { label: 'Phòng trống', value: `${data.kpis.availableRooms} / ${data.kpis.totalRooms}` },
                  { label: 'Đang bảo trì', value: `${data.occupancyData.maintenance} phòng` },
                  { label: 'Chờ đặt cọc',  value: `${data.occupancyData.pendingDeposit} phòng` },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <span className="text-charcoal">{s.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card-lg" style={{ padding: 20 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { to: '/manager/properties/add', icon: <Icons.AddProperty />,  label: 'Thêm Property' },
                { to: '/manager/rooms/add',       icon: <Icons.AddRoom />,       label: 'Thêm Phòng' },
                { to: '/manager/bookings',         icon: <Icons.Bookings />,      label: 'Quản lý Booking' },
                { to: '/manager/reports/revenue',  icon: <Icons.Report />,        label: 'Báo cáo Doanh thu' },
                { to: '/manager/customers',        icon: <Icons.Customers />,     label: 'Quản lý Khách hàng' },
              ].map(a => (
                <Link key={a.to} to={a.to} className="btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', gap: 8 }}>
                  {a.icon}
                  <span>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </ManagerLayout>
  );
}
