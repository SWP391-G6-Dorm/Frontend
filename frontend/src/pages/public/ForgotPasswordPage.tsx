import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

/* ── Password strength bar ── */
function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#dc2626', '#f59e0b', '#2563eb', '#2b9a66'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 9999,
              background: i <= score ? colors[score] : 'var(--hairline)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

/* ── Step types ── */
type Step = 'email' | 'otp' | 'newPassword' | 'done';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  /* ── State ── */
  const [step, setStep]         = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Countdown helper ── */
  function startCountdown() {
    setCountdown(300);
    const t = setInterval(() =>
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      }), 1000);
  }
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  /* ── STEP 1: Send OTP ── */
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) { setError('Email is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Invalid email format'); return; }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || 'Email not found. Please check and try again.');
        return;
      }
      setStep('otp');
      startCountdown();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Email not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── STEP 1 Resend ── */
  async function handleResend() {
    setError(null);
    setLoading(true);
    setOtp(['', '', '', '', '', '']);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || 'Something went wrong. Please try again.');
        return;
      }
      startCountdown();
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── OTP box input handler ── */
  function handleOtpChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setError(null);
    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }

  /* ── STEP 2: Verify OTP → go to new password ── */
  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const otpCode = otp.join('');
    if (otpCode.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    // Move to next step — actual verification happens with password reset
    setStep('newPassword');
  }

  /* ── STEP 3: Reset Password ── */
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least 1 uppercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least 1 number'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const otpCode = otp.join('');
      const res = await authApi.resetPassword(email, otpCode, password);
      if (!res.success) {
        setError(res.message || 'Invalid or expired code. Please request a new one.');
        return;
      }
      setStep('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError?.response?.data?.message || '';
      // OTP wrong/expired → go back to OTP step
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('mã')) {
        setError(msg);
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Logo ── */
  const Logo = (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
      <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95" />
          <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6" />
        </svg>
      </div>
      <span className="font-display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
        Homestay<span style={{ color: 'var(--primary)' }}>&</span>Resort
      </span>
    </Link>
  );

  /* ── Error alert ── */
  const ErrorAlert = error ? (
    <div className="alert alert-error" style={{ marginBottom: 20 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {error}
    </div>
  ) : null;

  /* ── Spinner icon ── */
  const Spinner = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      {Logo}

      <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 460, padding: 40 }}>

        {/* ─────────────────────────────────────────
            STEP 1 — Enter Email
        ───────────────────────────────────────── */}
        {step === 'email' && (
          <>
            {/* Lock icon */}
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h1 className="display-md" style={{ marginBottom: 8 }}>Forgot Password</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 28, lineHeight: 1.6 }}>
              Enter your registered email and we'll send you a 6-digit verification code.
            </p>

            {ErrorAlert}

            <form onSubmit={handleSendOtp} noValidate>
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
                  disabled={loading}
                />
              </div>

              <button id="forgot-password-submit-btn" type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
                {loading ? <>{Spinner} Sending...</> : 'Send Verification Code'}
              </button>

              <Link to="/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                ← Back to Login
              </Link>
            </form>
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP 2 — Enter OTP
        ───────────────────────────────────────── */}
        {step === 'otp' && (
          <>
            {/* Email icon */}
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>

            <h1 className="display-md" style={{ marginBottom: 8 }}>Check Your Email</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 4, lineHeight: 1.6 }}>
              We sent a 6-digit code to
            </p>
            <p className="body-md" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 24, wordBreak: 'break-all' }}>
              {email}
            </p>

            {ErrorAlert}

            <form onSubmit={handleVerifyOtp} noValidate>
              {/* OTP 6-box input */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label form-label-required" style={{ marginBottom: 12 }}>Verification Code</label>
                <div
                  style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      disabled={loading}
                      style={{
                        width: 48,
                        height: 56,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        borderRadius: 10,
                        border: `1.5px solid ${error ? 'var(--error)' : digit ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
                        background: 'var(--surface-card)',
                        color: 'var(--ink)',
                        outline: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        caretColor: 'var(--primary)',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(234,40,4,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = digit ? 'var(--hairline-strong)' : 'var(--hairline)'; e.target.style.boxShadow = 'none'; }}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown / Resend */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {countdown > 0 ? (
                  <p className="body-sm text-charcoal">
                    Resend code in{' '}
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {minutes}:{String(seconds).padStart(2, '0')}
                    </span>
                  </p>
                ) : (
                  <button type="button" className="btn-ghost" onClick={handleResend} disabled={loading} style={{ margin: '0 auto' }}>
                    {loading ? <>{Spinner} Sending...</> : '↻ Resend Code'}
                  </button>
                )}
              </div>

              <button id="otp-verify-btn" type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading || otp.join('').length < 6}>
                Verify Code
              </button>

              <button type="button" className="btn-ghost" onClick={() => { setStep('email'); setError(null); setOtp(['', '', '', '', '', '']); }}
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                ← Change Email
              </button>
            </form>
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP 3 — New Password
        ───────────────────────────────────────── */}
        {step === 'newPassword' && (
          <>
            {/* Shield icon */}
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            <h1 className="display-md" style={{ marginBottom: 8 }}>Create New Password</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 24, lineHeight: 1.6 }}>
              Choose a strong password for your account.
            </p>

            {ErrorAlert}

            <form onSubmit={handleResetPassword} noValidate>
              {/* New Password */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label form-label-required" htmlFor="reset-pw">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-pw"
                    type={showPw ? 'text' : 'password'}
                    className={`input ${error && !confirm ? 'input-error' : ''}`}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    autoComplete="new-password"
                    disabled={loading}
                    style={{ paddingRight: 50 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide' : 'Show'}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', padding: 4 }}>
                    {showPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label form-label-required" htmlFor="reset-confirm">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className={`input ${error ? 'input-error' : ''}`}
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(null); }}
                    autoComplete="new-password"
                    disabled={loading}
                    style={{ paddingRight: 50 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide' : 'Show'}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', padding: 4 }}>
                    {showConfirm
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Password requirements checklist */}
              <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'At least 8 characters', test: password.length >= 8 },
                  { label: 'One uppercase letter',  test: /[A-Z]/.test(password) },
                  { label: 'One number',            test: /[0-9]/.test(password) },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: item.test ? '#dcfce7' : 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.test && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
                    </div>
                    <span style={{ color: item.test ? 'var(--success)' : 'var(--charcoal)' }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <button id="reset-password-submit-btn" type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
                {loading ? <>{Spinner} Resetting...</> : 'Reset Password'}
              </button>

              <button type="button" className="btn-ghost" onClick={() => { setStep('otp'); setError(null); }}
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                ← Back
              </button>
            </form>
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP 4 — Done
        ───────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #2b9a66', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="display-md" style={{ marginBottom: 8 }}>Password Reset!</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 24, lineHeight: 1.6 }}>
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
              Go to Login
            </Link>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
