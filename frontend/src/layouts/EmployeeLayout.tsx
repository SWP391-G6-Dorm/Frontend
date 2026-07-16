import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Bottom nav items — mobile-first, 5 max
const BOTTOM_NAV = [
  { label: 'Home',         path: '/employee/dashboard',    icon: IconHome },
  { label: 'Housekeeping', path: '/employee/housekeeping', icon: IconBroom },
  { label: 'Maintenance',  path: '/employee/maintenance',  icon: IconWrench },
  { label: 'Inspection',   path: '/employee/inspections',  icon: IconClipboard },
  { label: 'Damage',       path: '/employee/damage',       icon: IconAlert },
];

// ── Icon components ────────────────────────────────────────────────────────────
function IconHome()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>; }
function IconBroom()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l2-8h12l2 8H4z"/><path d="M12 4v8"/><path d="M8 8h8"/></svg>; }
function IconWrench()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>; }
function IconClipboard() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>; }
function IconAlert()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconLogout()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { fullName, logout } = useAuthStore();

  function handleLogout() { logout(); navigate('/login'); }

  const currentNav = BOTTOM_NAV.find(n => location.pathname.startsWith(n.path));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)', maxWidth: 640, margin: '0 auto' }}>

      {/* Top header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 16px',
          background: 'var(--surface-dark)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95"/>
              <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: 'var(--on-dark)', lineHeight: 1.1 }}>
              {currentNav?.label ?? 'Employee Portal'}
            </p>
            <p style={{ fontSize: 10, color: 'var(--primary-light)', fontWeight: 500, marginTop: 1 }}>
              {fullName || 'Employee'}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(248,113,113,0.12)',
            border: 'none',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            minHeight: 36,
          }}
          aria-label="Sign out"
        >
          <IconLogout />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* Page content — scrollable, leaves room for bottom nav */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {children}
      </main>

      {/* Bottom Navigation — touch-friendly 56px height */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          height: 64,
          background: 'var(--surface-dark)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          maxWidth: 640,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {BOTTOM_NAV.map(item => {
          const active = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 transition-all duration-150"
              style={{
                textDecoration: 'none',
                color: active ? 'var(--primary-light)' : 'rgba(255,255,255,0.45)',
                minHeight: 48,    // touch target
                minWidth: 48,
                gap: 3,
              }}
              aria-label={item.label}
            >
              {/* Active dot indicator */}
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                }} />
              )}
              <Icon />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
