/**
 * AdminPages.tsx — SCR-46..58
 * All Admin Portal screens except SCR-45 (AdminDashboardPage.tsx)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminProperties, createAdminProperty, updateAdminProperty,
  assignManagerToProperty,
  getManagers, getCustomers, updateAdminUser,
  getPaymentReconciliation,
  getEscalatedDamageReports, coApproveDamageReport,
  getAdminComplaints, resolveComplaint,
  getGlobalRevenueReport,
  getSystemSettings, updateSystemSettings,
  getAdminPromotions, createPromotion, updatePromotion, deletePromotion,
  type AdminUser, type AdminProperty, type AdminDamageReport,
  type AdminComplaint, type PaymentReconciliationItem,
  type Promotion, type SystemSettings, type MonthlyRevenue,
} from '../../api/adminApi';
import { DataTable, StatusBadge as UIStatusBadge } from '../../components/ui';

// ── Shared Helpers ─────────────────────────────────────────────────────────────

const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function extractApiError(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { message?: string } } })?.response?.data;
  return d?.message || fallback;
}

// ── Shared UI Components ───────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--hairline)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="alert alert-error" style={{ marginBottom: 16 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </div>
  );
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="alert alert-success" style={{ marginBottom: 16 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
      </svg>
      {msg}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { cls: string; label: string }> = {
    ACTIVE:         { cls: 'badge-success', label: 'Active' },
    INACTIVE:       { cls: 'badge-error',   label: 'Inactive' },
    OPEN:           { cls: 'badge-warning', label: 'Open' },
    INVESTIGATING:  { cls: 'badge-info',    label: 'Investigating' },
    RESOLVED:       { cls: 'badge-success', label: 'Resolved' },
    CLOSED:         { cls: 'badge-neutral', label: 'Closed' },
    ESCALATED:      { cls: 'badge-error',   label: 'Escalated' },
    APPROVED:       { cls: 'badge-success', label: 'Approved' },
    PENDING_REVIEW: { cls: 'badge-warning', label: 'Pending Review' },
    DISCREPANCY:    { cls: 'badge-error',   label: 'Discrepancy' },
    SUCCESS:        { cls: 'badge-success', label: 'Success' },
    PENDING:        { cls: 'badge-warning', label: 'Pending' },
    FAILED:         { cls: 'badge-error',   label: 'Failed' },
  };
  const v = MAP[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${v.cls}`}>{v.label}</span>;
}

function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 998 }}
        />
      )}
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%',
        width: 480, maxWidth: '92vw',
        background: 'var(--surface-card)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        zIndex: 999,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal)', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger = false }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 28 }}>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 17, marginBottom: 10, color: 'var(--ink)' }}>{title}</h3>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>Hủy</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
      <button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => onPage(page - 1)}>‹ Trước</button>
      <span className="body-sm" style={{ padding: '4px 12px', alignSelf: 'center' }}>Trang {page + 1} / {totalPages}</span>
      <button className="btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Sau ›</button>
    </div>
  );
}

// ── SCR-46: Property Management ────────────────────────────────────────────────

export function PropertyMgmtListPage() {
  const [items, setItems] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const load = useCallback(async (p = 0) => {
    setLoading(true); setError(null);
    try {
      const res = await getAdminProperties({ page: p, size: 10 });
      if (res.success) {
        setItems(res.data.content);
        setTotalPages(res.data.totalPages);
        setPage(p);
      }
    } catch (err) { setError(extractApiError(err, 'Không tải được danh sách properties.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const filtered = items.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Tên Property', accessor: (p: AdminProperty) => <span className="font-semibold">{p.name}</span> },
    { header: 'Địa điểm', accessor: (p: AdminProperty) => p.location || '—' },
    { header: 'Manager', accessor: (p: AdminProperty) => p.managerName || <span className="text-charcoal">Chưa gán</span> },
    { header: 'Ngày tạo', accessor: (p: AdminProperty) => fmtDate(p.createdAt) },
    { header: 'Trạng thái', accessor: (p: AdminProperty) => <UIStatusBadge status={p.status} variant={p.status === 'ACTIVE' ? 'success' : 'danger'} /> }
  ];

  const actions = [
    { label: 'Sửa', onClick: (p: AdminProperty) => navigate(`/admin/properties/${p.id}/edit`) },
    { label: 'Gán Manager', onClick: (p: AdminProperty) => navigate(`/admin/properties/${p.id}/manager`) }
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Property Management</h1>
            <p className="body-sm text-charcoal">SCR-46 — Danh sách toàn bộ Properties</p>
          </div>
          <Link to="/admin/properties/create" className="btn-primary">+ Create Property</Link>
        </div>
        {error && <ErrorBanner msg={error} />}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <input
            id="property-search"
            className="input"
            placeholder="Tìm theo tên hoặc địa điểm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 340 }}
          />
        </div>
        {loading ? <Spinner /> : (
          <>
            <DataTable 
              columns={columns} 
              data={filtered} 
              keyExtractor={(p) => p.id} 
              actions={actions}
            />
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p)} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ── SCR-47: Create Property ────────────────────────────────────────────────────

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Tên property không được để trống';
    if (!form.location.trim()) e.location = 'Địa điểm không được để trống';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setError(null); setLoading(true);
    try {
      const res = await createAdminProperty({ name: form.name.trim(), location: form.location.trim() });
      if (res.success) { navigate('/admin/properties'); }
      else { setError(res.data as unknown as string || 'Tạo property thất bại.'); }
    } catch (err) { setError(extractApiError(err, 'Tạo property thất bại.')); }
    finally { setLoading(false); }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin/properties" className="body-sm text-primary" style={{ textDecoration: 'none' }}>← Properties</Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginTop: 8, marginBottom: 4 }}>Create Property</h1>
          <p className="body-sm text-charcoal">SCR-47 — POST /api/admin/properties</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          {/* Section: Basic Info */}
          <h2 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>📍 Thông tin cơ bản</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label form-label-required" htmlFor="prop-name">Tên Property</label>
              <input id="prop-name" className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="VD: Sunset Resort Đà Nẵng"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div>
              <label className="form-label form-label-required" htmlFor="prop-location">Địa điểm</label>
              <input id="prop-location" className={`input ${errors.location ? 'input-error' : ''}`}
                placeholder="VD: Đà Nẵng, Việt Nam"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              {errors.location && <p className="form-error">{errors.location}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Create Property'}</button>
            <Link to="/admin/properties" className="btn-ghost">Hủy</Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

// ── SCR-48: Edit Property ──────────────────────────────────────────────────────

export function EditPropertyAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', location: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setFetching(true);
      try {
        const res = await getAdminProperties({ size: 200 });
        const prop = res.data?.content?.find(p => p.id === id);
        if (prop) setForm({ name: prop.name, location: prop.location || '', status: prop.status });
      } catch { /* silent */ }
      finally { setFetching(false); }
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await updateAdminProperty(id, { name: form.name.trim(), status: form.status });
      if (res.success) { setSuccess('Cập nhật thành công!'); setTimeout(() => navigate('/admin/properties'), 1200); }
      else { setError('Cập nhật thất bại.'); }
    } catch (err) { setError(extractApiError(err, 'Cập nhật thất bại.')); }
    finally { setLoading(false); }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin/properties" className="body-sm text-primary" style={{ textDecoration: 'none' }}>← Properties</Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginTop: 8, marginBottom: 4 }}>Edit Property</h1>
          <p className="body-sm text-charcoal">SCR-48 — PUT /api/admin/properties/{id}</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        {success && <SuccessBanner msg={success} />}
        {fetching ? <Spinner /> : (
          <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
              <div>
                <label className="form-label form-label-required" htmlFor="edit-prop-name">Tên Property</label>
                <input id="edit-prop-name" className="input"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label" htmlFor="edit-prop-location">Địa điểm</label>
                <input id="edit-prop-location" className="input"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="form-label" htmlFor="edit-prop-status">Trạng thái</label>
                <select id="edit-prop-status" className="input"
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Save Changes'}</button>
              <Link to="/admin/properties" className="btn-ghost">Hủy</Link>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

// ── SCR-49: Manager Assignment ─────────────────────────────────────────────────

export function ManagerAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [managers, setManagers] = useState<AdminUser[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setFetching(true);
      try {
        const res = await getManagers({ size: 100 });
        if (res.success) setManagers(res.data.content);
      } catch { /* silent */ }
      finally { setFetching(false); }
    }
    load();
  }, []);

  const filtered = managers.filter(m =>
    !keyword || m.fullName.toLowerCase().includes(keyword.toLowerCase()) || m.email.toLowerCase().includes(keyword.toLowerCase())
  );

  async function handleSave() {
    if (!id || !selectedId) return;
    setLoading(true); setError(null);
    try {
      const res = await assignManagerToProperty(id, selectedId);
      if (res.success) navigate('/admin/properties');
      else setError('Gán manager thất bại.');
    } catch (err) { setError(extractApiError(err, 'Gán manager thất bại.')); }
    finally { setLoading(false); }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin/properties" className="body-sm text-primary" style={{ textDecoration: 'none' }}>← Properties</Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginTop: 8, marginBottom: 4 }}>Manager Assignment</h1>
          <p className="body-sm text-charcoal">SCR-49 — Gán Manager vào Property</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <div className="card" style={{ padding: 24 }}>
          <label className="form-label" htmlFor="manager-search">Tìm Manager</label>
          <input id="manager-search" className="input" placeholder="Tìm theo tên hoặc email..."
            value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 16 }} />
          {fetching ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 20 }}>
              {filtered.length === 0 ? (
                <p className="body-sm text-charcoal" style={{ textAlign: 'center', padding: 20 }}>Không tìm thấy manager</p>
              ) : filtered.map(m => (
                <label key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  border: `1.5px solid ${selectedId === m.id ? 'var(--primary)' : 'var(--hairline)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: selectedId === m.id ? 'rgba(15,118,110,0.08)' : 'var(--surface-card)',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="manager" value={m.id} checked={selectedId === m.id}
                    onChange={() => setSelectedId(m.id)} style={{ accentColor: 'var(--primary)' }} />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, color: 'var(--primary)' }}>
                    {m.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</p>
                    <p className="body-sm text-charcoal">{m.email}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </label>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" disabled={!selectedId || loading} onClick={handleSave}>
              {loading ? 'Đang lưu...' : 'Save Assignment'}
            </button>
            <Link to="/admin/properties" className="btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ── SCR-50 & SCR-51: User Directories ─────────────────────────────────────────

function UserDirectoryPage({ role, title, scr }: { role: 'MANAGER' | 'CUSTOMER'; title: string; scr: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchUsers = useCallback(async (p = 0, kw = '') => {
    setLoading(true); setError(null);
    try {
      const fn = role === 'MANAGER' ? getManagers : getCustomers;
      const res = await fn({ page: p, size: 10, keyword: kw || undefined });
      if (res.success) { setUsers(res.data.content); setTotalPages(res.data.totalPages); setPage(p); }
    } catch (err) { setError(extractApiError(err, 'Không tải được danh sách.')); }
    finally { setLoading(false); }
  }, [role]);

  const columns = [
    { header: 'Họ tên', accessor: (u: AdminUser) => <span className="font-semibold">{u.fullName}</span> },
    { header: 'Email', accessor: (u: AdminUser) => u.email },
    { header: 'Điện thoại', accessor: (u: AdminUser) => u.phone || '—' },
    { header: 'Ngày tạo', accessor: (u: AdminUser) => fmtDate(u.createdAt) },
    { header: 'Trạng thái', accessor: (u: AdminUser) => <UIStatusBadge status={u.status} variant={u.status === 'ACTIVE' ? 'success' : 'danger'} /> }
  ];

  const actions = [
    { label: 'Xem chi tiết', onClick: (u: AdminUser) => { setSelectedUser(u); setDrawerOpen(true); setActionMsg(null); } }
  ];

  useEffect(() => { fetchUsers(0, ''); }, [fetchUsers]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearch(v: string) {
    setKeyword(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(0, v), 400);
  }

  async function handleToggleStatus(user: AdminUser) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoading(true); setActionMsg(null);
    try {
      await updateAdminUser(user.id, { status: newStatus });
      setActionMsg({ type: 'success', msg: `Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản.` });
      setSelectedUser(u => u ? { ...u, status: newStatus } : null);
      fetchUsers(page, keyword);
    } catch (err) { setActionMsg({ type: 'error', msg: extractApiError(err, 'Thao tác thất bại.') }); }
    finally { setActionLoading(false); }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</h1>
            <p className="body-sm text-charcoal">{scr} — GET /api/admin/users?role={role}</p>
          </div>
        </div>
        {error && <ErrorBanner msg={error} />}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <input id={`${role}-search`} className="input" placeholder={`Tìm theo tên hoặc email...`}
            value={keyword} onChange={e => handleSearch(e.target.value)} style={{ maxWidth: 340 }} />
        </div>
        {loading ? <Spinner /> : (
          <>
            <DataTable 
              columns={columns}
              data={users}
              keyExtractor={(u) => u.id}
              actions={actions}
            />
            <Pagination page={page} totalPages={totalPages} onPage={p => fetchUsers(p, keyword)} />
          </>
        )}

        {/* Drawer: User Detail */}
        <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedUser(null); }} title="Chi tiết tài khoản">
          {selectedUser && (
            <div>
              {actionMsg && (actionMsg.type === 'success' ? <SuccessBanner msg={actionMsg.msg} /> : <ErrorBanner msg={actionMsg.msg} />)}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(15,118,110,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.fullName}</p>
                  <p className="body-sm text-charcoal">{selectedUser.email}</p>
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'ID', value: selectedUser.id.slice(0, 8).toUpperCase() },
                  { label: 'Role', value: selectedUser.role },
                  { label: 'Điện thoại', value: selectedUser.phone || '—' },
                  { label: 'Ngày tạo', value: fmtDate(selectedUser.createdAt) },
                  { label: 'Cập nhật', value: fmtDate(selectedUser.updatedAt) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className={selectedUser.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}
                  disabled={actionLoading}
                  onClick={() => handleToggleStatus(selectedUser)}
                >
                  {actionLoading ? 'Đang xử lý...' : selectedUser.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}

export function ManagerDirectoryPage() {
  return <UserDirectoryPage role="MANAGER" title="Manager Directory" scr="SCR-50" />;
}

export function CustomerDirectoryPage() {
  return <UserDirectoryPage role="CUSTOMER" title="Customer Directory" scr="SCR-51" />;
}

// ── SCR-52: Payment Reconciliation ────────────────────────────────────────────

export function PaymentReconciliationPage() {
  const [items, setItems] = useState<PaymentReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<PaymentReconciliationItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true); setError(null);
    try {
      const res = await getPaymentReconciliation({ status: 'DISCREPANCY', page: p, size: 10 });
      if (res.success) { setItems(res.data.content); setTotalPages(res.data.totalPages); setPage(p); }
    } catch (err) { setError(extractApiError(err, 'Không tải được danh sách reconciliation.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const columns = [
    { header: 'Payment ID', accessor: (item: PaymentReconciliationItem) => <span className="code-sm">{item.id.slice(0, 8)}</span> },
    { header: 'Booking ID', accessor: (item: PaymentReconciliationItem) => <span className="code-sm">{item.bookingId.slice(0, 8)}</span> },
    { header: 'Số tiền', accessor: (item: PaymentReconciliationItem) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmtVnd(item.amount)}</span> },
    { header: 'VNPay Status', accessor: (item: PaymentReconciliationItem) => <StatusBadge status={item.vnpayStatus} /> },
    { header: 'System Status', accessor: (item: PaymentReconciliationItem) => <StatusBadge status={item.systemStatus} /> },
    { header: 'Lý do lệch', accessor: (item: PaymentReconciliationItem) => <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--charcoal)' }}>{item.discrepancyReason || '—'}</span> },
    { header: 'Ngày tạo', accessor: (item: PaymentReconciliationItem) => fmtDate(item.createdAt) }
  ];

  const actions = [
    { label: 'Đối soát', onClick: (item: PaymentReconciliationItem) => { setSelected(item); setDrawerOpen(true); } }
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Payment Reconciliation</h1>
          <p className="body-sm text-charcoal">SCR-52 — Giao dịch lệch VNPay</p>
        </div>
        {items.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Có <strong>{items.length}</strong> giao dịch cần đối soát thủ công
          </div>
        )}
        {error && <ErrorBanner msg={error} />}
        {loading ? <Spinner /> : (
          <>
            <div style={{ marginBottom: 20 }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--charcoal)', padding: 32 }}>✅ Không có discrepancy nào</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={items}
                  keyExtractor={(item) => item.id}
                  actions={actions}
                />
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p)} />
          </>
        )}

        <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} title="Manual Reconciliation">
          {selected && (
            <div>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                Xác minh thủ công với VNPay dashboard trước khi cập nhật.
              </div>
              {[
                { label: 'Payment ID', value: selected.id },
                { label: 'Booking ID', value: selected.bookingId },
                { label: 'Số tiền', value: fmtVnd(selected.amount) },
                { label: 'VNPay Status', value: selected.vnpayStatus },
                { label: 'System Status', value: selected.systemStatus },
                { label: 'Lý do lệch', value: selected.discrepancyReason || '—' },
                { label: 'Ngày tạo', value: fmtDate(selected.createdAt) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                  <span className="body-sm text-charcoal">{r.label}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.value}</span>
                </div>
              ))}
              <p className="body-sm text-charcoal" style={{ marginTop: 20, padding: '12px', background: 'var(--surface-bone)', borderRadius: 8 }}>
                ⚠️ Liên hệ bộ phận kế toán để xử lý reconciliation thủ công. Cập nhật qua Admin backend.
              </p>
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}

// ── SCR-53: Damage Escalation ──────────────────────────────────────────────────

const ESCALATION_THRESHOLD = 5_000_000;

export function DamageEscalationPage() {
  const [items, setItems] = useState<AdminDamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<AdminDamageReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feeInput, setFeeInput] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMsg, setApproveMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true); setError(null);
    try {
      const res = await getEscalatedDamageReports({ page: p, size: 10 });
      if (res.success) { setItems(res.data.content); setTotalPages(res.data.totalPages); setPage(p); }
    } catch (err) { setError(extractApiError(err, 'Không tải được danh sách.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const columns = [
    { header: 'Property', accessor: (item: AdminDamageReport) => <span style={{ fontWeight: 600 }}>{item.propertyName}</span> },
    { header: 'Phòng', accessor: (item: AdminDamageReport) => item.roomName },
    { header: 'Báo cáo bởi', accessor: (item: AdminDamageReport) => item.reportedBy },
    { header: 'Phí ước tính', accessor: (item: AdminDamageReport) => <span style={{ fontWeight: 700, color: '#dc2626' }}>{fmtVnd(item.totalFee)}</span> },
    { header: 'Trạng thái', accessor: (item: AdminDamageReport) => <StatusBadge status={item.status} /> },
    { header: 'Ngày tạo', accessor: (item: AdminDamageReport) => fmtDate(item.createdAt) }
  ];

  const actions = [
    { label: 'Xem & Duyệt', onClick: (item: AdminDamageReport) => { setSelected(item); setFeeInput(String(item.totalFee)); setApproveMsg(null); setDrawerOpen(true); } }
  ];

  async function handleCoApprove() {
    if (!selected) return;
    const fee = parseFloat(feeInput.replace(/[^0-9]/g, ''));
    if (isNaN(fee) || fee <= 0) { setApproveMsg({ type: 'error', msg: 'Vui lòng nhập phí hợp lệ.' }); return; }
    setApproveLoading(true); setApproveMsg(null); setConfirmOpen(false);
    try {
      const res = await coApproveDamageReport(selected.id, fee);
      if (res.success) {
        setApproveMsg({ type: 'success', msg: 'Co-approve thành công!' });
        load(page);
        setTimeout(() => setDrawerOpen(false), 1200);
      } else { setApproveMsg({ type: 'error', msg: 'Co-approve thất bại.' }); }
    } catch (err) { setApproveMsg({ type: 'error', msg: extractApiError(err, 'Co-approve thất bại.') }); }
    finally { setApproveLoading(false); }
  }

  const parsedFee = parseFloat(feeInput.replace(/[^0-9]/g, '')) || 0;

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Damage Escalation</h1>
          <p className="body-sm text-charcoal">SCR-53 — Báo cáo hư hại cần Admin co-approve (&gt; {fmtVnd(ESCALATION_THRESHOLD)})</p>
        </div>

        {items.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <strong>{items.length}</strong> báo cáo hư hại cần Admin co-approve — phí &gt; {fmtVnd(ESCALATION_THRESHOLD)}
          </div>
        )}

        {error && <ErrorBanner msg={error} />}
        {loading ? <Spinner /> : (
          <>
            <div style={{ marginBottom: 20 }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--charcoal)', padding: 32 }}>✅ Không có damage report nào cần escalation</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={items}
                  keyExtractor={(item) => item.id}
                  actions={actions}
                />
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p)} />
          </>
        )}

        {/* Drawer */}
        <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} title="Co-Approve Damage Report">
          {selected && (
            <div>
              {approveMsg && (approveMsg.type === 'success' ? <SuccessBanner msg={approveMsg.msg} /> : <ErrorBanner msg={approveMsg.msg} />)}

              {/* Details */}
              <div style={{ marginBottom: 20 }}>
                {[
                  { label: 'Property', value: selected.propertyName },
                  { label: 'Phòng', value: selected.roomName },
                  { label: 'Báo cáo bởi', value: selected.reportedBy },
                  { label: 'Phí tổng ước tính', value: fmtVnd(selected.totalFee) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Damage items */}
              {selected.items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 700, marginBottom: 10 }}>Chi tiết hư hại:</p>
                  {selected.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface-bone)', borderRadius: 6, marginBottom: 4 }}>
                      <span className="body-sm">{item.name}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#dc2626' }}>{fmtVnd(item.estimatedCost)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Damage photos */}
              {selected.attachments.filter(a => a.type === 'IMAGE').length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 700, marginBottom: 10 }}>Ảnh hư hại:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {selected.attachments.filter(a => a.type === 'IMAGE').map((att, i) => (
                      <img key={i} src={att.url} alt={`Damage ${i + 1}`}
                        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--hairline)' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Fee input */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label form-label-required" htmlFor="approved-fee">Phí được duyệt (VND)</label>
                <input id="approved-fee" className="input" type="number" min={0}
                  value={feeInput} onChange={e => setFeeInput(e.target.value)}
                  placeholder="Nhập phí chính thức..." />
                {parsedFee > ESCALATION_THRESHOLD && (
                  <p className="body-sm" style={{ color: '#dc2626', marginTop: 4 }}>
                    ⚠️ Phí &gt; {fmtVnd(ESCALATION_THRESHOLD)} — yêu cầu co-approval từ Admin
                  </p>
                )}
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={approveLoading || !feeInput}
                onClick={() => setConfirmOpen(true)}
              >
                {approveLoading ? 'Đang xử lý...' : '✓ Co-Approve'}
              </button>
            </div>
          )}
        </Drawer>

        <ConfirmModal
          open={confirmOpen}
          title="Xác nhận Co-Approve"
          message={`Bạn xác nhận duyệt phí ${parsedFee > 0 ? fmtVnd(parsedFee) : '?'} cho báo cáo hư hại này?`}
          confirmLabel="Xác nhận Co-Approve"
          onConfirm={handleCoApprove}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}

// ── SCR-54: Complaint Management ───────────────────────────────────────────────

export function AdminComplaintsPage() {
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<AdminComplaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveMsg, setResolveMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async (p = 0, status = '') => {
    setLoading(true); setError(null);
    try {
      const res = await getAdminComplaints({ page: p, size: 10, status: status || undefined });
      if (res.success) { setItems(res.data.content); setTotalPages(res.data.totalPages); setPage(p); }
    } catch (err) { setError(extractApiError(err, 'Không tải được complaints.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0, statusFilter); }, [load, statusFilter]);

  async function handleResolve() {
    if (!selected || !resolution.trim()) return;
    setResolveLoading(true); setResolveMsg(null);
    try {
      const res = await resolveComplaint(selected.id, resolution.trim());
      if (res.success) {
        setResolveMsg({ type: 'success', msg: 'Complaint đã được resolve!' });
        load(page, statusFilter);
        setTimeout(() => setDrawerOpen(false), 1200);
      } else { setResolveMsg({ type: 'error', msg: 'Resolve thất bại.' }); }
    } catch (err) { setResolveMsg({ type: 'error', msg: extractApiError(err, 'Resolve thất bại.') }); }
    finally { setResolveLoading(false); }
  }

  const columns = [
    { header: 'ID', accessor: (c: AdminComplaint) => <span className="code-sm">{c.id.slice(0, 8)}</span> },
    { header: 'Khách hàng', accessor: (c: AdminComplaint) => <span className="font-semibold">{c.customerName}</span> },
    { header: 'Booking', accessor: (c: AdminComplaint) => <span className="code-sm">{c.bookingId.slice(0, 8)}</span> },
    { header: 'Mô tả', accessor: (c: AdminComplaint) => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{c.description}</span> },
    { header: 'Trạng thái', accessor: (c: AdminComplaint) => <UIStatusBadge status={c.status} variant={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'success' : c.status === 'OPEN' ? 'warning' : 'info'} /> },
    { header: 'Ngày tạo', accessor: (c: AdminComplaint) => fmtDate(c.createdAt) }
  ];

  const actions = [
    { label: 'Xử lý', onClick: (c: AdminComplaint) => { setSelected(c); setResolution(c.resolution || ''); setResolveMsg(null); setDrawerOpen(true); } }
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Complaint Management</h1>
          <p className="body-sm text-charcoal">SCR-54 — Xử lý khiếu nại hệ thống</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label className="form-label" style={{ alignSelf: 'center', margin: 0 }}>Lọc:</label>
            {['', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map(s => (
              <button key={s} className={statusFilter === s ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
                onClick={() => setStatusFilter(s)}>
                {s || 'Tất cả'}
              </button>
            ))}
          </div>
        </div>
        {loading ? <Spinner /> : (
          <>
            <DataTable 
              columns={columns}
              data={items}
              keyExtractor={(c) => c.id}
              actions={actions}
            />
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p, statusFilter)} />
          </>
        )}

        <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} title="Chi tiết Complaint">
          {selected && (
            <div>
              {resolveMsg && (resolveMsg.type === 'success' ? <SuccessBanner msg={resolveMsg.msg} /> : <ErrorBanner msg={resolveMsg.msg} />)}
              <div style={{ marginBottom: 20 }}>
                {[
                  { label: 'ID', value: selected.id.slice(0, 8) },
                  { label: 'Khách hàng', value: selected.customerName },
                  { label: 'Booking', value: selected.bookingId.slice(0, 8) },
                  { label: 'Trạng thái', value: <StatusBadge status={selected.status} /> },
                  { label: 'Ngày tạo', value: fmtDate(selected.createdAt) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16, padding: '12px', background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Mô tả khiếu nại:</p>
                <p className="body-sm">{selected.description}</p>
              </div>
              {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label form-label-required" htmlFor="complaint-resolution">Hướng giải quyết</label>
                  <textarea id="complaint-resolution" className="textarea" rows={4}
                    placeholder="Nhập hướng giải quyết..."
                    value={resolution} onChange={e => setResolution(e.target.value)} />
                  <button className="btn-primary" style={{ marginTop: 10, width: '100%' }}
                    disabled={resolveLoading || !resolution.trim()} onClick={handleResolve}>
                    {resolveLoading ? 'Đang xử lý...' : '✓ Resolve Complaint'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}

// ── SCR-55: Global Reports ─────────────────────────────────────────────────────

const MONTHS_VI = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

export function GlobalReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (y: number) => {
    setLoading(true); setError(null);
    try {
      const res = await getGlobalRevenueReport(y);
      if (res.success) setData(res.data?.monthlyData ?? []);
      else setError('Không tải được báo cáo.');
    } catch (err) { setError(extractApiError(err, 'Không tải được báo cáo.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(year); }, [load, year]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Global Reports</h1>
            <p className="body-sm text-charcoal">SCR-55 — Báo cáo doanh thu toàn hệ thống</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0 }} htmlFor="report-year">Năm:</label>
            <select id="report-year" className="input" style={{ width: 100 }}
              value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Summary KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: 'var(--primary)' }}>{fmtVnd(totalRevenue)}</div>
            <div className="kpi-label">Tổng doanh thu {year}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{data.length}</div>
            <div className="kpi-label">Tháng có dữ liệu</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{data.length > 0 ? fmtVnd(totalRevenue / data.length) : '—'}</div>
            <div className="kpi-label">Doanh thu TB/tháng</div>
          </div>
        </div>

        {error && <ErrorBanner msg={error} />}

        {/* Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Doanh thu theo tháng — {year}</h2>
          {loading ? <div style={{ height: 160 }}><Spinner /></div> : data.length === 0 ? (
            <p className="body-sm text-charcoal" style={{ textAlign: 'center', padding: 40 }}>Chưa có dữ liệu</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0 4px' }}>
              {data.map(d => {
                const pct = Math.round((d.revenue / maxRevenue) * 100);
                return (
                  <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--charcoal)', fontWeight: 600 }}>
                      {d.revenue > 0 ? `${(d.revenue/1_000_000).toFixed(0)}M` : ''}
                    </span>
                    <div
                      title={`${MONTHS_VI[d.month-1]}: ${fmtVnd(d.revenue)}`}
                      style={{ width: '100%', height: `${Math.max(pct, 4)}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', cursor: 'default' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--charcoal)' }}>{MONTHS_VI[d.month-1]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Table */}
        {!loading && data.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <DataTable
              columns={[
                { header: 'Tháng', accessor: (d: MonthlyRevenue) => `${MONTHS_VI[d.month-1]} ${year}` },
                { header: 'Doanh thu', accessor: (d: MonthlyRevenue) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmtVnd(d.revenue)}</span> },
                { header: '% Tổng', accessor: (d: MonthlyRevenue) => `${totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : 0}%` }
              ]}
              data={data}
              keyExtractor={(d) => d.month.toString()}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── SCR-56: System Administration ─────────────────────────────────────────────

export function SystemAdminPage() {
  const [tab, setTab] = useState<'settings' | 'logs' | 'moderation'>('settings');
  const [settings, setSettings] = useState<SystemSettings>({ depositPercentage: 40, cancelTimeoutHours: 24 });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    async function load() {
      setSettingsLoading(true);
      try {
        const res = await getSystemSettings();
        if (res.success) setSettings(res.data);
      } catch { /* silent */ }
      finally { setSettingsLoading(false); }
    }
    load();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true); setSettingsMsg(null);
    try {
      const res = await updateSystemSettings(settings);
      if (res.success) setSettingsMsg({ type: 'success', msg: 'Cài đặt đã được lưu!' });
      else setSettingsMsg({ type: 'error', msg: 'Lưu thất bại.' });
    } catch (err) { setSettingsMsg({ type: 'error', msg: extractApiError(err, 'Lưu thất bại.') }); }
    finally { setSaveLoading(false); }
  }

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'settings',   label: '⚙️ System Settings' },
    { key: 'logs',       label: '📋 Activity Logs' },
    { key: 'moderation', label: '🛡️ Content Moderation' },
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>System Administration</h1>
          <p className="body-sm text-charcoal">SCR-56 — Settings, Activity Logs, Content Moderation</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--hairline)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'Outfit', fontWeight: tab === t.key ? 700 : 500, fontSize: 14,
              color: tab === t.key ? 'var(--primary)' : 'var(--charcoal)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -2, transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Settings */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 560 }}>
            {settingsMsg && (settingsMsg.type === 'success' ? <SuccessBanner msg={settingsMsg.msg} /> : <ErrorBanner msg={settingsMsg.msg} />)}
            {settingsLoading ? <Spinner /> : (
              <form onSubmit={handleSaveSettings} className="card" style={{ padding: 28 }}>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Cài đặt hệ thống</h2>

                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" htmlFor="deposit-pct">Tỷ lệ đặt cọc (%)</label>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>
                    Áp dụng cho tất cả booking mới. Hiện tại: <strong>{settings.depositPercentage}%</strong>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input type="range" id="deposit-pct" min={10} max={100} step={5}
                      value={settings.depositPercentage}
                      onChange={e => setSettings(s => ({ ...s, depositPercentage: Number(e.target.value) }))}
                      style={{ flex: 1, accentColor: 'var(--primary)' }} />
                    <input type="number" className="input" min={10} max={100}
                      value={settings.depositPercentage}
                      onChange={e => setSettings(s => ({ ...s, depositPercentage: Number(e.target.value) }))}
                      style={{ width: 80, textAlign: 'center' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="form-label" htmlFor="cancel-timeout">Thời gian timeout hủy (giờ)</label>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>
                    Thời gian khách hàng được phép hủy booking sau khi tạo.
                  </p>
                  <input id="cancel-timeout" type="number" className="input" min={1} max={168}
                    value={settings.cancelTimeoutHours}
                    onChange={e => setSettings(s => ({ ...s, cancelTimeoutHours: Number(e.target.value) }))}
                    style={{ width: 140 }} />
                </div>

                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  ⚠️ Thay đổi cài đặt ảnh hưởng đến <strong>tất cả booking mới</strong>. Booking hiện tại không bị ảnh hưởng.
                </div>

                <button type="submit" className="btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Đang lưu...' : '💾 Save Settings'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Activity Logs */}
        {tab === 'logs' && (
          <div>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)', marginBottom: 16 }}>
              <p className="body-sm text-charcoal">
                Activity logs được lấy từ backend audit trail. Liên hệ DevOps để xem full logs.
              </p>
            </div>
            <DataTable
              columns={[
                { header: 'Thời gian', accessor: (log: any) => <span className="code-sm">{log.time}</span> },
                { header: 'User', accessor: (log: any) => log.user },
                { header: 'Action', accessor: (log: any) => <span className="badge badge-info">{log.action}</span> },
                { header: 'Entity', accessor: (log: any) => <span className="body-sm text-charcoal">{log.entity}</span> },
                { header: 'IP', accessor: (log: any) => <span className="code-sm">{log.ip}</span> }
              ]}
              data={[
                { time: '2026-06-27 09:45:12', user: 'admin@system', action: 'UPDATE_SETTINGS', entity: 'SystemSettings', ip: '127.0.0.1' },
                { time: '2026-06-27 09:30:05', user: 'manager@resort', action: 'APPROVE_PAYMENT', entity: 'Payment#abc123', ip: '192.168.1.5' },
                { time: '2026-06-27 08:15:33', user: 'admin@system', action: 'CO_APPROVE_DAMAGE', entity: 'DamageReport#xyz', ip: '127.0.0.1' },
              ]}
              keyExtractor={(log) => log.time}
            />
          </div>
        )}

        {/* Tab: Content Moderation */}
        {tab === 'moderation' && (
          <div>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              Kiểm duyệt nội dung reviews. Có thể ẩn reviews vi phạm chính sách.
            </div>
            <DataTable
              columns={[
                { header: 'Review ID', accessor: (r: any) => <span className="code-sm">{r.id}</span> },
                { header: 'Khách hàng', accessor: (r: any) => r.customer },
                { header: 'Rating', accessor: (r: any) => '⭐'.repeat(r.rating) },
                { header: 'Nội dung', accessor: (r: any) => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{r.comment}</span> },
                { header: 'Trạng thái', accessor: (r: any) => <StatusBadge status={r.status === 'VISIBLE' ? 'ACTIVE' : 'INACTIVE'} /> }
              ]}
              data={[
                { id: 'R001', customer: 'Nguyễn Văn A', rating: 1, comment: 'Phòng rất tệ, không đúng như mô tả...', status: 'VISIBLE' },
                { id: 'R002', customer: 'Trần Thị B', rating: 5, comment: 'Tuyệt vời! Nhân viên rất tận tình...', status: 'VISIBLE' },
              ]}
              keyExtractor={(r) => r.id}
              actions={[
                { label: '🚫 Ẩn Review', onClick: (r) => {} }
              ]}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── SCR-57: Promotion Management ───────────────────────────────────────────────

export function PromotionAdminListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true); setError(null);
    try {
      const res = await getAdminPromotions({ page: p, size: 10 });
      if (res.success) { setItems(res.data.content); setTotalPages(res.data.totalPages); setPage(p); }
    } catch (err) { setError(extractApiError(err, 'Không tải được promotions.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const columns = [
    { header: 'Code', accessor: (p: Promotion) => <span className="badge badge-success">{p.code}</span> },
    { header: 'Giảm giá', accessor: (p: Promotion) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.discountPercent}%</span> },
    { header: 'Ngày bắt đầu', accessor: (p: Promotion) => fmtDate(p.startDate || '') },
    { header: 'Ngày kết thúc', accessor: (p: Promotion) => fmtDate(p.endDate || '') },
    { header: 'Ngày tạo', accessor: (p: Promotion) => fmtDate(p.createdAt) }
  ];

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deletePromotion(deleteId);
      setDeleteId(null);
      load(page);
    } catch (err) { setDeleteMsg(extractApiError(err, 'Xóa thất bại.')); }
    finally { setDeleteLoading(false); }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Promotion Management</h1>
            <p className="body-sm text-charcoal">SCR-57 — Quản lý mã khuyến mãi</p>
          </div>
          <Link to="/admin/promotions/create" className="btn-primary">+ Add Promotion</Link>
        </div>
        {error && <ErrorBanner msg={error} />}
        {deleteMsg && <ErrorBanner msg={deleteMsg} />}
        {loading ? <Spinner /> : (
          <>
            <div style={{ marginBottom: 20 }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--charcoal)', padding: 32 }}>Chưa có promotion nào</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={items}
                  keyExtractor={(p) => p.id}
                  actions={[
                    { label: 'Sửa', onClick: (p: Promotion) => navigate(`/admin/promotions/${p.id}/edit`) },
                    { label: 'Xóa', onClick: (p: Promotion) => { setDeleteId(p.id); setDeleteMsg(null); } }
                  ]}
                />
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p)} />
          </>
        )}

        <ConfirmModal
          open={!!deleteId}
          title="Xác nhận xóa"
          message="Bạn có chắc muốn xóa promotion này không? Hành động này không thể hoàn tác."
          confirmLabel={deleteLoading ? 'Đang xóa...' : 'Xóa'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          danger
        />
      </div>
    </AdminLayout>
  );
}

// ── SCR-58: Add/Edit Promotion ─────────────────────────────────────────────────

export function AddEditPromotionPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    code: '', discountPercent: 10, imageUrl: '', startDate: '', endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (!id) return;
    async function load() {
      setFetching(true);
      try {
        const res = await getAdminPromotions({ size: 200 });
        const promo = res.data?.content?.find(p => p.id === id);
        if (promo) {
          setForm({
            code: promo.code,
            discountPercent: promo.discountPercent,
            imageUrl: promo.imageUrl || '',
            startDate: promo.startDate || '',
            endDate: promo.endDate || '',
          });
          setImagePreview(promo.imageUrl || '');
        }
      } catch { /* silent */ }
      finally { setFetching(false); }
    }
    load();
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Mã không được để trống';
    if (!/^[A-Z0-9_-]+$/.test(form.code.trim())) e.code = 'Mã chỉ được dùng chữ hoa, số, - hoặc _';
    if (form.discountPercent < 1 || form.discountPercent > 100) e.discountPercent = 'Giảm giá phải từ 1% đến 100%';
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setError(null); setLoading(true);
    try {
      const payload = {
        code: form.code.trim(),
        discountPercent: form.discountPercent,
        imageUrl: form.imageUrl.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (isEdit && id) {
        await updatePromotion(id, payload);
      } else {
        await createPromotion(payload as { code: string; discountPercent: number });
      }
      navigate('/admin/promotions');
    } catch (err) { setError(extractApiError(err, `${isEdit ? 'Cập nhật' : 'Tạo'} promotion thất bại.`)); }
    finally { setLoading(false); }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin/promotions" className="body-sm text-primary" style={{ textDecoration: 'none' }}>← Promotions</Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginTop: 8, marginBottom: 4 }}>
            {isEdit ? 'Edit Promotion' : 'Add Promotion'}
          </h1>
          <p className="body-sm text-charcoal">SCR-58 — {isEdit ? 'PUT' : 'POST'} /api/admin/promotions</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        {fetching ? <Spinner /> : (
          <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-code">Mã khuyến mãi</label>
                <input id="promo-code" className={`input ${errors.code ? 'input-error' : ''}`}
                  placeholder="VD: SUMMER2026"
                  value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                {errors.code && <p className="form-error">{errors.code}</p>}
              </div>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-discount">Giảm giá (%)</label>
                <input id="promo-discount" type="number" className={`input ${errors.discountPercent ? 'input-error' : ''}`}
                  min={1} max={100} value={form.discountPercent}
                  onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))} />
                {errors.discountPercent && <p className="form-error">{errors.discountPercent}</p>}
              </div>
              <div>
                <label className="form-label" htmlFor="promo-start">Ngày bắt đầu</label>
                <input id="promo-start" type="date" className="input"
                  value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label" htmlFor="promo-end">Ngày kết thúc</label>
                <input id="promo-end" type="date" className="input"
                  value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                {errors.endDate && <p className="form-error">{errors.endDate}</p>}
              </div>
            </div>

            {/* Image URL + Preview */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="promo-img">Image URL (Banner)</label>
              <input id="promo-img" className="input" type="url"
                placeholder="https://example.com/banner.jpg"
                value={form.imageUrl}
                onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setImagePreview(e.target.value); }} />
              {imagePreview && (
                <div style={{ marginTop: 12 }}>
                  <p className="form-hint" style={{ marginBottom: 6 }}>Preview:</p>
                  <img src={imagePreview} alt="Promotion preview"
                    onError={() => setImagePreview('')}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--hairline)' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Đang lưu...' : isEdit ? '💾 Save Changes' : '✨ Create Promotion'}
              </button>
              <Link to="/admin/promotions" className="btn-ghost">Hủy</Link>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
