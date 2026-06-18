import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';

// ── Password strength bar ────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
  const colors = ['', '#dc2626', '#f59e0b', '#2563eb', '#2b9a66'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 9999,
            background: i <= score ? colors[score] : 'var(--hairline)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

// ── Password requirement checklist ───────────────────────────────────────────

const CHECKLIST = [
  { label: 'Ít nhất 8 ký tự',  test: (p: string) => p.length >= 8 },
  { label: '1 chữ hoa (A–Z)',   test: (p: string) => /[A-Z]/.test(p) },
  { label: '1 chữ số (0–9)',    test: (p: string) => /[0-9]/.test(p) },
];

// ── OTP Input Row ─────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function handleChange(index: number, rawVal: string) {
    const digit = rawVal.replace(/\D/g, '');
    if (!digit) {
      const next = [...value]; next[index] = '';
      onChange(next);
      if (index > 0) refs.current[index - 1]?.focus();
      return;
    }
    const next = [...value]; next[index] = digit[digit.length - 1];
    onChange(next);
    if (index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = [...value];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    onChange(next);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          style={{
            width: 50, height: 58,
            border: `1.5px solid ${digit ? 'var(--primary)' : 'var(--hairline)'}`,
            borderRadius: 10,
            fontSize: 22,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            textAlign: 'center',
            outline: 'none',
            background: digit ? '#fff1ee' : 'var(--surface-card)',
            color: 'var(--ink)',
            transition: 'all 0.15s',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const email           = params.get('email') || '';

  // step: 'otp' → nhập OTP | 'password' → nhập mật khẩu mới | 'done' → xong
  const [step, setStep]         = useState<'otp' | 'password' | 'done'>('otp');
  const [otp, setOtp]           = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpCode, setOtpCode]   = useState('');           // confirmed OTP từ step 1
  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Khởi countdown khi load trang
  useEffect(() => {
    if (!email) return;
    const t = setInterval(() =>
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return c - 1;
      }), 1000);
    return () => clearInterval(t);
  }, [email]);

  function startCountdown() {
    setCountdown(60);
    setCanResend(false);
    const t = setInterval(() =>
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return c - 1;
      }), 1000);
  }

  // ── Bước 1: Xác nhận OTP ──────────────────────────────────────────────────

  function handleOtpNext(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Vui lòng nhập đủ 6 chữ số.'); return; }
    setError(null);
    setOtpCode(code);
    setStep('password');
  }

  async function handleResendOtp() {
    if (!canResend || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || 'Gửi lại thất bại.');
        return;
      }
      startCountdown();
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || 'Gửi lại thất bại.');
    } finally {
      setResending(false);
    }
  }

  // ── Bước 2: Đặt mật khẩu mới ─────────────────────────────────────────────

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.password)          { setError('Mật khẩu không được để trống'); return; }
    if (form.password.length < 8)  { setError('Mật khẩu tối thiểu 8 ký tự'); return; }
    if (!/[A-Z]/.test(form.password)) { setError('Mật khẩu cần ít nhất 1 chữ hoa'); return; }
    if (!/[0-9]/.test(form.password)) { setError('Mật khẩu cần ít nhất 1 chữ số'); return; }
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (!email || !otpCode) { setError('Thiếu thông tin. Vui lòng thử lại từ đầu.'); return; }

    setError(null);
    setLoading(true);
    try {
      const res = await authApi.resetPassword(email, otpCode, form.password);
      if (!res.success) {
        setError(res.message || 'Đặt lại mật khẩu thất bại.');
        return;
      }
      setStep('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string }; status?: number } };
      const status = ax?.response?.status;
      if (status === 410) {
        // OTP đã hết hạn — quay về step OTP để nhập lại
        setError('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
        setStep('otp');
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpCode('');
      } else {
        setError(ax?.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Logo ─────────────────────────────────────────────────────────────────

  const Logo = () => (
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
  );

  // ── Missing email guard ──────────────────────────────────────────────────

  if (!email) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <Logo />
        <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 440, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="heading-sm" style={{ marginBottom: 8 }}>Liên kết không hợp lệ</h1>
          <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
            Vui lòng sử dụng đường dẫn từ trang Quên mật khẩu.
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ display: 'inline-flex' }}>
            Quên mật khẩu →
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <Logo />

      <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 440, padding: 40 }}>

        {/* ─────────── DONE ─────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b9a66" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <h1 className="heading-md" style={{ marginBottom: 10 }}>Mật khẩu đã được đặt lại!</h1>
            <p className="body-md text-charcoal">Đang chuyển hướng đến trang đăng nhập...</p>
          </div>
        )}

        {/* ─────────── STEP 1: Nhập OTP ─────────── */}
        {step === 'otp' && (
          <>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</div>
              <div style={{ flex: 1, height: 2, background: 'var(--hairline)' }} />
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--hairline)', color: 'var(--ash)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</div>
            </div>

            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <h1 className="heading-md" style={{ marginBottom: 6 }}>Nhập mã OTP</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 4 }}>
              Chúng tôi đã gửi mã 6 số đến
            </p>
            <p style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 24 }}>
              {email}
            </p>

            <form onSubmit={handleOtpNext}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <button
                type="submit"
                id="otp-next-btn"
                className="btn-primary"
                style={{ width: '100%', marginBottom: 14 }}
              >
                Tiếp tục →
              </button>

              {/* Resend OTP */}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || resending}
                style={{
                  width: '100%', padding: '8px 0', background: 'none', border: 'none',
                  cursor: (!canResend || resending) ? 'default' : 'pointer',
                  fontSize: 14, fontWeight: 600,
                  color: (!canResend || resending) ? 'var(--ash)' : 'var(--primary)',
                  marginBottom: 8,
                }}
              >
                {resending
                  ? 'Đang gửi lại...'
                  : canResend
                    ? 'Gửi lại mã OTP'
                    : `Gửi lại sau ${countdown}s`
                }
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link to="/forgot-password" className="body-sm text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>
                  ← Quay lại nhập email
                </Link>
              </div>
            </form>
          </>
        )}

        {/* ─────────── STEP 2: Nhập mật khẩu mới ─────────── */}
        {step === 'password' && (
          <>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', color: '#2b9a66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
              </div>
              <div style={{ flex: 1, height: 2, background: 'var(--primary)' }} />
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</div>
            </div>

            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>

            <h1 className="heading-md" style={{ marginBottom: 6 }}>Tạo mật khẩu mới</h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
              Chọn mật khẩu mạnh cho tài khoản của bạn.
            </p>

            <form onSubmit={handleResetSubmit}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Mật khẩu mới */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label form-label-required" htmlFor="reset-pw">Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-pw"
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    placeholder="Nhập mật khẩu mới"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: 50 }}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', padding: 4 }}>
                    {showPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              {/* Xác nhận mật khẩu */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label form-label-required" htmlFor="reset-confirm">Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-confirm"
                    type={showCf ? 'text' : 'password'}
                    className="input"
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    style={{ paddingRight: 50 }}
                  />
                  <button type="button" onClick={() => setShowCf(!showCf)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', padding: 4 }}>
                    {showCf
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {/* Match indicator */}
                {form.confirm && (
                  <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: form.password === form.confirm ? '#2b9a66' : '#dc2626' }}>
                    {form.password === form.confirm ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
                  </p>
                )}
              </div>

              {/* Checklist */}
              <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CHECKLIST.map(item => {
                  const ok = item.test(form.password);
                  return (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                        background: ok ? '#dcfce7' : 'var(--surface-bone)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}>
                        {ok && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2b9a66" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                      </div>
                      <span style={{ color: ok ? '#2b9a66' : 'var(--charcoal)', transition: 'color 0.2s' }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                id="reset-submit-btn"
                className="btn-primary"
                style={{ width: '100%', marginBottom: 12 }}
                disabled={loading}
              >
                {loading
                  ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Đang xử lý...</>
                  : 'Đặt lại mật khẩu'
                }
              </button>

              <button type="button" onClick={() => { setStep('otp'); setError(null); setForm({ password: '', confirm: '' }); }}
                className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                ← Quay lại nhập OTP
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
