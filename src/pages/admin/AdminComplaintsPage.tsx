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

