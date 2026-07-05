import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeKpis, type EmployeeKpis } from '../../api/employeeApi';
import { ErrBanner } from './employeeUtils';

// ── SCR-59: Employee Dashboard ─────────────────────────────────────────────────

export default function EmployeeDashboardPage() {
  const [kpis, setKpis] = useState<EmployeeKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const actionCards = [
    {
      to: '/employee/housekeeping', icon: '🧹', label: 'Housekeeping',
      count: kpis?.pendingHousekeeping, desc: 'Dọn phòng đang chờ',
      gradient: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
    },
    {
      to: '/employee/maintenance', icon: '🔧', label: 'Maintenance',
      count: kpis?.pendingMaintenance, desc: 'Yêu cầu sửa chữa',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #0891B2 100%)',
    },
    {
      to: '/employee/inspections', icon: '🔍', label: 'Inspections',
      count: null, desc: 'Kiểm tra phòng',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    },
  ];

  return (
    <EmployeeLayout>
      <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }} className="animate-fade-in">
        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <p className="body-sm text-charcoal" style={{ marginBottom: 2 }}>Xin chào 👋</p>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{employeeName}</h1>
          <p className="body-sm text-charcoal" style={{ marginTop: 4 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {error && <ErrBanner msg={error} />}

        {/* Action Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {actionCards.map((card) => (
            <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: card.gradient,
                borderRadius: 16, padding: '20px 22px',
                minHeight: 100,
                display: 'flex', alignItems: 'center', gap: 18,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              >
                <div style={{ fontSize: 36, flexShrink: 0 }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 4 }}>{card.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{card.desc}</p>
                </div>
                {card.count !== null && card.count !== undefined && (
                  <div style={{
                    background: 'rgba(255,255,255,0.22)', borderRadius: 12,
                    padding: '6px 14px', textAlign: 'center', flexShrink: 0,
                  }}>
                    {loading ? (
                      <div style={{ width: 24, height: 22, background: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
                    ) : (
                      <>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 24, color: '#fff', lineHeight: 1 }}>{card.count}</p>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>đang chờ</p>
                      </>
                    )}
                  </div>
                )}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { to: '/employee/damage', icon: '📋', label: 'My Damage Reports' },
            { to: '/employee/damage/create', icon: '📝', label: 'Báo cáo hư hại mới' },
            { to: '/employee/rooms', icon: '🚪', label: 'Danh sách phòng' },
          ].map(link => (
            <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface-card)', borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 10, minHeight: 56,
                border: '1px solid var(--hairline)', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hairline)'; }}
              >
                <span style={{ fontSize: 20 }}>{link.icon}</span>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
}
