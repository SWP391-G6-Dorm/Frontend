import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { icon: '⊞', label: 'Dashboard', path: '/landlord/dashboard' },
    ],
  },
  {
    label: 'PROPERTY',
    items: [
      { icon: '🏢', label: 'Properties', path: '/landlord/properties' },
      { icon: '🏠', label: 'Rooms', path: '/landlord/rooms' },
      { icon: '🔑', label: 'Block / Floor', path: '/landlord/blocks' },
    ],
  },
  {
    label: 'TENANTS',
    items: [
      { icon: '👥', label: 'Tenants', path: '/landlord/tenants' },
      { icon: '📋', label: 'Requests', path: '/landlord/requests' },
      { icon: '📄', label: 'Contracts', path: '/landlord/contracts' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { icon: '💳', label: 'Billing', path: '/landlord/billing' },
      { icon: '💰', label: 'Payments', path: '/landlord/payments' },
      { icon: '⚡', label: 'Utilities', path: '/landlord/utilities' },
    ],
  },
  {
    label: 'MAINTENANCE',
    items: [
      { icon: '🔧', label: 'Maintenance', path: '/landlord/maintenance' },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { icon: '📊', label: 'Revenue', path: '/landlord/reports/revenue' },
      { icon: '📈', label: 'Occupancy', path: '/landlord/reports/occupancy' },
      { icon: '⚠️', label: 'Debt Report', path: '/landlord/reports/debt' },
    ],
  },
];

const MOCK_LANDLORD = {
  name: 'Le Quoc Hung',
  email: 'hung@property.vn',
  avatarUrl: 'https://i.pravatar.cc/40?img=12',
};

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allItems = NAV_SECTIONS.flatMap(s => s.items);
  const currentItem = allItems.find(n => location.pathname.startsWith(n.path));

  function NavLink({ item }: { item: { icon: string; label: string; path: string } }) {
    const active = location.pathname.startsWith(item.path);
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
        style={{
          background: active ? 'rgba(234,88,28,0.15)' : 'transparent',
          color: active ? '#fb923c' : 'rgba(248,250,252,0.65)',
          textDecoration: 'none',
          borderLeft: active ? '2px solid #fb923c' : '2px solid transparent',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', flexShrink: 0, textDecoration: 'none' }}>
        <span className="flex items-center justify-center rounded-lg text-white font-bold text-sm"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#ea2804,#ff6a3d)', flexShrink: 0 }}>🏠</span>
        <div>
          <p className="font-bold text-sm" style={{ color: '#f8fafc', letterSpacing: '-0.2px' }}>Home Go</p>
          <p className="text-xs" style={{ color: 'rgba(248,250,252,0.45)' }}>Landlord</p>
        </div>
      </Link>

      {/* User chip */}
      <div className="flex items-center gap-3 px-4 py-3 mx-3 mt-3 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <img src={MOCK_LANDLORD.avatarUrl} alt={MOCK_LANDLORD.name}
          className="rounded-full flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'cover' }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#f8fafc' }}>{MOCK_LANDLORD.name}</p>
          <p className="text-xs truncate" style={{ color: 'rgba(248,250,252,0.45)' }}>{MOCK_LANDLORD.email}</p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1 text-xs font-bold tracking-wider"
              style={{ color: 'rgba(248,250,252,0.3)' }}>{section.label}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => <NavLink key={item.path} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: 'rgba(248,250,252,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>🚪</span>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--canvas)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-screen sticky top-0"
        style={{ width: 240, background: '#0f172a', flexShrink: 0 }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <aside className="relative flex flex-col h-full overflow-hidden"
            style={{ width: 240, background: '#0f172a' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-end px-4 py-3">
              <button onClick={() => setMobileOpen(false)}
                style={{ color: 'rgba(248,250,252,0.55)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6"
          style={{ height: 60, background: 'var(--surface-card)', borderBottom: '1px solid var(--hairline)' }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--charcoal)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
            <div className="text-sm flex items-center gap-2">
              <span style={{ color: 'var(--ash)' }}>Landlord</span>
              {currentItem && <>
                <span style={{ color: 'var(--stone)' }}>/</span>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>{currentItem.label}</span>
              </>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/landlord/notifications" style={{ color: 'var(--charcoal)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </Link>
            <Link to="/landlord/profile" className="flex items-center gap-2">
              <img src={MOCK_LANDLORD.avatarUrl} alt="" className="rounded-full" style={{ width: 32, height: 32 }} />
              <span className="hidden md:block text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {MOCK_LANDLORD.name.split(' ').slice(-1)[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6" style={{ maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
