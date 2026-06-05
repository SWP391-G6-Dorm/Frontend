import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

// SCR-02 — Login
// Entity: User (read by email for auth) · RefreshToken (created on success)
// Fields: User.email · User.passwordHash

export default function LoginPage() {
  const navigate = useNavigate();
  const loginToStore = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy clientId từ file .env, fallback để dev test
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-demo-client-id.apps.googleusercontent.com';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    try {
      setLoading(true);
      const data = await authApi.login(email, password);
      loginToStore(data);
      // Optional: xử lý remember me nếu cần
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError('');
      if (credentialResponse.credential) {
        const data = await authApi.loginWithGoogle(credentialResponse.credential);
        loginToStore(data);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
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
            <div className="alert alert-error mb-6 animate-fade-in text-red-500 bg-red-50 p-3 rounded-md flex items-center gap-2">
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
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google Login Failed');
              }}
              useOneTap
            />
          </div>

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
    </GoogleOAuthProvider>
  );
}
