// ─── ProfilePages.tsx — SCR-11, 12, 13 ───────────────────────────────────────
// Exports: UserProfilePage, EditProfilePage, ChangePasswordPage

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const USER = { fullName: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901 234 567', address: '123 Đường Lê Lợi, Q1, TP.HCM', createdAt: '2025-01-15', avatarUrl: '' };

const initials = USER.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

// ── SCR-11: Profile ───────────────────────────────────────────────────────────
export function UserProfilePage() {
  return (
    <CustomerLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>My Profile</h1>

        <div className="card-lg" style={{ padding: 32, marginBottom: 20 }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--hairline)' }}>
            {USER.avatarUrl ? (
              <img src={USER.avatarUrl} alt={USER.fullName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{USER.fullName}</h2>
              <p className="body-sm text-charcoal">{USER.email}</p>
              <p className="body-sm text-charcoal">Member since {new Date(USER.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
            </div>
            <span className="badge badge-primary">Customer</span>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: 'Full Name', value: USER.fullName },
              { label: 'Email',     value: USER.email },
              { label: 'Phone',     value: USER.phone },
              { label: 'Address',   value: USER.address },
            ].map(item => (
              <div key={item.label}>
                <p className="form-label">{item.label}</p>
                <p style={{ fontSize: 15, color: 'var(--ink)', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>{item.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/customer/profile/edit" className="btn-primary">Edit Profile</Link>
          <Link to="/customer/profile/change-password" className="btn-outline">Change Password</Link>
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-12: Edit Profile ───────────────────────────────────────────────────────
export function EditProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: USER.fullName, phone: USER.phone, address: USER.address });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.phone && !/^[0-9+\-() ]{9,15}$/.test(form.phone)) e.phone = 'Invalid phone number';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // TODO: await userApi.updateProfile(form);
      await new Promise(r => setTimeout(r, 800));
      setSuccess(true);
      setTimeout(() => navigate('/customer/profile'), 1500);
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/profile" className="text-primary" style={{ textDecoration: 'none' }}>Profile</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Edit</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Edit Profile</h1>

        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
          Profile updated successfully! Redirecting...
        </div>}

        <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 32 }}>
          {/* Avatar upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--hairline)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>{initials}</div>
            <div>
              <button type="button" className="btn-outline btn-sm">Upload Photo</button>
              <p className="form-hint" style={{ marginTop: 4 }}>JPG, PNG max 5MB</p>
            </div>
          </div>

          {/* Email (readonly) */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Email Address</label>
            <input type="email" className="input" value={USER.email} disabled />
            <p className="form-hint">Email cannot be changed</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="editName">Full Name</label>
            <input id="editName" className={`input ${errors.fullName ? 'input-error' : ''}`}
              value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
            {errors.fullName && <p className="form-error">{errors.fullName}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="editPhone">Phone Number</label>
            <input id="editPhone" type="tel" className={`input ${errors.phone ? 'input-error' : ''}`}
              value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            {errors.phone && <p className="form-error">{errors.phone}</p>}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label className="form-label" htmlFor="editAddress">Address</label>
            <textarea id="editAddress" className="textarea" rows={3}
              value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            <Link to="/customer/profile" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-13: Change Password ────────────────────────────────────────────────────
export function ChangePasswordPage() {
  const navigate = useNavigate();
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
      // TODO: await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      await new Promise(r => setTimeout(r, 800));
      setSuccess(true);
      setTimeout(() => navigate('/customer/profile'), 1500);
    } catch {
      setErrors({ currentPassword: 'Current password is incorrect' });
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
    <CustomerLayout>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/profile" className="text-primary" style={{ textDecoration: 'none' }}>Profile</Link>
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
            <Link to="/customer/profile" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
