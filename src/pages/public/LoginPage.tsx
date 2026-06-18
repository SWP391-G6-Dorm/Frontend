import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';

interface LoginForm {
  email:    string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuthStore();

  const [form, setForm]           = useState<LoginForm>({ email: '', password: '', remember: false });
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Lấy redirect path từ query param (nếu có) — ví dụ: /login?redirect=/customer/bookings
  const params       = new URLSearchParams(location.search);
  const redirectPath = params.get('redirect');

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    if (!form.email)                              errs.email    = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email    = 'Invalid email format';
    if (!form.password)                           errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);

      if (!res.success || !res.data) {
        setError(res.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
        return;
      }

      // Lưu thông tin vào store (và localStorage)
      login(res.data);

      // Redirect theo role
      const role = res.data.user.role;
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (role === 'MANAGER') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      // Bắt lỗi tài khoản chưa xác thực — backend trả HTTP 403 + errorCode = ACCOUNT_INACTIVE
      const axiosError = err as { response?: { data?: { message?: string; data?: { errorCode?: string; email?: string } } } };
      const errorCode  = axiosError?.response?.data?.data?.errorCode;
      const email      = axiosError?.response?.data?.data?.email;

      if (errorCode === 'ACCOUNT_INACTIVE' && email) {
        // OTP mới đã được gửi tự động bởi backend — redirect thẳng sang trang xác thực
        setUnverifiedEmail(email);
        return;
      }

      const msg = axiosError?.response?.data?.message;
      setError(msg ?? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95"/>
            <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
          Homestay<span style={{ color: 'var(--primary)' }}>&</span>Resort
        </span>
      </Link>

      {/* Card */}
      <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        <h1 className="display-md" style={{ marginBottom: 6, textAlign: 'center' }}>Welcome back</h1>
        <p className="body-md text-charcoal" style={{ textAlign: 'center', marginBottom: 28 }}>Sign in to your account</p>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Unverified Account Banner */}
        {unverifiedEmail && (
          <div style={{
            marginBottom: 20,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)',
            border: '1.5px solid #f59e0b',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#92400e' }}>
                  Tài khoản chưa được xác thực
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                  Mã OTP mới đã được gửi đến <strong>{unverifiedEmail}</strong>.
                  Vui lòng kiểm tra hộp thư và xác thực tài khoản.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 18px',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d97706')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
            >
              Xác thực ngay →
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className={`input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              autoComplete="email"
              disabled={loading}
            />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
                style={{ paddingRight: 50 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', padding: 4 }}
              >
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="login-remember"
                checked={form.remember}
                onChange={e => setForm(p => ({ ...p, remember: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span className="body-sm">Remember me</span>
            </label>
            <Link to="/forgot-password" className="body-sm text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" id="login-submit-btn" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading
              ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Signing in...</>
              : 'Sign In'
            }
          </button>
        </form>

        <p className="body-sm text-charcoal" style={{ textAlign: 'center', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/register" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
