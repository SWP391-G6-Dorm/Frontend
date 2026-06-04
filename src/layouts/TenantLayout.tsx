import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Tenant sidebar navigation items
const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard',          path: '/tenant/dashboard' },
  { icon: '🏠', label: 'My Room',             path: '/tenant/room' },
  { icon: '📋', label: 'Rental Requests',    path: '/tenant/requests' },
  { icon: '📄', label: 'My Contracts',       path: '/tenant/contracts' },
  { icon: '💳', label: 'Bills & Payments',   path: '/tenant/bills' },
  { icon: '🔧', label: 'Maintenance',        path: '/tenant/maintenance' },
  { icon: '⭐', label: 'Reviews',            path: '/tenant/reviews' },
  { icon: '🔔', label: 'Notifications',      path: '/tenant/notifications' },
  { icon: '👤', label: 'Profile',            path: '/tenant/profile' },
];

const MOCK_USER = {
  name: 'Nguyen Van A',
  email: 'vana@example.com',
  avatarUrl: 'https://i.pravatar.cc/40?img=7',
  role: 'TENANT',
};

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount] = useState(3);

  const currentItem = NAV_ITEMS.find(n => location.pathname.startsWith(n.path));

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--canvas)' }}>
      {/* ── SIDEBAR (desktop) ── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto"
        style={{
          width: 256,
          background: 'var(--surface-dark)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="flex items-center justify-center rounded-full text-white font-bold text-sm"
            style={{ width: 32, height: 32, background: 'var(--primary)', flexShrink: 0 }}>🏠</span>
          <span className="font-bold text-sm" style={{ color: 'var(--on-dark)', letterSpacing: '-0.2px' }}>BoardingHub</span>
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-4 py-4 mx-3 mt-3 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <img src={MOCK_USER.avatarUrl} alt={MOCK_USER.name}
            className="rounded-full flex-shrink-0" style={{ width: 36, height: 36, objectFit: 'cover' }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--on-dark)' }}>{MOCK_USER.name}</p>
            <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 8px' }}>TENANT</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? 'rgba(234,40,4,0.18)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--on-dark-mute)',
                  textDecoration: 'none',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {item.label === 'Notifications' && notifCount > 0 && (
                  <span className="ml-auto badge badge-primary" style={{ fontSize: 10, padding: '1px 7px' }}>{notifCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--on-dark-mute)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
          <aside
            className="relative flex flex-col h-full overflow-y-auto"
            style={{ width: 260, background: 'var(--surface-dark)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full text-white font-bold text-xs"
                  style={{ width: 28, height: 28, background: 'var(--primary)' }}>🏠</span>
                <span className="font-bold text-sm" style={{ color: 'var(--on-dark)' }}>BoardingHub</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--on-dark-mute)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                    style={{
                      background: active ? 'rgba(234,40,4,0.18)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--on-dark-mute)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{item.icon}</span>{item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6"
          style={{
            height: 60,
            background: 'var(--surface-card)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden btn-ghost"
              onClick={() => setSidebarOpen(true)}
              style={{ padding: '8px' }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--ash)' }}>Tenant Portal</span>
              {currentItem && (
                <>
                  <span style={{ color: 'var(--stone)' }}>/</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>{currentItem.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link to="/tenant/notifications" className="relative" style={{ color: 'var(--charcoal)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold"
                  style={{ width: 16, height: 16, background: 'var(--primary)', fontSize: 9 }}>{notifCount}</span>
              )}
            </Link>

            {/* Avatar */}
            <Link to="/tenant/profile" className="flex items-center gap-2">
              <img src={MOCK_USER.avatarUrl} alt={MOCK_USER.name}
                className="rounded-full" style={{ width: 32, height: 32, objectFit: 'cover' }} />
              <span className="hidden md:block text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {MOCK_USER.name.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6" style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
