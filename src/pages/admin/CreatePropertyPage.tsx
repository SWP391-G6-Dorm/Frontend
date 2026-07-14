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

