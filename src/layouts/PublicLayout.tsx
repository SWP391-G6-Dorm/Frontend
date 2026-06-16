import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV_LINKS = [
  { label: 'Home',  path: '/' },
  { label: 'Rooms', path: '/rooms' },
  { label: 'About', path: '/about' },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div style={{
        width: 32, height: 32,
        background: 'var(--primary)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95" />
          <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6" />
        </svg>
      </div>
      <span className="display-md" style={{ fontSize: 18, letterSpacing: '-0.5px', color: 'var(--ink)' }}>
        Homestay<span style={{ color: 'var(--primary)' }}>&</span>Resort
      </span>
    </div>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/'); };
  const dashboardLink = role === 'MANAGER' ? '/manager/dashboard' : '/customer/dashboard';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)' }}>

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          height: 60,
          background: 'rgba(249,247,243,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <div className="container-wide h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 14, fontWeight: 600,
                    textDecoration: 'none',
                    color: active ? 'var(--primary)' : 'var(--charcoal)',
                    background: active ? '#fff1ee' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--charcoal)'; }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to={dashboardLink} className="btn-outline btn-sm">Dashboard</Link>
                <button onClick={handleLogout} className="btn-ghost btn-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm">Log In</Link>
                <Link to="/register" className="btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden animate-fade-in" style={{
            background: 'var(--surface-card)',
            borderTop: '1px solid var(--hairline)',
            padding: '12px 24px 20px',
            boxShadow: '0 8px 24px rgba(32,32,32,0.10)',
          }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '12px 0', fontSize: 15, fontWeight: 600,
                  textDecoration: 'none',
                  color: location.pathname === link.path ? 'var(--primary)' : 'var(--ink)',
                  borderBottom: '1px solid var(--hairline)',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-4">
              {isAuthenticated ? (
                <>
                  <Link to={dashboardLink} className="btn-primary flex-1" style={{ justifyContent: 'center' }}>Dashboard</Link>
                  <button onClick={handleLogout} className="btn-outline flex-1">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline flex-1" style={{ justifyContent: 'center' }}>Log In</Link>
                  <Link to="/register" className="btn-primary flex-1" style={{ justifyContent: 'center' }}>Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--surface-deep)', color: 'var(--on-dark)', padding: '64px 32px 32px' }}>
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10" style={{ borderBottom: '1px solid var(--divider-dark)' }}>
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 30, height: 30, background: 'var(--primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95" />
                    <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6" />
                  </svg>
                </div>
                <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 15, color: 'var(--on-dark)' }}>
                  Homestay&Resort
                </span>
              </div>
              <p className="body-sm" style={{ color: 'var(--on-dark-mute)', lineHeight: 1.75 }}>
                Nền tảng đặt phòng homestay &amp; resort trực tuyến — tìm kiếm, đặt phòng và thanh toán nhanh chóng, an toàn.
              </p>
            </div>
            {/* Link columns */}
            {[
              { title: 'Explore', links: ['Rooms', 'Homestay', 'Resort & Villa', 'Best Deals'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Report Issue', 'FAQ'] },
              { title: 'Company', links: ['About', 'Privacy Policy', 'Terms of Service', 'Careers'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="label-sm mb-5" style={{ color: 'rgba(252,252,252,0.4)' }}>{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="body-sm" style={{ color: 'var(--on-dark-mute)', textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--on-dark)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--on-dark-mute)')}
                      >{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-4">
            <p className="caption" style={{ color: 'var(--on-dark-mute)' }}>© 2026 Homestay &amp; Resort. All rights reserved.</p>
            <div className="flex gap-5">
              {['Privacy Policy', 'Terms', 'Sitemap'].map((t) => (
                <a key={t} href="#" className="caption" style={{ color: 'var(--on-dark-mute)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--on-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--on-dark-mute)')}>
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
