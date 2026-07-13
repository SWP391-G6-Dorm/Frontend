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

