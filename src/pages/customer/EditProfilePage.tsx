import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const USER = { fullName: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901 234 567', address: '123 Đường Lê Lợi, Q1, TP.HCM', avatarUrl: '' };
const initials = USER.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

export default function EditProfilePage() {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--hairline)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>{initials}</div>
            <div>
              <button type="button" className="btn-outline btn-sm">Upload Photo</button>
              <p className="form-hint" style={{ marginTop: 4 }}>JPG, PNG max 5MB</p>
            </div>
          </div>

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
