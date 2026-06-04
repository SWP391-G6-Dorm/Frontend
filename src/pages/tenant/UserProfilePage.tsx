import { Link } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-11 — User Profile
// Entity: User (read own record)
// Fields: User.name · User.email · User.phone · User.avatarUrl · User.role · User.status · User.createdAt · User.updatedAt

const MOCK_USER = {
  id: 'u-001',
  name: 'Nguyen Van A',
  email: 'vana@example.com',
  phone: '+84 912 345 678',
  avatarUrl: 'https://i.pravatar.cc/80?img=7',
  role: 'TENANT',
  status: 'ACTIVE',
  googleId: null,
  createdAt: '2024-08-15T09:00:00Z',
  updatedAt: '2025-03-10T14:22:00Z',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = { TENANT: 'badge-info', LANDLORD: 'badge-primary', ADMIN: 'badge-error' };
  return <span className={`badge ${map[role] ?? 'badge-neutral'}`}>{role}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { ACTIVE: 'badge-success', PENDING: 'badge-warning', SUSPENDED: 'badge-error', DELETED: 'badge-neutral' };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}

export default function UserProfilePage() {
  return (
    <TenantLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>My Profile</h1>
        </div>

        {/* ── PROFILE HEADER CARD ── */}
        <div className="card" style={{ padding: 32 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <img
                src={MOCK_USER.avatarUrl}
                alt={MOCK_USER.name}
                className="rounded-full"
                style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid var(--hairline)' }}
              />
              <span
                className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
                style={{ width: 22, height: 22, background: 'var(--success)', fontSize: 11, color: '#fff', border: '2px solid #fff' }}
              >✓</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="heading-md" style={{ color: 'var(--ink)' }}>{MOCK_USER.name}</h2>
                <RoleBadge role={MOCK_USER.role} />
                <StatusBadge status={MOCK_USER.status} />
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
                Member since {formatDate(MOCK_USER.createdAt)}
              </p>
              <p className="body-sm" style={{ color: 'var(--ash)' }}>{MOCK_USER.email}</p>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Link to="/tenant/profile/edit" className="btn-primary" style={{ height: 38, padding: '0 20px', fontSize: 14 }}>
                ✏️ Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal Info card */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Personal Information</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Full Name',    value: MOCK_USER.name },
                { label: 'Email',        value: MOCK_USER.email, extra: MOCK_USER.status === 'ACTIVE' ? '✅ Verified' : '❌ Unverified' },
                { label: 'Phone Number', value: MOCK_USER.phone },
                { label: 'Avatar URL',   value: MOCK_USER.avatarUrl, isLink: true },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                  <div className="flex items-center gap-2">
                    {row.isLink ? (
                      <a href={row.value} target="_blank" rel="noopener noreferrer"
                        className="body-sm font-medium" style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>
                        {row.value}
                      </a>
                    ) : (
                      <p className="body-md font-medium" style={{ color: 'var(--ink)' }}>{row.value}</p>
                    )}
                    {row.extra && <span className="body-sm" style={{ color: 'var(--success)' }}>{row.extra}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Info card */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Account Information</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Role',         value: null,             badge: <RoleBadge role={MOCK_USER.role} /> },
                { label: 'Status',       value: null,             badge: <StatusBadge status={MOCK_USER.status} /> },
                { label: 'Member Since', value: formatDate(MOCK_USER.createdAt) },
                { label: 'Last Updated', value: formatDate(MOCK_USER.updatedAt) },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                  {row.badge ? row.badge : (
                    <p className="body-md font-medium" style={{ color: 'var(--ink)' }}>{row.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="heading-sm mb-1" style={{ color: 'var(--ink)' }}>Security</h3>
          <p className="body-sm mb-4" style={{ color: 'var(--charcoal)' }}>
            Changing your password will sign out all other active sessions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/tenant/change-password" className="btn-outline" style={{ height: 38, padding: '0 20px', fontSize: 14 }}>
              🔑 Change Password
            </Link>
            {MOCK_USER.googleId && (
              <div className="flex items-center gap-2 body-sm" style={{ color: 'var(--charcoal)' }}>
                <span>🔗</span> Google account linked
              </div>
            )}
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
