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

export function AddEditPromotionPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    subtitle: '',
    title: '',
    description: '',
    ctaText: 'Dat ngay',
    ctaUrl: '/search',
    colorTheme: 'red',
    isActive: true,
    sortOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setFetching(true);
      try {
        const res = await getAdminPromotions({ size: 200 });
        const promo = res.data?.content?.find(p => p.id === id);
        if (promo) {
          setForm({
            subtitle: promo.subtitle || '',
            title: promo.title || '',
            description: promo.description || '',
            ctaText: promo.ctaText || 'Dat ngay',
            ctaUrl: promo.ctaUrl || '/search',
            colorTheme: promo.colorTheme || 'red',
            isActive: promo.isActive ?? true,
            sortOrder: promo.sortOrder ?? 0,
          });
        }
      } catch { /* silent */ }
      finally { setFetching(false); }
    }
    load();
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.subtitle.trim()) e.subtitle = 'Subtitle bat buoc';
    if (!form.title.trim()) e.title = 'Title bat buoc';
    if (!form.ctaText.trim()) e.ctaText = 'CTA text bat buoc';
    if (!form.ctaUrl.trim()) e.ctaUrl = 'CTA URL bat buoc';
    if (!form.colorTheme.trim()) e.colorTheme = 'Theme bat buoc';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setError(null); setLoading(true);
    try {
      const payload = {
        subtitle: form.subtitle.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        ctaText: form.ctaText.trim(),
        ctaUrl: form.ctaUrl.trim(),
        colorTheme: form.colorTheme.trim(),
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      if (isEdit && id) {
        await updatePromotion(id, payload);
      } else {
        await createPromotion(payload);
      }
      navigate('/admin/promotions');
    } catch (err) { setError(extractApiError(err, `${isEdit ? 'Cap nhat' : 'Tao'} promotion that bai.`)); }
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
          <p className="body-sm text-charcoal">SCR-58 — banner form (POST/PUT BE may come later)</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        {fetching ? <Spinner /> : (
          <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-subtitle">Subtitle</label>
                <input id="promo-subtitle" className={`input ${errors.subtitle ? 'input-error' : ''}`}
                  value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
                {errors.subtitle && <p className="form-error">{errors.subtitle}</p>}
              </div>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-title">Title</label>
                <input id="promo-title" className={`input ${errors.title ? 'input-error' : ''}`}
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-cta-text">CTA Text</label>
                <input id="promo-cta-text" className={`input ${errors.ctaText ? 'input-error' : ''}`}
                  value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} />
                {errors.ctaText && <p className="form-error">{errors.ctaText}</p>}
              </div>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-cta-url">CTA URL</label>
                <input id="promo-cta-url" className={`input ${errors.ctaUrl ? 'input-error' : ''}`}
                  value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} />
                {errors.ctaUrl && <p className="form-error">{errors.ctaUrl}</p>}
              </div>
              <div>
                <label className="form-label form-label-required" htmlFor="promo-theme">Color Theme</label>
                <select id="promo-theme" className={`input ${errors.colorTheme ? 'input-error' : ''}`}
                  value={form.colorTheme} onChange={e => setForm(f => ({ ...f, colorTheme: e.target.value }))}>
                  {['red', 'blue', 'green', 'purple', 'orange'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.colorTheme && <p className="form-error">{errors.colorTheme}</p>}
              </div>
              <div>
                <label className="form-label" htmlFor="promo-sort">Sort Order</label>
                <input id="promo-sort" type="number" className="input" min={0}
                  value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="promo-desc">Description</label>
              <textarea id="promo-desc" className="textarea" rows={3}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input id="promo-active" type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="promo-active" className="body-sm">Active on landing</label>
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Dang luu...' : isEdit ? 'Save Changes' : 'Create Promotion'}
              </button>
              <Link to="/admin/promotions" className="btn-ghost">Huy</Link>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

