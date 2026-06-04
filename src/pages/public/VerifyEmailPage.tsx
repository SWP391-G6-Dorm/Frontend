import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// SCR-04 — OTP / Email Verification
// Entity: User — updates User.status from PENDING → ACTIVE on success

const OTP_LENGTH = 6;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    // Simulate API → User.status = ACTIVE
    setTimeout(() => {
      setLoading(false);
      if (code === '123456') { // demo: any real code would work
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    }, 1000);
  }

  function handleResend() {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setResendCountdown(60);
    setCanResend(false);
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
        {success ? (
          /* Success state */
          <div className="text-center animate-fade-in">
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-full text-3xl"
              style={{ width: 72, height: 72, background: '#dcfce7', fontSize: 32 }}
            >
              ✅
            </div>
            <h1 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Email Verified!</h1>
            <p className="body-md" style={{ color: 'var(--charcoal)' }}>
              Your account is now active. Redirecting to login…
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-full text-3xl"
                style={{ width: 72, height: 72, background: '#fde8e3', fontSize: 32 }}
              >
                📧
              </div>
              <h1 className="display-md mb-2" style={{ color: 'var(--ink)' }}>Verify your email</h1>
              <p className="body-md" style={{ color: 'var(--charcoal)' }}>
                We sent a 6-digit code to
              </p>
              <p className="font-semibold mt-1" style={{ color: 'var(--ink)' }}>{email}</p>
            </div>

            {error && (
              <div className="alert alert-error mb-6 animate-fade-in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* OTP boxes */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="text-center font-bold text-xl outline-none transition-all duration-150"
                    style={{
                      width: 52,
                      height: 60,
                      background: 'var(--surface-card)',
                      border: digit ? '2px solid var(--ink)' : '1px solid var(--hairline)',
                      borderRadius: 10,
                      color: 'var(--ink)',
                      boxShadow: digit ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                id="otp-verify"
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
                    Verifying…
                  </span>
                ) : 'Verify Email'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>Didn't receive the code?</p>
              <button
                id="otp-resend"
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="body-sm font-semibold mt-1 transition-colors"
                style={{
                  color: canResend ? 'var(--primary)' : 'var(--ash)',
                  background: 'none',
                  border: 'none',
                  cursor: canResend ? 'pointer' : 'default',
                }}
              >
                {canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
              </button>
            </div>
          </>
        )}
      </div>

      <Link to="/register" className="mt-6 body-sm flex items-center gap-1" style={{ color: 'var(--charcoal)', textDecoration: 'none' }}>
        ← Back to register
      </Link>
    </div>
  );
}
