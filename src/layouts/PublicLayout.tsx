import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { useAuthStore } from '../store/authStore';

const NAV_LINKS = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Tìm phòng', path: '/rooms' },
  { label: 'Giới thiệu', path: '/about' },
  { label: 'Liên hệ', path: '/contact' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'LANDLORD': return '/landlord/dashboard';
      case 'TENANT': return '/tenant/dashboard';
      default: return '/tenant/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)' }}>
      {/* ── Top Nav ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(249,247,243,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--hairline)',
          height: '64px',
        }}
      >
        <div className="container-wide h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img
              src={logoImg}
              alt="KTX Manager"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
            <span className="font-bold text-base" style={{ color: 'var(--ink)', letterSpacing: '-0.4px' }}>
              <span style={{ color: 'var(--ink)' }}>Home</span><span style={{ color: '#047526' }}>Go</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => {
              const isActive = location.pathname === l.path;
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  className="relative nav-link text-sm px-3 py-2 rounded-lg transition-all duration-150"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--charcoal)',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(234,40,4,0.06)' : 'transparent',
                  }}
                >
                  {l.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-3 right-3 rounded-full"
                      style={{ height: 2, background: 'var(--primary)' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA group */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="btn-primary text-sm" style={{ height: 38, padding: '0 20px' }}>
                  Bảng điều khiển
                </Link>
                <button onClick={handleLogout} className="btn-outline text-sm" style={{ height: 38, padding: '0 20px' }}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm" style={{ height: 38, padding: '0 20px' }}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm" style={{ height: 38, padding: '0 20px' }}>
                  Đăng ký
                </Link>
              </>
            )}
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
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardLink()} className="btn-primary flex-1 text-center" style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Bảng điều khiển
                  </Link>
                  <button onClick={handleLogout} className="btn-outline flex-1 text-center" style={{ height: 40 }}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline flex-1 text-center" style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đăng nhập</Link>
                  <Link to="/register" className="btn-primary flex-1 text-center" style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đăng ký</Link>
                </>
              )}
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
                <span
                  className="flex items-center justify-center rounded-xl text-white text-sm"
                  style={{ width: 32, height: 32, background: 'var(--primary)', fontSize: 15 }}
                >🏠</span>
                <span className="font-bold text-base" style={{ color: 'var(--on-dark)' }}>KTX Manager</span>
              </div>
              <p className="body-sm" style={{ color: 'var(--on-dark-mute)', lineHeight: 1.7 }}>
                Nền tảng quản lý ký túc xá sinh viên — đăng ký, thanh toán và hỗ trợ trực tuyến.
              </p>
            </div>
            {[
              { title: 'Nền tảng', links: ['Tìm phòng', 'Đăng ký phòng', 'Bảng giá', 'Blog'] },
              { title: 'Hỗ trợ', links: ['Trung tâm hỗ trợ', 'Liên hệ', 'Báo cáo sự cố', 'FAQ'] },
              { title: 'Công ty', links: ['Giới thiệu', 'Chính sách riêng tư', 'Điều khoản', 'Tuyển dụng'] },
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
              © 2026 KTX Manager. Bảo lưu mọi quyền.
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
