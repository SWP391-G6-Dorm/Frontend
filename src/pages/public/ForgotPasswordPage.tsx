import { useState } from 'react';
import { Link } from 'react-router-dom';

// SCR-05 — Forgot Password
// Entity: User — lookup by User.email to send reset link

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--canvas)', padding: '48px 24px' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 no-underline" style={{ textDecoration: 'none' }}>
        <span className="flex items-center justify-center rounded-full text-white font-bold"
          style={{ width: 36, height: 36, background: 'var(--primary)', fontSize: 16 }}>🏠</span>
        <span className="font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>BoardingHub</span>
      </Link>

      <div
        className="w-full animate-fade-up"
        style={{
          maxWidth: 440,
          background: 'var(--surface-card)',
          borderRadius: 16,
          border: '1px solid var(--hairline)',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(32,32,32,0.08)',
        }}
      >
        {submitted ? (
          /* Success state */
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-6 flex items-center justify-center rounded-full text-3xl"
              style={{ width: 72, height: 72, background: '#dcfce7', fontSize: 32 }}>
              ✅
            </div>
            <h1 className="display-md mb-3" style={{ color: 'var(--ink)' }}>Check your inbox</h1>
            <p className="body-md mb-2" style={{ color: 'var(--charcoal)' }}>
              We sent a password reset link to:
            </p>
            <p className="font-semibold mb-6" style={{ color: 'var(--ink)' }}>{email}</p>
            <p className="body-sm mb-6" style={{ color: 'var(--muted)' }}>
              Didn't get it? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="font-semibold"
                style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                try another email
              </button>.
            </p>
            <Link to="/login" className="btn-dark w-full" style={{ height: 48, justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex items-center justify-center rounded-full text-3xl"
                style={{ width: 72, height: 72, background: '#fde8e3', fontSize: 32 }}>
                🔒
              </div>
              <h1 className="display-md mb-2" style={{ color: 'var(--ink)' }}>Forgot your password?</h1>
              <p className="body-md" style={{ color: 'var(--charcoal)' }}>
                Enter your registered email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="alert alert-error mb-6 animate-fade-in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* User.email */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="btn-primary w-full"
                style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Sending…
                  </span>
                ) : 'Send Reset Link'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="btn-ghost flex items-center justify-center gap-1" style={{ color: 'var(--charcoal)', textDecoration: 'none' }}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
