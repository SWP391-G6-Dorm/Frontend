import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getGlobalKpis,
  type GlobalKpis,
  getGlobalRevenueReport,
  type MonthlyRevenue,
} from '../../api/adminApi';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const MONTHS_VI = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, iconBg, iconColor, link }: {
  icon: string; label: string; value: string | number; sub?: string;
  iconBg: string; iconColor: string; link?: string;
}) {
  const inner = (
    <div className="kpi-card" style={{ cursor: link ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="body-sm text-charcoal" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
  if (link) return <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
  return inner;
}

// ── Inline Bar Chart ──────────────────────────────────────────────────────────
function RevenueBarChart({ data }: { data: MonthlyRevenue[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
      {data.map((d) => {
        const pct = Math.round((d.revenue / max) * 100);
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              title={`${MONTHS_VI[d.month - 1]}: ${fmtVnd(d.revenue)}`}
              style={{
                width: '100%', height: `${Math.max(pct, 4)}%`,
                background: 'var(--primary)', borderRadius: '4px 4px 0 0',
                transition: 'height 0.4s ease',
                cursor: 'default',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--charcoal)' }}>{MONTHS_VI[d.month - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quick Link Card ───────────────────────────────────────────────────────────
function QuickLink({ to, icon, label, desc }: { to: string; icon: string; label: string; desc: string }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(15,118,110,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>{label}</p>
          <p className="body-sm text-charcoal">{desc}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--charcoal)" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<GlobalKpis | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [kpiRes, revRes] = await Promise.allSettled([
          getGlobalKpis(),
          getGlobalRevenueReport(currentYear),
        ]);
        if (!cancelled) {
          if (kpiRes.status === 'fulfilled' && kpiRes.value.success) {
            setKpis(kpiRes.value.data);
          }
          if (revRes.status === 'fulfilled' && revRes.value.success) {
            setRevenue(revRes.value.data?.monthlyData ?? []);
          }
        }
      } catch {
        if (!cancelled) setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentYear]);

  const kpiCards = [
    { icon: '💰', label: 'Tổng doanh thu', value: kpis ? fmtVnd(kpis.totalRevenue) : '—', iconBg: 'rgba(15,118,110,0.10)', iconColor: 'var(--primary)', link: '/admin/reports' },
    { icon: '📋', label: 'Tổng booking', value: kpis ? kpis.totalBookings.toLocaleString('vi-VN') : '—', iconBg: '#eff6ff', iconColor: '#2563EB' },
    { icon: '🏢', label: 'Tổng properties', value: kpis?.totalProperties?.toLocaleString('vi-VN') ?? '—', iconBg: '#f0fdf4', iconColor: '#2b9a66', link: '/admin/properties' },
    { icon: '👥', label: 'Khách hàng', value: kpis?.totalCustomers?.toLocaleString('vi-VN') ?? '—', iconBg: '#f5f3ff', iconColor: '#7c3aed', link: '/admin/customers' },
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            Admin Dashboard
          </h1>
          <p className="body-md text-charcoal">Tổng quan toàn hệ thống — {currentYear}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* KPI Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="kpi-card" style={{ background: 'var(--surface-bone)', height: 110 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            {kpiCards.map((k, i) => <KpiCard key={i} {...k} />)}
          </div>
        )}

        {/* Revenue Chart + Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 28 }}>
          {/* Chart */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                📊 Doanh thu theo tháng — {currentYear}
              </h2>
            </div>
            {revenue.length > 0 ? (
              <RevenueBarChart data={revenue} />
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="body-sm text-charcoal">{loading ? 'Đang tải...' : 'Chưa có dữ liệu doanh thu'}</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <QuickLink to="/admin/properties"   icon="🏢" label="Quản lý Properties"  desc="Danh sách & tạo property" />
            <QuickLink to="/admin/managers"      icon="👔" label="Manager Directory"   desc="Quản lý tài khoản manager" />
            <QuickLink to="/admin/customers"     icon="👥" label="Customer Directory"  desc="Danh sách khách hàng" />
            <QuickLink to="/admin/damage-escalation" icon="⚠️" label="Damage Escalation"  desc="Reports > 5,000,000 VND" />
          </div>
        </div>

        {/* Secondary quick access — SCR-52 Payment Reconciliation deferred (mock VNPay). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <QuickLink to="/admin/complaints"   icon="📣" label="Complaints"     desc="Khiếu nại hệ thống" />
          <QuickLink to="/admin/reports"      icon="📈" label="Global Reports" desc="Báo cáo toàn hệ thống" />
          <QuickLink to="/admin/settings"     icon="⚙️" label="System Admin"   desc="Settings & Logs" />
          <QuickLink to="/admin/promotions"   icon="🎁" label="Promotions"     desc="Mã khuyến mãi" />
        </div>
      </div>
    </AdminLayout>
  );
}
