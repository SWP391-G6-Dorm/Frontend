import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-12 — Edit Profile
// Entity: User — mutable fields: User.name · User.phone · User.avatarUrl
// Read-only: User.email · User.role · User.status

export default function EditProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('Nguyen Van A');
  const [phone, setPhone] = useState('+84 912 345 678');
  const [avatarPreview, setAvatarPreview] = useState('https://i.pravatar.cc/80?img=7');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (name.length > 120) e.name = 'Name cannot exceed 120 characters.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (phone.length > 20) e.phone = 'Phone cannot exceed 20 characters.';
    return e;
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => navigate('/tenant/profile'), 1500);
    }, 1000);
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tenant/profile" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>
            ← Back
          </Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Edit Profile</h1>
        </div>

        {saved && (
          <div className="alert alert-success mb-5 animate-fade-in">
            ✅ Profile updated successfully. Redirecting…
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar section */}
          <div className="card mb-5" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Profile Photo</h3>
            <div className="flex items-center gap-5">
              <img
                src={avatarPreview}
                alt="Avatar"
                className="rounded-full flex-shrink-0"
                style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid var(--hairline)' }}
              />
              <div>
                <p className="body-sm mb-2" style={{ color: 'var(--charcoal)' }}>
                  JPG, PNG, or WebP · Max 5MB
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-outline"
                  style={{ height: 36, padding: '0 16px', fontSize: 13 }}
                >
                  📸 Upload New Photo
                </button>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Personal Information</h3>
            <div className="flex flex-col gap-4">

              {/* User.name */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                  Full Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className="input-field-rect"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Your full name"
                />
                {errors.name && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.name}</p>}
              </div>

              {/* User.phone */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                  Phone Number <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  className="input-field-rect"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={20}
                  placeholder="+84 912 345 678"
                />
                {errors.phone && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.phone}</p>}
              </div>

              {/* User.email — read only */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Email Address</label>
                <input
                  type="email"
                  className="input-field-rect"
                  value="vana@example.com"
                  disabled
                  style={{ background: 'var(--surface-bone)', color: 'var(--ash)', cursor: 'not-allowed' }}
                />
                <p className="caption mt-1" style={{ color: 'var(--ash)' }}>Email address cannot be changed.</p>
              </div>

              {/* User.role — read only */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Role</label>
                <div className="flex items-center gap-2 py-2">
                  <span className="badge badge-info">TENANT</span>
                  <span className="body-sm" style={{ color: 'var(--ash)' }}>Role cannot be changed here.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button
                id="save-profile"
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
                    Saving…
                  </span>
                ) : '💾 Save Changes'}
              </button>
              <Link to="/tenant/profile" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}
