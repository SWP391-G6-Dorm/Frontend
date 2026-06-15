import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Invalid email format'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || 'Email not found. Please check and try again.');
        return;
      }
      setSent(true);
      setCountdown(300);
      const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Email not found. Please check and try again.');
    } finally {
      setLoading(false);
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
        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 8 }}>Forgot your password?</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 28, lineHeight: 1.6 }}>
          Enter your registered email to receive a password reset link.
        </p>

        {sent ? (
          <div>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <h2 className="heading-sm" style={{ textAlign: 'center', marginBottom: 8 }}>Check your inbox</h2>
            <p className="body-md text-charcoal" style={{ textAlign: 'center', marginBottom: 20 }}>
              We sent a reset link to <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{email}</span>
            </p>
            {countdown > 0 && (
              <p className="body-sm text-charcoal" style={{ textAlign: 'center', marginBottom: 20 }}>
                Resend available in {minutes}:{String(seconds).padStart(2, '0')}
              </p>
            )}
            {countdown === 0 && (
              <button onClick={() => setSent(false)} className="btn-outline" style={{ width: '100%', marginBottom: 12 }}>
                Resend reset link
              </button>
            )}
            <Link to="/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
              ← Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label form-label-required" htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className={`input ${error ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                autoComplete="email"
              />
              {error && <p className="form-error">{error}</p>}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <Link to="/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
              ← Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
