import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';

const OTP_LENGTH = 6;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || 'your email';
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleOtpChange(index: number, value: string) {
    const val = value.replace(/\D/g, '');
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = val[val.length - 1];
    setOtp(newOtp);
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter the complete 6-digit code.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otpCode: code });
      if (!res.success) {
        setError(res.message || 'Invalid or expired code. Please request a new one.');
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setError(null);
    
    try {
      const res = await authApi.resendOtp(email);
      if (!res.success) {
        setError(res.message || 'Failed to resend code.');
        setCanResend(true);
        setCountdown(0);
        return;
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Failed to resend code.');
      setCanResend(true);
      setCountdown(0);
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

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
        <span className="font-display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>
          Homestay<span style={{ color: 'var(--primary)' }}>&</span>Resort
        </span>
      </Link>

      <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 440, padding: 40, textAlign: 'center' }}>
        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 8 }}>Verify your email</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 28 }}>
          We sent a 6-digit code to<br/>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{email}</span>
        </p>

        {success ? (
          <div className="alert alert-success" style={{ textAlign: 'left' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
            Email verified! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20, textAlign: 'left' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* OTP inputs */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
              {otp.map((val, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: 52, height: 60,
                    border: `1.5px solid ${val ? 'var(--primary)' : 'var(--hairline)'}`,
                    borderRadius: 10,
                    fontSize: 24,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 500,
                    textAlign: 'center',
                    outline: 'none',
                    background: val ? '#fff1ee' : 'var(--surface-card)',
                    color: 'var(--ink)',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 16 }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button type="button" onClick={handleResend} disabled={!canResend}
              style={{ background: 'none', border: 'none', cursor: canResend ? 'pointer' : 'default', fontSize: 14, fontWeight: 600, color: canResend ? 'var(--primary)' : 'var(--ash)', padding: 0 }}>
              {canResend ? 'Resend code' : `Resend code in ${countdown}s`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
