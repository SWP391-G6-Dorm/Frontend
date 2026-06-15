import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const USER = { fullName: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901 234 567', address: '123 Đường Lê Lợi, Q1, TP.HCM', createdAt: '2025-01-15', avatarUrl: '' };
const initials = USER.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

export default function UserProfilePage() {
  return (
    <CustomerLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>My Profile</h1>

        <div className="card-lg" style={{ padding: 32, marginBottom: 20 }}>
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
