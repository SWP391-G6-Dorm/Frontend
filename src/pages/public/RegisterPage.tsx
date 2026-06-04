import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// SCR-03 — Register
// Entity created: User
// Fields: User.name · User.email · User.phone · User.passwordHash · User.role

type Role = 'TENANT' | 'LANDLORD';

function StrengthBar({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#dc2626', '#d97706', '#2563eb', '#16a34a'];
  return password ? (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{ height: 3, background: i <= score ? colors[score] : 'var(--hairline)' }}
          />
        ))}
      </div>
      <p className="caption mt-1" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  ) : null;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('TENANT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirmPw) e.confirm = 'Passwords do not match.';
    if (!agreed) e.terms = 'You must agree to the Terms of Service.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    // Simulate API → User.status = PENDING → redirect to OTP screen
    setTimeout(() => {
      setLoading(false);
      navigate('/verify-email?email=' + encodeURIComponent(email));
    }, 1200);
  }

  function FieldError({ field }: { field: string }) {
    return errors[field] ? (
      <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors[field]}</p>
    ) : null;
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
        >🏠</span>
        <span className="font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>BoardingHub</span>
      </Link>

      <div
        className="w-full animate-fade-up"
        style={{
          maxWidth: 520,
          background: 'var(--surface-card)',
          borderRadius: 16,
          border: '1px solid var(--hairline)',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(32,32,32,0.08)',
        }}
      >
        <div className="mb-6">
          <h1 className="display-md" style={{ color: 'var(--ink)', marginBottom: 8 }}>Create your account</h1>
          <p className="body-md" style={{ color: 'var(--charcoal)' }}>Join thousands of happy tenants and landlords.</p>
        </div>

        {/* Role Selector → User.role */}
        <div
          className="flex rounded-full p-1 mb-6"
          style={{ background: 'var(--surface-bone)', gap: 4 }}
        >
          {(['TENANT', 'LANDLORD'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="flex-1 font-semibold text-sm rounded-full transition-all duration-200"
              style={{
                height: 38,
                background: role === r ? 'var(--surface-card)' : 'transparent',
                color: role === r ? 'var(--ink)' : 'var(--muted)',
                border: role === r ? '1px solid var(--hairline)' : 'none',
                boxShadow: role === r ? '0 1px 4px rgba(32,32,32,0.08)' : 'none',
                cursor: 'pointer',
              }}
            >
              {r === 'TENANT' ? '🏡 I\'m a Tenant' : '🏢 I\'m a Landlord'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* User.name */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="input-field"
              placeholder="Nguyen Van A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
            <FieldError field="name" />
          </div>

          {/* User.email */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError field="email" />
          </div>

          {/* User.phone */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Phone Number</label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 label-sm"
                style={{ color: 'var(--charcoal)', borderRight: '1px solid var(--hairline)', paddingRight: 12 }}
              >
                +84
              </span>
              <input
                id="reg-phone"
                type="tel"
                className="input-field"
                style={{ paddingLeft: 64 }}
                placeholder="912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
            </div>
            <FieldError field="phone" />
          </div>

          {/* User.passwordHash */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: 48 }}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPw ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <StrengthBar password={password} />
            <FieldError field="password" />
          </div>

          {/* Confirm password */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="input-field"
              placeholder="Re-enter your password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
            <FieldError field="confirm" />
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4"
                style={{ accentColor: 'var(--primary)' }}
              />
              <span className="body-sm" style={{ color: 'var(--charcoal)' }}>
                I agree to the{' '}
                <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>
              </span>
            </label>
            <FieldError field="terms" />
          </div>

          <button
            id="reg-submit"
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
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
          <span className="caption" style={{ color: 'var(--ash)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
        </div>

        {/* Google OAuth → User.googleId */}
        <button
          id="reg-google"
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

        <p className="body-sm text-center mt-6" style={{ color: 'var(--charcoal)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>

      <Link to="/" className="mt-6 body-sm flex items-center gap-1" style={{ color: 'var(--charcoal)', textDecoration: 'none' }}>
        ← Back to home
      </Link>
    </div>
  );
}
