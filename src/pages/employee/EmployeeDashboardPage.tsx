import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeKpis, type EmployeeKpis, type HousekeepingTask } from '../../api/employeeApi';
import { ErrBanner } from './EmployeeShared';

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  link?: string;
  color?: string;
  icon?: React.ReactNode;
}

function KpiCard({ label, value, sub, link, color, icon }: KpiCardProps) {
  const inner = (
    <div
      className="kpi-card"
      style={{
        cursor: link ? 'pointer' : 'default',
        padding: '24px',
        borderLeft: color ? `4px solid ${color}` : '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 160,
        background: 'var(--surface-card)',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        borderTop: '1px solid var(--hairline)',
        borderRight: '1px solid var(--hairline)',
        borderBottom: '1px solid var(--hairline)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={e => {
        if (link) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)';
          if (color) (e.currentTarget as HTMLDivElement).style.borderColor = color;
        }
      }}
      onMouseLeave={e => {
        if (link) {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hairline)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3 }}>
          {label}
        </div>
        {icon && (
          <div style={{
            color: color || 'var(--mute)',
            background: 'var(--surface-bone)',
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ margin: '14px 0 6px 0' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
          {value}
        </div>
      </div>

      {sub && (
        <div style={{ fontSize: 12, color: 'var(--mute)', lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
    </div>
  );
  if (link) return <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
  return inner;
}

// ── Quick Link Card ───────────────────────────────────────────────────────────
interface QuickLinkProps {
  to: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

function QuickLink({ to, label, desc, icon }: QuickLinkProps) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          borderRadius: 16,
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
          height: '100%',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hairline)';
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
            {label}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.4 }}>
            {desc}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2.5" style={{ alignSelf: 'center', flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Housekeeping: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M9 6h6M6 9l-2 11h16L18 9M8 9V7a4 4 0 0 1 8 0v2"/></svg>,
  Maintenance: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Inspection: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Rooms: () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Damage: () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  CreateDamage: () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

export default function EmployeeDashboardPage() {
  const [kpis, setKpis] = useState<EmployeeKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'operations'>('tasks');
  const employeeName = sessionStorage.getItem('fullName') || 'Nhân viên';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getEmployeeKpis();
        if (!cancelled && res.success) setKpis(res.data);
      } catch { if (!cancelled) setError('Không tải được KPI. Vui lòng thử lại.'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <EmployeeLayout>
      <div style={{ padding: '24px 20px', maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
        
        {/* Header section with Greeting and Tab Switcher */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Employee Portal
            </span>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '4px 0' }}>
              {employeeName}
            </h1>
            <p className="body-sm text-charcoal" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Premium Pill Tab Header */}
          <div style={{ display: 'inline-flex', background: 'var(--surface-bone)', padding: 4, borderRadius: 12, border: '1px solid var(--hairline)', height: 'fit-content' }}>
            <button
              onClick={() => setActiveTab('tasks')}
              style={{
                background: activeTab === 'tasks' ? 'var(--surface-card)' : 'transparent',
                border: 'none',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                color: activeTab === 'tasks' ? 'var(--primary)' : 'var(--charcoal)',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'tasks' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                outline: 'none',
              }}
            >
              Công việc của tôi
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              style={{
                background: activeTab === 'operations' ? 'var(--surface-card)' : 'transparent',
                border: 'none',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                color: activeTab === 'operations' ? 'var(--primary)' : 'var(--charcoal)',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'operations' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                outline: 'none',
              }}
            >
              Vận hành & Tra cứu
            </button>
          </div>
        </div>

        {error && <ErrBanner msg={error} />}

        {/* Tab 1: Công việc của tôi */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {loading ? (
              <>
                <div style={{ background: 'var(--surface-bone)', height: 160, borderRadius: 16 }} className="animate-pulse" />
                <div style={{ background: 'var(--surface-bone)', height: 160, borderRadius: 16 }} className="animate-pulse" />
                <div style={{ background: 'var(--surface-bone)', height: 160, borderRadius: 16 }} className="animate-pulse" />
              </>
            ) : (
              <>
                <KpiCard
                  label="Dọn dẹp (Housekeeping)"
                  value={kpis ? kpis.pendingHousekeeping : 0}
                  sub="Tác vụ dọn dẹp phòng đang chờ"
                  link="/employee/housekeeping"
                  color="var(--primary)"
                  icon={<Icons.Housekeeping />}
                />
                <KpiCard
                  label="Sửa chữa (Maintenance)"
                  value={kpis ? kpis.pendingMaintenance : 0}
                  sub="Tác vụ sửa chữa hư hại phòng"
                  link="/employee/maintenance"
                  color="var(--info)"
                  icon={<Icons.Maintenance />}
                />
                <KpiCard
                  label="Kiểm tra (Inspections)"
                  value="Hub"
                  sub="Phê duyệt phòng khi khách check-out"
                  link="/employee/inspections"
                  color="var(--purple)"
                  icon={<Icons.Inspection />}
                />
              </>
            )}
          </div>
        )}

        {/* Tab 2: Vận hành & Tra cứu */}
        {activeTab === 'operations' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <QuickLink
              to="/employee/rooms"
              label="Danh sách phòng"
              desc="Xem trạng thái và cấu hình dọn dẹp của toàn bộ phòng"
              icon={<Icons.Rooms />}
            />
            <QuickLink
              to="/employee/damage"
              label="Lịch sử báo cáo hư hại"
              desc="Danh sách các báo cáo hư hỏng tài sản phòng của bạn"
              icon={<Icons.Damage />}
            />
            <QuickLink
              to="/employee/damage/create"
              label="Báo cáo hư hại mới"
              desc="Khai báo tài sản hỏng hóc phát hiện khi dọn phòng"
              icon={<Icons.CreateDamage />}
            />
          </div>
        )}

      </div>
    </EmployeeLayout>
  );
}

// ── SCR-60: Housekeeping Workspace ─────────────────────────────────────────────

/** Next status in housekeeping flow */
export function hkNext(status: HousekeepingTask['status']): 'IN_PROGRESS' | 'COMPLETED' | null {
  if (status === 'PENDING')     return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return 'COMPLETED';
  return null;
}

export function hkButtonLabel(status: HousekeepingTask['status']) {
  if (status === 'PENDING')     return 'Bắt đầu';
  if (status === 'IN_PROGRESS') return 'Hoàn thành';
  return null;
}

export function hkButtonClass(status: HousekeepingTask['status']) {
  if (status === 'IN_PROGRESS') return 'btn-primary';
  return 'btn-outline';
}