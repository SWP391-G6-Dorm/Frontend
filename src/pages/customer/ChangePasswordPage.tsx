import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

export default function ChangePasswordPage() {
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
