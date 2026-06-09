import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi, Role } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

// SCR-03 — Register
// Entity created: User
// Fields: User.name · User.email · User.phone · User.passwordHash · User.role

// ── Password strength bar ─────────────────────────────────────────────────────

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
          <div key={i} className="flex-1 rounded-full transition-all duration-300"
            style={{ height: 3, background: i <= score ? colors[score] : 'var(--hairline)' }} />
        ))}
      </div>
      <p className="caption mt-1" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  ) : null;
}

// ── Input field with label ────────────────────────────────────────────────────

function Field({
  id, label, required, optional, error, children,
}: {
  id?: string; label: string; required?: boolean; optional?: boolean;
  error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }} htmlFor={id}>
        {label}
        {required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
        {optional && <span className="caption" style={{ color: 'var(--ash)', marginLeft: 6 }}>(optional)</span>}
      </label>
      {children}
      {error && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{error}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginToStore = useAuthStore(s => s.login);

  const googleClientId = import.meta.env.GOOGLE_CLIENT_ID || '';

  // Form state
  const [role, setRole] = useState<Role>('TENANT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // LANDLORD-specific
  const [identityNumber, setIdentityNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');

  // UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const isLandlord = role === 'LANDLORD';

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\d{8,12}$/.test(phone.replace(/\s/g, ''))) e.phone = 'Enter a valid phone number.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirmPw) e.confirm = 'Passwords do not match.';
    if (!agreed) e.terms = 'You must agree to the Terms of Service.';
    if (isLandlord && !identityNumber.trim())
      e.identityNumber = 'CCCD / Identity number is required.';
    return e;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const cleanEmail = email.trim().match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] ?? email.trim();
    setLoading(true);
    try {
      await authApi.register({
        name: name.trim(), email: cleanEmail, phone: phone.trim(), password, role,
        ...(isLandlord && {
          identityNumber: identityNumber.trim(),
          taxCode: taxCode.trim() || undefined,
          businessLicense: businessLicense.trim() || undefined,
        }),
      });
      navigate('/verify-email?email=' + encodeURIComponent(cleanEmail));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message
        ?? 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('email')) setErrors(p => ({ ...p, email: msg }));
      else if (msg.toLowerCase().includes('phone')) setErrors(p => ({ ...p, phone: msg }));
      else setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────

  const handleGoogleSuccess = async (cr: { credential?: string }) => {
    if (!cr.credential) return;
    setServerError('');
    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle(cr.credential, role);
      if (res.success && res.data) {
        const authData = res.data;

        // ⚠️ Always save token to store FIRST so subsequent API calls have JWT
        loginToStore(authData);

        if (authData.role === 'LANDLORD') {
          if (!authData.identityInfoSubmitted) {
            // New Google LANDLORD — needs to fill in CCCD first
            navigate('/landlord-verify-info');
          } else if (!authData.landlordVerified) {
            // CCCD submitted, waiting for admin approval
            navigate('/landlord-pending');
          } else {
            navigate('/landlord/dashboard');
          }
        } else {
          navigate('/tenant/dashboard');
        }
      } else {
        setServerError(res.message || 'Google authentication failed.');
      }
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Google authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'var(--canvas)', padding: '40px 24px' }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-6" style={{ textDecoration: 'none' }}>
          <span className="flex items-center justify-center rounded-full text-white font-bold"
            style={{ width: 36, height: 36, background: 'var(--primary)', fontSize: 16 }}>🏠</span>
          <span className="font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>BoardingHub</span>
        </Link>

        <div
          className="w-full animate-fade-up"
          style={{
            maxWidth: isLandlord ? 680 : 520,
            background: 'var(--surface-card)',
            borderRadius: 16,
            border: '1px solid var(--hairline)',
            padding: '36px 40px',
            boxShadow: '0 8px 32px rgba(32,32,32,0.08)',
            transition: 'max-width 0.3s ease',
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="display-md" style={{ color: 'var(--ink)', marginBottom: 6 }}>
              {isLandlord ? '🏢 Register as Landlord' : '🏡 Create your account'}
            </h1>
            <p className="body-md" style={{ color: 'var(--charcoal)' }}>
              {isLandlord
                ? 'List your properties and connect with tenants on BoardingHub.'
                : 'Join thousands of happy tenants and landlords.'}
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex rounded-full p-1 mb-6" style={{ background: 'var(--surface-bone)', gap: 4 }}>
            {(['TENANT', 'LANDLORD'] as Role[]).map((r) => (
              <button
                key={r} type="button" onClick={() => { setRole(r); setErrors({}); setServerError(''); }}
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
                {r === 'TENANT' ? "🏡 I'm a Tenant" : "🏢 I'm a Landlord"}
              </button>
            ))}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="alert alert-error mb-5 animate-fade-in" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Layout: 2 columns when LANDLORD, 1 column when TENANT ────── */}
            <div style={{ display: 'grid', gridTemplateColumns: isLandlord ? '1fr 1fr' : '1fr', gap: 16 }}>

              {/* ── LEFT / FULL COLUMN: Basic info ──────────────────────────── */}
              <div className="flex flex-col gap-4">

                {/* Section label for LANDLORD */}
                {isLandlord && (
                  <p className="label-sm" style={{ color: 'var(--ash)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>
                    Account Info
                  </p>
                )}

                <Field id="reg-name" label="Full Name" required error={errors.name}>
                  <input id="reg-name" type="text" className="input-field"
                    placeholder="Nguyen Van A" value={name}
                    onChange={e => setName(e.target.value)} maxLength={120} autoComplete="name" />
                </Field>

                <Field id="reg-email" label="Email Address" required error={errors.email}>
                  <input id="reg-email" type="email" className="input-field"
                    placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </Field>

                <Field id="reg-phone" label="Phone Number" required error={errors.phone}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 label-sm"
                      style={{ color: 'var(--charcoal)', borderRight: '1px solid var(--hairline)', paddingRight: 12 }}>
                      +84
                    </span>
                    <input id="reg-phone" type="tel" className="input-field"
                      style={{ paddingLeft: 64 }} placeholder="912 345 678"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      maxLength={20} autoComplete="tel" />
                  </div>
                </Field>

                <Field id="reg-password" label="Password" required error={errors.password}>
                  <div className="relative">
                    <input id="reg-password" type={showPw ? 'text' : 'password'}
                      className="input-field" style={{ paddingRight: 48 }}
                      placeholder="Min 8 characters" value={password}
                      onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      aria-label={showPw ? 'Hide' : 'Show'}
                      style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPw ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <StrengthBar password={password} />
                </Field>

                <Field id="reg-confirm" label="Confirm Password" required error={errors.confirm}>
                  <div className="relative">
                    <input id="reg-confirm" type={showConfirmPw ? 'text' : 'password'}
                      className="input-field" style={{ paddingRight: 48 }}
                      placeholder="Re-enter your password" value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      aria-label={showConfirmPw ? 'Hide' : 'Show'}
                      style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showConfirmPw ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </Field>
              </div>

              {/* ── RIGHT COLUMN: LANDLORD verification info ────────────────── */}
              {isLandlord && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <p className="label-sm" style={{ color: 'var(--ash)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>
                    Landlord Verification
                  </p>

                  {/* Info banner */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                    <p className="caption" style={{ color: '#1d4ed8', lineHeight: 1.5 }}>
                      Your details will be reviewed by our admin team within <strong>1–2 business days</strong>.
                      You can sign in after email verification while awaiting approval.
                    </p>
                  </div>

                  <Field id="reg-identity" label="CCCD / Identity Number" required error={errors.identityNumber}>
                    <input id="reg-identity" type="text" className="input-field"
                      placeholder="012345678901" value={identityNumber}
                      onChange={e => setIdentityNumber(e.target.value)} maxLength={50} />
                  </Field>

                  <Field id="reg-taxcode" label="Tax Code" optional>
                    <input id="reg-taxcode" type="text" className="input-field"
                      placeholder="0123456789" value={taxCode}
                      onChange={e => setTaxCode(e.target.value)} maxLength={50} />
                  </Field>

                  <Field id="reg-license" label="Business License" optional>
                    <input id="reg-license" type="text" className="input-field"
                      placeholder="License number or reference" value={businessLicense}
                      onChange={e => setBusinessLicense(e.target.value)} maxLength={255} />
                  </Field>

                  {/* What happens next */}
                  <div style={{
                    padding: '14px', borderRadius: 10,
                    background: 'var(--surface-bone)', border: '1px solid var(--hairline)',
                  }}>
                    <p className="label-sm mb-2" style={{ color: 'var(--ink)' }}>What happens next?</p>
                    {[
                      'Verify your email via OTP',
                      'Sign in to your account',
                      'Admin reviews your details',
                      'Full landlord access granted',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <span className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                          style={{ width: 20, height: 20, background: 'var(--hairline)', color: 'var(--charcoal)' }}>
                          {i + 1}
                        </span>
                        <span className="caption" style={{ color: 'var(--charcoal)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input id="reg-terms" type="checkbox" checked={agreed}
                  onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4"
                  style={{ accentColor: 'var(--primary)' }} />
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.terms}</p>}
            </div>

            <button id="reg-submit" type="submit"
              className="btn-primary w-full mt-5"
              style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
              disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Creating account…
                </span>
              ) : isLandlord ? '🏢 Create Landlord Account' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
            <span className="caption" style={{ color: 'var(--ash)' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
          </div>

          {/* Google OAuth */}
          <div className="flex flex-col items-center gap-2">
            <GoogleLogin onSuccess={handleGoogleSuccess}
              onError={() => setServerError('Google Sign-In failed. Please try again.')}
              text="continue_with" width="100%" />
            <p className="caption" style={{ color: 'var(--ash)' }}>
              Registering as{' '}
              <strong style={{ color: 'var(--charcoal)' }}>
                {isLandlord ? '🏢 Landlord' : '🏡 Tenant'}
              </strong>
            </p>
          </div>

          <p className="body-sm text-center mt-5" style={{ color: 'var(--charcoal)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <Link to="/" className="mt-5 body-sm flex items-center gap-1" style={{ color: 'var(--charcoal)', textDecoration: 'none' }}>
          ← Back to home
        </Link>
      </div>
    </GoogleOAuthProvider>
  );
}
