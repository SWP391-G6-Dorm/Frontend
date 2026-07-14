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
import { fmtVnd, fmtDate, extractApiError, Spinner, ErrorBanner, SuccessBanner, StatusBadge, Drawer, ConfirmModal, Pagination } from './_adminShared';

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

