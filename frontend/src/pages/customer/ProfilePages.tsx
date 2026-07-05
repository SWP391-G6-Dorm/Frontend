// ─── ProfilePages.tsx — SCR-11, 12, 13 ───────────────────────────────────────
// Exports: UserProfilePage, EditProfilePage, ChangePasswordPage

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useAuthStore } from '../../store/authStore';
import { fetchMyProfile, updateMyProfile, changeMyPassword, type UserProfile } from '../../api/usersApi';

function nameInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase();
}

// Layout phù hợp theo role — profile là màn dùng chung Customer & Manager (SCR-11)
function RoleLayout({ children }: { children: React.ReactNode }) {
  const role = useAuthStore(s => s.role);
  return role === 'MANAGER'
    ? <ManagerLayout>{children}</ManagerLayout>
    : <CustomerLayout>{children}</CustomerLayout>;
}

// ── SCR-11: Profile ───────────────────────────────────────────────────────────
export function UserProfilePage() {
  const role = useAuthStore(s => s.role);
  const profileBase = role === 'MANAGER' ? '/manager/profile' : '/customer/profile';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchMyProfile();
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <RoleLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>My Profile</h1>

        {loading ? (
          <div className="card-lg" style={{ padding: 48, textAlign: 'center' }}>
            <p className="body-md text-charcoal">Đang tải hồ sơ...</p>
          </div>
        ) : error || !profile ? (
          <div className="card-lg" style={{ padding: 48, textAlign: 'center' }}>
            <p className="body-md" style={{ color: 'var(--error)' }}>{error || 'Không tìm thấy hồ sơ.'}</p>
          </div>
        ) : (
          <>
            <div className="card-lg" style={{ padding: 32, marginBottom: 20 }}>
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--hairline)' }}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{nameInitials(profile.fullName)}</div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{profile.fullName}</h2>
                  <p className="body-sm text-charcoal">{profile.email}</p>
                  <p className="body-sm text-charcoal">Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                </div>
                <span className="badge badge-primary">{profile.role === 'MANAGER' ? 'Manager' : 'Customer'}</span>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  { label: 'Full Name', value: profile.fullName },
                  { label: 'Email',     value: profile.email },
                  { label: 'Phone',     value: profile.phone },
                  { label: 'Status',    value: profile.status },
                ].map(item => (
                  <div key={item.label}>
                    <p className="form-label">{item.label}</p>
                    <p style={{ fontSize: 15, color: 'var(--ink)', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={`${profileBase}/edit`} className="btn-primary">Edit Profile</Link>
              <Link to={`${profileBase}/change-password`} className="btn-outline">Change Password</Link>
            </div>
          </>
        )}
      </div>
    </RoleLayout>
  );
}

// ── SCR-12: Edit Profile ───────────────────────────────────────────────────────
export function EditProfilePage() {
  const navigate = useNavigate();
  const role = useAuthStore(s => s.role);
  const updateAuthProfile = useAuthStore(s => s.updateProfile);
  const profileBase = role === 'MANAGER' ? '/manager/profile' : '/customer/profile';

  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [email, setEmail] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setInitialLoading(true);
      setLoadError('');
      try {
        const data = await fetchMyProfile();
        if (cancelled) return;
        setForm({ fullName: data.fullName ?? '', phone: data.phone ?? '' });
        setEmail(data.email ?? '');
      } catch {
        if (!cancelled) setLoadError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    // Backend yêu cầu định dạng VN: bắt đầu +84 hoặc 0, theo sau 9-10 chữ số
    const cleanedPhone = form.phone.replace(/[\s\-()]/g, '');
    if (cleanedPhone && !/^(\+84|0)[0-9]{9,10}$/.test(cleanedPhone)) {
      e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitError('');
    setLoading(true);
    try {
      const cleanedPhone = form.phone.replace(/[\s\-()]/g, '');
      const updated = await updateMyProfile({ fullName: form.fullName.trim(), phone: cleanedPhone });
      updateAuthProfile({ fullName: updated.fullName, phone: updated.phone ?? '' });
      setSuccess(true);
      setTimeout(() => navigate(profileBase), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.';
      setSubmitError(msg);
      setLoading(false);
    }
  }

  const avatarInitials = form.fullName.trim() ? nameInitials(form.fullName) : '?';

  return (
    <RoleLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={profileBase} className="text-primary" style={{ textDecoration: 'none' }}>Profile</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Edit</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Edit Profile</h1>

        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
          Profile updated successfully! Redirecting...
        </div>}

        {initialLoading ? (
          <div className="card-lg" style={{ padding: 48, textAlign: 'center' }}>
            <p className="body-md text-charcoal">Đang tải hồ sơ...</p>
          </div>
        ) : loadError ? (
          <div className="card-lg" style={{ padding: 48, textAlign: 'center' }}>
            <p className="body-md" style={{ color: 'var(--error)' }}>{loadError}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 32 }}>
            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>{avatarInitials}</div>
              <div>
                <button type="button" className="btn-outline btn-sm" disabled title="Tính năng đang phát triển">Upload Photo</button>
                <p className="form-hint" style={{ marginTop: 4 }}>JPG, PNG max 5MB</p>
              </div>
            </div>

            {submitError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{submitError}</div>}

            {/* Email (readonly) */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="input" value={email} disabled />
              <p className="form-hint">Email cannot be changed</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label form-label-required" htmlFor="editName">Full Name</label>
              <input id="editName" className={`input ${errors.fullName ? 'input-error' : ''}`}
                value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
              {errors.fullName && <p className="form-error">{errors.fullName}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="form-label" htmlFor="editPhone">Phone Number</label>
              <input id="editPhone" type="tel" className={`input ${errors.phone ? 'input-error' : ''}`}
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              <Link to={profileBase} className="btn-ghost">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </RoleLayout>
  );
}

// ── SCR-13: Change Password ────────────────────────────────────────────────────
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const role = useAuthStore(s => s.role);
  const profileBase = role === 'MANAGER' ? '/manager/profile' : '/customer/profile';

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword) e.newPassword = 'New password is required';
    else if (form.newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.currentPassword === form.newPassword) e.newPassword = 'New password must differ from current';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await changeMyPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate(profileBase), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.';
      setErrors({ currentPassword: msg });
      setLoading(false);
    }
  }

  function EyeBtn({ field }: { field: keyof typeof show }) {
    return (
      <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)' }}>
        {show[field]
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    );
  }

  return (
    <RoleLayout>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={profileBase} className="text-primary" style={{ textDecoration: 'none' }}>Profile</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Change Password</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Change Password</h1>

        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
          Password changed successfully!
        </div>}

        <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 32 }}>
          {[
            { id: 'curr', label: 'Current Password', field: 'currentPassword', showKey: 'current' as keyof typeof show },
            { id: 'new',  label: 'New Password',     field: 'newPassword',     showKey: 'new'     as keyof typeof show },
            { id: 'conf', label: 'Confirm New Password', field: 'confirmPassword', showKey: 'confirm' as keyof typeof show },
          ].map(({ id, label, field, showKey }) => (
            <div key={id} style={{ marginBottom: 20 }}>
              <label className="form-label form-label-required" htmlFor={id}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input id={id} type={show[showKey] ? 'text' : 'password'}
                  className={`input ${errors[field] ? 'input-error' : ''}`}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  value={(form as any)[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  style={{ paddingRight: 50 }}
                />
                <EyeBtn field={showKey} />
              </div>
              {errors[field] && <p className="form-error">{errors[field]}</p>}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</button>
            <Link to={profileBase} className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </RoleLayout>
  );
}
