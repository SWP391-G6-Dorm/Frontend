import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// SCR-06 — Reset Password
// Entity: User.passwordHash (updated) · RefreshToken (all revoked on success)

function CheckItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: met ? 'var(--success)' : 'var(--stone)', fontSize: 14 }}>{met ? '✓' : '○'}</span>
      <span className="body-sm" style={{ color: met ? 'var(--ink)' : 'var(--ash)' }}>{text}</span>
    </div>
  );
}

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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const checks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    match:   password !== '' && password === confirm,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!checks.length || !checks.upper || !checks.number) {
      setError('Password does not meet requirements.'); return;
    }
    if (!checks.match) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      let c = 3;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c === 0) { clearInterval(interval); navigate('/login'); }
      }, 1000);
    }, 1000);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--canvas)', padding: '48px 24px' }}
    >
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
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-6 flex items-center justify-center rounded-full text-3xl"
              style={{ width: 72, height: 72, background: '#dcfce7', fontSize: 32 }}>✅</div>
            <h1 className="display-md mb-3" style={{ color: 'var(--ink)' }}>Password Reset!</h1>
            <p className="body-md mb-2" style={{ color: 'var(--charcoal)' }}>
              Your password has been updated. All other sessions have been signed out.
            </p>
            <div className="alert alert-success mt-4">
              Redirecting to login in {countdown}s…
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex items-center justify-center rounded-full text-3xl"
                style={{ width: 72, height: 72, background: '#fde8e3', fontSize: 32 }}>🛡️</div>
              <h1 className="display-md mb-2" style={{ color: 'var(--ink)' }}>Set new password</h1>
              <p className="body-md" style={{ color: 'var(--charcoal)' }}>
                Choose a strong password for your account.
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
              {/* User.passwordHash */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>New Password</label>
                <div className="relative">
                  <input
                    id="reset-password"
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
              </div>

              {/* Confirm */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Confirm New Password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  className="input-field"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {/* Requirements checklist */}
              {password && (
                <div
                  className="rounded-lg p-4 flex flex-col gap-2"
                  style={{ background: 'var(--surface-bone)' }}
                >
                  <CheckItem met={checks.length} text="At least 8 characters" />
                  <CheckItem met={checks.upper} text="One uppercase letter" />
                  <CheckItem met={checks.number} text="One number" />
                  <CheckItem met={checks.match} text="Passwords match" />
                </div>
              )}

              <button
                id="reset-submit"
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
                    Resetting…
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
