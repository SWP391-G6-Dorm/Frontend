import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-13 — Change Password
// Entity: User.passwordHash (updated) · RefreshToken (all revoked on success)

function StrengthBar({ pw }: { pw: string }) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#dc2626', '#d97706', '#2563eb', '#16a34a'];
  return pw ? (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 rounded-full" style={{ height: 3, background: i <= score ? colors[score] : 'var(--hairline)' }} />
        ))}
      </div>
      <p className="caption mt-1" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  ) : null;
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Current password is required.';
    if (!newPw) e.new = 'New password is required.';
    else if (newPw.length < 8) e.new = 'Password must be at least 8 characters.';
    if (newPw !== confirm) e.confirm = 'Passwords do not match.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Demo: simulate wrong current password
      if (current !== 'correctpassword') {
        setErrors({ current: 'Current password is incorrect.' });
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }, 1000);
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 480 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tenant/profile" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Change Password</h1>
        </div>

        {success ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div className="text-4xl mb-3">✅</div>
            <h2 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Password Updated</h2>
            <div className="alert alert-success mb-4">
              All other sessions have been signed out for security.
            </div>
            <p className="body-md" style={{ color: 'var(--charcoal)' }}>Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: 28 }}>
              <div className="alert alert-info mb-5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Changing your password will sign out all other active sessions.
              </div>

              <div className="flex flex-col gap-5">
                {/* Current password → validates User.passwordHash */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                    Current Password <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cp-current"
                      type={showCurrent ? 'text' : 'password'}
                      className="input-field-rect"
                      style={{ paddingRight: 44 }}
                      value={current}
                      onChange={e => setCurrent(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                      {showCurrent ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.current && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.current}</p>}
                </div>

                {/* New password → User.passwordHash */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                    New Password <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cp-new"
                      type={showNew ? 'text' : 'password'}
                      className="input-field-rect"
                      style={{ paddingRight: 44 }}
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="Min 8 characters"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                      {showNew ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <StrengthBar pw={newPw} />
                  {errors.new && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.new}</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                    Confirm New Password <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    id="cp-confirm"
                    type="password"
                    className="input-field-rect"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                  {confirm && newPw !== confirm && (
                    <p className="caption mt-1" style={{ color: 'var(--error)' }}>Passwords do not match.</p>
                  )}
                  {confirm && newPw === confirm && newPw && (
                    <p className="caption mt-1" style={{ color: 'var(--success)' }}>✓ Passwords match</p>
                  )}
                </div>

                {/* Requirements */}
                {newPw && (
                  <div className="rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                    {[
                      { met: newPw.length >= 8, text: 'At least 8 characters' },
                      { met: /[A-Z]/.test(newPw),       text: 'One uppercase letter' },
                      { met: /[0-9]/.test(newPw),       text: 'One number' },
                    ].map(r => (
                      <div key={r.text} className="flex items-center gap-2 mb-1">
                        <span style={{ color: r.met ? 'var(--success)' : 'var(--stone)', fontSize: 12 }}>{r.met ? '✓' : '○'}</span>
                        <span className="body-sm" style={{ color: r.met ? 'var(--ink)' : 'var(--ash)' }}>{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
                <button
                  id="cp-submit"
                  type="submit"
                  className="btn-primary"
                  style={{ height: 44, padding: '0 28px', fontSize: 15 }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Updating…
                    </span>
                  ) : '🔑 Update Password'}
                </button>
                <Link to="/tenant/profile" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </TenantLayout>
  );
}
