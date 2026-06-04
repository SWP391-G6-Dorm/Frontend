import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',       path: '/' },
  { label: 'Find Rooms', path: '/rooms' },
  { label: 'About',      path: '/about' },
  { label: 'Contact',    path: '/contact' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)' }}>
      {/* ── Top Nav ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'var(--canvas)',
          borderBottom: '1px solid var(--hairline)',
          height: '64px',
        }}
      >
        <div className="container-wide h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span
              className="flex items-center justify-center rounded-full text-white text-sm font-bold"
              style={{ width: 32, height: 32, background: 'var(--primary)', fontSize: 14 }}
            >
              🏠
            </span>
            <span className="font-bold text-base" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>
              BoardingHub
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="nav-link text-sm"
                style={{
                  color: location.pathname === l.path ? 'var(--primary)' : 'var(--ink)',
                  textDecoration: 'none',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA group */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-outline text-sm" style={{ height: 38, padding: '0 20px' }}>
              Login
            </Link>
            <Link to="/register" className="btn-primary text-sm" style={{ height: 38, padding: '0 20px' }}>
              Register
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {menuOpen ? (
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                />
              ) : (
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="md:hidden animate-fade-in border-t"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--hairline)',
              padding: '16px 24px',
            }}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm font-semibold border-b"
                style={{ color: 'var(--ink)', textDecoration: 'none', borderColor: 'var(--hairline)' }}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-4">
              <Link to="/login" className="btn-outline flex-1 text-center" style={{ height: 40 }}>Login</Link>
              <Link to="/register" className="btn-primary flex-1 text-center" style={{ height: 40 }}>Register</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Page Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--surface-deep)', color: 'var(--on-dark)', padding: '64px 32px 32px' }}>
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8"
            style={{ borderBottom: '1px solid var(--divider-dark)' }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🏠</span>
                <span className="font-bold text-base" style={{ color: 'var(--on-dark)' }}>BoardingHub</span>
              </div>
              <p className="body-sm" style={{ color: 'var(--on-dark-mute)' }}>
                The trusted platform for finding and managing boarding houses across Vietnam.
              </p>
            </div>
            {[
              { title: 'Platform', links: ['Find Rooms', 'For Landlords', 'Pricing', 'Blog'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Report Issue', 'FAQ'] },
              { title: 'Company', links: ['About', 'Privacy Policy', 'Terms of Service', 'Careers'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="label-sm mb-4" style={{ color: 'var(--on-dark)' }}>{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="body-sm transition-colors"
                        style={{ color: 'var(--on-dark-mute)', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--on-dark)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--on-dark-mute)')}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 gap-4">
            <p className="caption" style={{ color: 'var(--on-dark-mute)' }}>
              © 2025 BoardingHub. All rights reserved.
            </p>
            <div className="flex gap-4">
              {['Privacy', 'Terms', 'Sitemap'].map((t) => (
                <a key={t} href="#" className="caption" style={{ color: 'var(--on-dark-mute)', textDecoration: 'none' }}>
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
