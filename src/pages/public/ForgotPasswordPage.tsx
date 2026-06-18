import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [sent, setSent]           = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email)                         { setError('Email không được để trống'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Email không đúng định dạng'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || 'Email không tồn tại. Vui lòng kiểm tra lại.');
        return;
      }
      setSent(true);
      startCountdown();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Email không tồn tại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  }

  function startCountdown() {
    setCountdown(300);
    const t = setInterval(() =>
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      }), 1000);
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || 'Gửi lại thất bại. Vui lòng thử lại.');
        return;
      }
      startCountdown();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Gửi lại thất bại. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
        <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95"/>
            <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>
          Homestay<span style={{ color: 'var(--primary)' }}>&</span>Resort
        </span>
      </Link>

      <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 440, padding: 40 }}>

        {/* ═══ STEP 1: Nhập email ═══ */}
        {!sent ? (
          <>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <h1 className="heading-md" style={{ marginBottom: 8 }}>Quên mật khẩu?</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 28, lineHeight: 1.6 }}>
              Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 số để đặt lại mật khẩu.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label form-label-required" htmlFor="forgot-email">Địa chỉ Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  autoComplete="email"
                  autoFocus
                />
                {error && <p className="form-error">{error}</p>}
              </div>

              <button
                type="submit"
                id="forgot-submit-btn"
                className="btn-primary"
                style={{ width: '100%', marginBottom: 12 }}
                disabled={loading}
              >
                {loading
                  ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Đang gửi...</>
                  : 'Gửi mã OTP'
                }
              </button>

              <Link to="/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                ← Quay lại đăng nhập
              </Link>
            </form>
          </>
        ) : (

          /* ═══ STEP 2: OTP đã được gửi ═══ */
          <>
            {/* Success icon */}
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2b9a66" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: 8 }}>Kiểm tra hộp thư!</h2>
            <p className="body-md text-charcoal" style={{ textAlign: 'center', marginBottom: 4 }}>
              Mã OTP 6 số đã được gửi đến
            </p>
            <p style={{ textAlign: 'center', fontWeight: 700, color: 'var(--ink)', fontSize: 15, marginBottom: 20 }}>
              {email}
            </p>

            {/* Info banner */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10,
              padding: '11px 14px', marginBottom: 20, fontSize: 13, color: '#166534',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                Mã OTP có hiệu lực <strong>10 phút</strong>.
                Nếu không thấy email, hãy kiểm tra thư mục <strong>Spam</strong>.
              </span>
            </div>

            {/* Error khi resend thất bại */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* CTA chính: sang trang nhập OTP */}
            <button
              id="goto-reset-btn"
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
            >
              Nhập mã OTP →
            </button>

            {/* Resend */}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              style={{
                width: '100%', padding: '10px 0', background: 'none', border: 'none',
                cursor: (countdown > 0 || resending) ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 600,
                color: (countdown > 0 || resending) ? 'var(--ash)' : 'var(--primary)',
                marginBottom: 12, transition: 'color 0.15s',
              }}
            >
              {resending
                ? 'Đang gửi lại...'
                : countdown > 0
                  ? `Gửi lại mã sau ${minutes}:${String(seconds).padStart(2, '0')}`
                  : 'Gửi lại mã OTP'
              }
            </button>

            <Link to="/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
              ← Quay lại đăng nhập
            </Link>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
