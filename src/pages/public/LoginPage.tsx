import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// SCR-02 — Login
// Entity: User (read by email for auth) · RefreshToken (created on success)
// Fields: User.email · User.passwordHash

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Demo: redirect to /dashboard after "login"
      navigate('/dashboard');
    }, 1200);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--canvas)', padding: '48px 24px' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 no-underline" style={{ textDecoration: 'none' }}>
        <span
          className="flex items-center justify-center rounded-full text-white font-bold"
          style={{ width: 36, height: 36, background: 'var(--primary)', fontSize: 16 }}
        >
          🏠
        </span>
        <span className="font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>
          BoardingHub
        </span>
      </Link>

      {/* Auth Card */}
      <div
        className="w-full animate-fade-up"
        style={{
          maxWidth: 480,
          background: 'var(--surface-card)',
          borderRadius: 16,
          border: '1px solid var(--hairline)',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(32,32,32,0.08)',
        }}
      >
        <div className="mb-8">
          <h1 className="display-md" style={{ color: 'var(--ink)', marginBottom: 8 }}>
            Welcome back
          </h1>
          <p className="body-md" style={{ color: 'var(--charcoal)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6 animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email → User.email */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* Password → User.passwordHash */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label-sm" style={{ color: 'var(--ink)' }}>Password</label>
              <Link
                to="/forgot-password"
                className="body-sm font-semibold transition-colors"
                style={{ color: 'var(--primary)', textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: 48 }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-3">
            <input
              id="remember-me"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--primary)' }}
            />
            <label htmlFor="remember-me" className="body-sm" style={{ color: 'var(--charcoal)' }}>
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="btn-primary w-full mt-2"
            style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
          <span className="caption" style={{ color: 'var(--ash)' }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
        </div>

        {/* Google OAuth → User.googleId */}
        <button
          id="login-google"
          type="button"
          className="btn-outline w-full"
          style={{ height: 48, justifyContent: 'center', fontSize: 15 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <p className="body-sm text-center mt-6" style={{ color: 'var(--charcoal)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>

      {/* Back link */}
      <Link
        to="/"
        className="mt-6 body-sm flex items-center gap-1"
        style={{ color: 'var(--charcoal)', textDecoration: 'none' }}
      >
        ← Back to home
      </Link>
    </div>
  );
}
