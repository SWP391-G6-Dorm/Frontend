// SCR-72 — User Management
// SCR-73 — User Detail (Admin)
// SCR-74 — Edit User (Admin)
// Entity: User · AuditLog

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  KpiCard, StatusBadge, RoleBadge, PageHeader, FilterBar,
  formatDate, formatDateTime, relTime,
  MOCK_ADMIN_USERS, MOCK_AUDIT_LOGS, actionBadgeStyle, actionBorderColor,
} from './shared';

// ─── SCR-72: User Management ─────────────────────────────────────────────────

export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = MOCK_ADMIN_USERS.filter(u => {
    const matchSearch = search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const allSelected = filtered.length > 0 && filtered.every(u => selectedIds.includes(u.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map(u => u.id));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        <PageHeader
          title="User Management"
          sub={`${MOCK_ADMIN_USERS.length} total users · ${MOCK_ADMIN_USERS.filter(u => u.status === 'ACTIVE').length} active`}
          action={
            <button
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ borderRadius: 9999, fontSize: 14 }}
            >
              + Add User
            </button>
          }
        />

        {/* Toolbar */}
        <FilterBar search={search} onSearch={setSearch}>
          <select
            className="input-field-rect"
            style={{ height: 38, minWidth: 130 }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="TENANT">Tenant</option>
            <option value="LANDLORD">Landlord</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            className="input-field-rect"
            style={{ height: 38, minWidth: 140 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DELETED">Deleted</option>
          </select>
          {/* Export */}
          <button
            className="btn-outline"
            style={{ height: 38, borderRadius: 9999, fontSize: 13, padding: '0 16px' }}
          >
            ⬇ Export
          </button>
        </FilterBar>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <span className="body-sm font-semibold" style={{ color: '#1D4ED8' }}>
              {selectedIds.length} selected
            </span>
            <button className="body-sm font-semibold" style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>
              Suspend Selected
            </button>
            <button className="body-sm font-semibold" style={{ color: '#0891B2', background: 'none', border: 'none', cursor: 'pointer' }}>
              Export Selected
            </button>
            <button onClick={() => setSelectedIds([])}
              className="body-sm" style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
              Clear
            </button>
          </div>
        )}

        {/* Data table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 16, height: 16 }} />
            <div style={{ flex: 3, color: 'var(--charcoal)' }} className="label-sm">User</div>
            <div style={{ flex: 2, color: 'var(--charcoal)' }} className="label-sm hidden md:block">Email</div>
            <div style={{ flex: 1.5, color: 'var(--charcoal)' }} className="label-sm hidden lg:block">Phone</div>
            <div style={{ flex: 1, color: 'var(--charcoal)' }} className="label-sm">Role</div>
            <div style={{ flex: 1, color: 'var(--charcoal)' }} className="label-sm">Status</div>
            <div style={{ flex: 1, color: 'var(--charcoal)' }} className="label-sm hidden lg:block">Joined</div>
            <div style={{ flex: 1, color: 'var(--charcoal)' }} className="label-sm">Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--ash)' }}>
              <span style={{ fontSize: 48 }}>👤</span>
              <p className="body-lg font-semibold mt-3" style={{ color: 'var(--charcoal)' }}>No users found.</p>
              <p className="body-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filtered.map((user, i) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b transition-colors"
                style={{ borderColor: i < filtered.length - 1 ? 'var(--hairline)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  style={{ width: 16, height: 16, flexShrink: 0 }}
                  onClick={e => e.stopPropagation()}
                />
                {/* User col */}
                <div style={{ flex: 3 }} className="flex items-center gap-3 min-w-0">
                  <img src={user.avatarUrl} alt={user.name}
                    className="rounded-full flex-shrink-0" style={{ width: 36, height: 36 }} />
                  <div className="min-w-0">
                    <p className="body-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{user.name}</p>
                    <p className="caption truncate md:hidden" style={{ color: 'var(--ash)' }}>{user.email}</p>
                  </div>
                </div>
                {/* Email */}
                <div style={{ flex: 2 }} className="hidden md:block min-w-0">
                  <p className="body-sm truncate" style={{ color: 'var(--charcoal)' }}>{user.email}</p>
                </div>
                {/* Phone */}
                <div style={{ flex: 1.5 }} className="hidden lg:block">
                  <p className="body-sm" style={{ color: 'var(--charcoal)', fontFamily: 'monospace', fontSize: 12 }}>{user.phone}</p>
                </div>
                {/* Role */}
                <div style={{ flex: 1 }}>
                  <RoleBadge role={user.role} />
                </div>
                {/* Status */}
                <div style={{ flex: 1 }}>
                  <StatusBadge status={user.status} />
                </div>
                {/* Joined */}
                <div style={{ flex: 1 }} className="hidden lg:block">
                  <p className="caption" style={{ color: 'var(--ash)' }}>{formatDate(user.createdAt)}</p>
                </div>
                {/* Actions */}
                <div style={{ flex: 1 }}>
                  <ActionMenu userId={user.id} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setShowAddModal(false)}>
            <div className="card" style={{ padding: 32, width: 480, maxWidth: '90vw' }}
              onClick={e => e.stopPropagation()}>
              <h2 className="heading-sm mb-5" style={{ color: 'var(--ink)' }}>Add New User</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label-sm mb-1 block" style={{ color: 'var(--charcoal)' }}>Full Name</label>
                  <input className="input-field-rect w-full" placeholder="User.name" />
                </div>
                <div>
                  <label className="label-sm mb-1 block" style={{ color: 'var(--charcoal)' }}>Email</label>
                  <input className="input-field-rect w-full" type="email" placeholder="User.email" />
                </div>
                <div>
                  <label className="label-sm mb-1 block" style={{ color: 'var(--charcoal)' }}>Role</label>
                  <select className="input-field-rect w-full">
                    <option value="TENANT">Tenant</option>
                    <option value="LANDLORD">Landlord</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm mb-1 block" style={{ color: 'var(--charcoal)' }}>Status</label>
                  <select className="input-field-rect w-full">
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-primary flex-1" style={{ borderRadius: 9999 }}>Create User</button>
                <button className="btn-outline flex-1" style={{ borderRadius: 9999 }} onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function ActionMenu({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px', color: 'var(--charcoal)', borderRadius: 6 }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >⋮</button>
      {open && (
        <div className="absolute right-0 z-20 rounded-lg py-1"
          style={{ width: 180, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', border: '1px solid var(--hairline)', top: '100%' }}
          onMouseLeave={() => setOpen(false)}>
          {[
            { label: '👁 View Details', to: `/admin/users/${userId}` },
            { label: '✏️ Edit User',    to: `/admin/users/${userId}/edit` },
            { label: '🚫 Suspend',      to: null, danger: false },
            { label: '🔑 Reset Password', to: null, danger: false },
            { label: '🗑 Delete',       to: null, danger: true },
          ].map(item => (
            item.to
              ? <Link key={item.label} to={item.to}
                  className="flex items-center px-4 py-2 body-sm"
                  style={{ color: 'var(--ink)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >{item.label}</Link>
              : <button key={item.label}
                  className="flex items-center w-full px-4 py-2 body-sm text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.danger ? 'var(--error)' : 'var(--ink)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >{item.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SCR-73: User Detail (Admin) ─────────────────────────────────────────────

export function UserDetailAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = MOCK_ADMIN_USERS.find(u => u.id === id) ?? MOCK_ADMIN_USERS[0];
  const userLogs = MOCK_AUDIT_LOGS.filter(l => l.actorId === user.id);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changeRole, setChangeRole] = useState(user.role);
  const [roleConfirmNeeded, setRoleConfirmNeeded] = useState(false);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/admin/users" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Users</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>{user.name}</span>
        </div>

        {/* Profile Header */}
        <div className="card" style={{ padding: 32 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <img src={user.avatarUrl} alt={user.name}
                className="rounded-full" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid var(--hairline)' }} />
              <div>
                <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{user.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                </div>
                <p className="caption mt-2" style={{ color: 'var(--ash)' }}>Member since {formatDate(user.createdAt)}</p>
              </div>
            </div>
            <Link to={`/admin/users/${user.id}/edit`}>
              <button className="btn-outline" style={{ borderRadius: 9999, fontSize: 14 }}>✏️ Edit User</button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column — info cards */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Personal Info */}
            <div className="card" style={{ padding: 24 }}>
              <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name',  value: user.name },
                  { label: 'Email',      value: user.email },
                  { label: 'Phone',      value: user.phone },
                  { label: 'Avatar URL', value: user.avatarUrl ? 'Uploaded' : 'Not set' },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption mb-1" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className="body-sm font-medium" style={{ color: 'var(--ink)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="card" style={{ padding: 24 }}>
              <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Account Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Role</p>
                  <RoleBadge role={user.role} />
                </div>
                <div>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Status</p>
                  <StatusBadge status={user.status} />
                </div>
                <div>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Member Since</p>
                  <p className="body-sm font-medium" style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Last Updated</p>
                  <p className="body-sm font-medium" style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{formatDate(user.updatedAt)}</p>
                </div>
                <div>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Google ID</p>
                  <p className="body-sm" style={{ color: user.googleId ? 'var(--success)' : 'var(--ash)', fontFamily: 'monospace', fontSize: 12 }}>
                    {user.googleId ?? 'Not linked'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity — AuditLog */}
            <div className="card" style={{ padding: 24 }}>
              <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Recent Activity</h2>
              <p className="caption mb-3" style={{ color: 'var(--ash)' }}>AuditLog filtered by actor = this user (last 20 entries)</p>
              {userLogs.length === 0 ? (
                <div className="flex flex-col items-center py-8" style={{ color: 'var(--ash)' }}>
                  <span style={{ fontSize: 32 }}>📋</span>
                  <p className="body-sm mt-2">No activity logs for this period</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid border-b mb-1"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', borderColor: 'var(--hairline)', background: 'var(--surface-bone)' }}>
                    {['Action', 'Entity', 'Entity ID', 'IP Address', 'Timestamp'].map(col => (
                      <div key={col} className="px-3 py-2 label-sm" style={{ color: 'var(--charcoal)', fontSize: 11 }}>{col}</div>
                    ))}
                  </div>
                  {userLogs.slice(0, 20).map((log, i) => (
                    <div key={log.id}
                      className="grid py-2.5 border-b"
                      style={{
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
                        borderColor: i < userLogs.length - 1 ? 'var(--hairline)' : 'transparent',
                        borderLeft: `3px solid ${actionBorderColor(log.action)}`,
                        paddingLeft: 8,
                      }}>
                      <div><span style={actionBadgeStyle(log.action)}>{log.action}</span></div>
                      <p className="caption px-3" style={{ color: 'var(--charcoal)' }}>{log.entityName}</p>
                      <p className="caption px-3" style={{ color: 'var(--ash)', fontFamily: 'monospace', fontSize: 11 }}>
                        {log.entityId.slice(0, 8)}…
                      </p>
                      <p className="caption px-3" style={{ color: 'var(--ash)', fontFamily: 'monospace', fontSize: 11 }}>{log.ipAddress}</p>
                      <p className="caption px-3" style={{ color: 'var(--ash)' }}>{relTime(log.createdAt)}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right column — Admin Actions */}
          <div className="flex flex-col gap-5">
            <div className="card" style={{ padding: 24 }}>
              <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Admin Actions</h2>
              <div className="flex flex-col gap-3">
                <button
                  className="w-full py-2.5 rounded-lg body-sm font-semibold"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', cursor: 'pointer', borderRadius: 9999 }}
                  onClick={() => setShowConfirm(true)}
                >
                  🚫 Suspend Account
                </button>
                <button
                  className="btn-outline w-full"
                  style={{ borderRadius: 9999, fontSize: 14 }}
                >
                  🔑 Send Reset Password Email
                </button>
                <div>
                  <p className="caption mb-2" style={{ color: 'var(--charcoal)' }}>Change Role</p>
                  <div className="flex gap-2">
                    <select
                      className="input-field-rect flex-1"
                      value={changeRole}
                      onChange={e => {
                        setChangeRole(e.target.value);
                        if (e.target.value === 'ADMIN') setRoleConfirmNeeded(true);
                      }}
                    >
                      <option value="TENANT">Tenant</option>
                      <option value="LANDLORD">Landlord</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button className="btn-outline" style={{ borderRadius: 9999, fontSize: 13, padding: '0 12px' }}>
                      Save
                    </button>
                  </div>
                  {roleConfirmNeeded && (
                    <p className="caption mt-2" style={{ color: '#D97706', background: '#FFFBEB', padding: '6px 10px', borderRadius: 6 }}>
                      ⚠ You are granting Admin privileges. This cannot be easily undone.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="card" style={{ padding: 24 }}>
              <h2 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>User Stats</h2>
              {[
                { label: 'Audit Entries', value: MOCK_AUDIT_LOGS.filter(l => l.actorId === user.id).length },
                { label: 'Login Events', value: MOCK_AUDIT_LOGS.filter(l => l.actorId === user.id && l.action === 'LOGIN').length },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--hairline)' }}>
                  <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{s.label}</span>
                  <span className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="card" style={{ padding: 32, width: 420, maxWidth: '90vw' }}>
            <div className="flex justify-center mb-4">
              <span style={{ fontSize: 48 }}>⚠️</span>
            </div>
            <h2 className="heading-sm text-center mb-2" style={{ color: 'var(--ink)' }}>Suspend Account</h2>
            <p className="body-sm text-center mb-6" style={{ color: 'var(--charcoal)' }}>
              You are about to suspend <strong>{user.name}</strong>'s account.
              They will no longer be able to log in. This action can be reversed.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 rounded-full body-sm font-semibold"
                style={{ background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowConfirm(false)}
              >
                Suspend Account
              </button>
              <button
                className="btn-outline flex-1"
                style={{ borderRadius: 9999 }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ─── SCR-74: Edit User (Admin) ────────────────────────────────────────────────

export function EditUserAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = MOCK_ADMIN_USERS.find(u => u.id === id) ?? MOCK_ADMIN_USERS[0];

  const [name, setName]     = useState(user.name);
  const [role, setRole]     = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [adminConfirm, setAdminConfirm] = useState(false);

  const handleRoleChange = (val: string) => {
    setRole(val);
    if (val === 'ADMIN') setAdminConfirm(true);
    else setAdminConfirm(false);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up" style={{ maxWidth: 560 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/admin/users" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Users</Link>
          <span>/</span>
          <Link to={`/admin/users/${user.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{user.name}</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>Edit</span>
        </div>

        <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Edit User</h1>

        {/* Form Card */}
        <div className="card" style={{ padding: 32 }}>
          <div className="flex flex-col gap-5">
            {/* Full Name */}
            <div>
              <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                className="input-field-rect w-full"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="User.name"
              />
            </div>

            {/* Role select */}
            <div>
              <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Role</label>
              <select
                className="input-field-rect w-full"
                value={role}
                onChange={e => handleRoleChange(e.target.value)}
              >
                <option value="TENANT">Tenant</option>
                <option value="LANDLORD">Landlord</option>
                <option value="ADMIN">Admin</option>
              </select>
              {adminConfirm && (
                <div className="mt-2 px-3 py-2.5 rounded-lg flex items-start gap-2"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <span>⚠️</span>
                  <p className="caption" style={{ color: '#DC2626' }}>
                    You are granting Admin privileges. This cannot be easily undone.
                  </p>
                </div>
              )}
            </div>

            {/* Status select */}
            <div>
              <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Status</label>
              <select
                className="input-field-rect w-full"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Deleted</option>
              </select>
            </div>

            {/* Read-only display */}
            <div className="rounded-lg px-4 py-4" style={{ background: 'var(--surface-bone)', border: '1px solid var(--hairline)' }}>
              <p className="label-sm mb-3" style={{ color: 'var(--charcoal)' }}>Read-only fields (not editable here)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="caption" style={{ color: 'var(--ash)' }}>Email</p>
                  <p className="body-sm" style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: 12 }}>{user.email}</p>
                </div>
                <div>
                  <p className="caption" style={{ color: 'var(--ash)' }}>Phone</p>
                  <p className="body-sm" style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: 12 }}>{user.phone}</p>
                  <p className="caption mt-0.5" style={{ color: 'var(--ash)', fontSize: 10 }}>Ask user to change from profile</p>
                </div>
              </div>
            </div>

            {/* Hidden field note */}
            <p className="caption" style={{ color: 'var(--ash)', fontStyle: 'italic' }}>
              Hidden (never editable by admin): passwordHash · googleId · createdAt · updatedAt
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex gap-3">
          <button className="btn-primary flex-1" style={{ borderRadius: 9999, fontSize: 15 }}>
            Save Changes
          </button>
          <button
            className="btn-outline flex-1"
            style={{ borderRadius: 9999, fontSize: 15 }}
            onClick={() => navigate(`/admin/users/${user.id}`)}
          >
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
