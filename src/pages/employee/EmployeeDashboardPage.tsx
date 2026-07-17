import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBroom,
  faWrench,
  faClipboardCheck,
  faExclamationTriangle,
  faPlus,
  faDoorOpen,
} from '@fortawesome/free-solid-svg-icons';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import Alert from '../../components/ui/Alert';
import { getEmployeeKpis, type EmployeeKpis } from '../../api/employeeApi';

export default function EmployeeDashboardPage() {
  const [kpis, setKpis] = useState<EmployeeKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const employeeName = sessionStorage.getItem('fullName') || 'Nhân viên';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getEmployeeKpis();
        if (!cancelled && res.success) {
          setKpis(res.data);
        }
      } catch {
        if (!cancelled) setError('Không tải được thông tin nhiệm vụ của bạn.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const actionCards = [
    {
      to: '/employee/housekeeping',
      icon: faBroom,
      label: 'Housekeeping',
      value: kpis?.pendingHousekeeping ?? 0,
      desc: 'Dọn phòng đang chờ',
    },
    {
      to: '/employee/maintenance',
      icon: faWrench,
      label: 'Maintenance',
      value: kpis?.pendingMaintenance ?? 0,
      desc: 'Yêu cầu sửa chữa',
    },
    {
      to: '/employee/inspections',
      icon: faClipboardCheck,
      label: 'Inspections',
      value: kpis?.pendingInspections ?? 0,
      desc: 'Kiểm tra phòng',
    },
  ];

  const quickLinks = [
    { to: '/employee/damage', icon: faExclamationTriangle, label: 'My Damage Reports', desc: 'Báo cáo hư hại cá nhân' },
    { to: '/employee/damage/create', icon: faPlus, label: 'Báo cáo hư hại mới', desc: 'Gửi báo cáo hư hại mới' },
    { to: '/employee/rooms', icon: faDoorOpen, label: 'Danh sách phòng', desc: 'Xem danh sách phòng của chi nhánh' },
  ];

  // Section helper matching Admin Dashboard header
  const sectionHead = (emoji: string, title: string) => (
    <h2 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
      {emoji} {title}
    </h2>
  );

  return (
    <EmployeeLayout>
      <div className="animate-fade-in space-y-6" style={{ padding: '24px 16px', maxWidth: 640, margin: '0 auto' }}>
        
        {/* Breadcrumbs matching Admin Dashboard */}
        <div style={{ fontSize: 13, color: '#64748B', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>Employee</span>
          <span>/</span>
          <span style={{ fontWeight: 500 }}>Dashboard</span>
        </div>

        {/* Header matching Admin Dashboard */}
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            Employee Dashboard
          </h1>
          <p className="body-md text-charcoal">Tổng quan nhiệm vụ trong ngày — {new Date().getFullYear()}</p>
        </div>

        {error && <Alert variant="error" message={error} />}

        {/* ── Section: Nhiệm vụ của bạn (Styled like Admin Dashboard) ── */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-sm">
          {sectionHead('📋', 'Nhiệm vụ của bạn')}
          
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-[#F1F5F9] rounded-[16px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {actionCards.map((card, idx) => {
                const themes = [
                  { bg: '#E6F4F1', text: '#0F766E', borderHover: '#0F766E' },
                  { bg: '#EFF6FF', text: '#2563EB', borderHover: '#2563EB' },
                  { bg: '#F5F3FF', text: '#7C3AED', borderHover: '#7C3AED' }
                ];
                const theme = themes[idx % themes.length];
                
                return (
                  <Link key={card.to} to={card.to} className="block no-underline">
                    <div 
                      className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 flex flex-col gap-4 min-h-[135px] transition-all duration-200 cursor-pointer hover:shadow-md"
                      onMouseEnter={e => { e.currentTarget.style.borderColor = theme.borderHover; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      <div 
                        style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 12, 
                          backgroundColor: theme.bg, 
                          color: theme.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16
                        }}
                      >
                        <FontAwesomeIcon icon={card.icon} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
                        <span style={{ fontSize: 28, fontFamily: 'Outfit', fontWeight: 700, color: '#1E293B', lineHeight: 1.1 }}>
                          {card.value}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>
                          {card.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section: Truy cập nhanh (Styled like Admin Dashboard) ── */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-sm">
          {sectionHead('⚡', 'Truy cập nhanh')}
          
          <div className="grid grid-cols-1 gap-3">
            {quickLinks.map((link, idx) => {
              const themes = [
                { bg: '#FEF3C7', text: '#D97706' },
                { bg: '#ECFDF5', text: '#059669' },
                { bg: '#FDF2F8', text: '#DB2777' }
              ];
              const theme = themes[idx % themes.length];

              return (
                <Link key={link.to} to={link.to} className="block no-underline">
                  <div 
                    className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]"
                  >
                    <div 
                      style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 12, 
                        backgroundColor: theme.bg, 
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0
                      }}
                    >
                      <FontAwesomeIcon icon={link.icon} />
                    </div>
                    <div className="flex-1" style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', marginBottom: 2 }}>{link.label}</p>
                      <p style={{ fontSize: 12, color: '#94A3B8' }}>{link.desc}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
}