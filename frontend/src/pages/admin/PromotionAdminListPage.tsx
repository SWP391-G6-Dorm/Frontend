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
    { header: 'Title', accessor: (p: Promotion) => <span style={{ fontWeight: 600 }}>{p.title}</span> },
    { header: 'Subtitle', accessor: (p: Promotion) => <span className="body-sm text-charcoal">{p.subtitle}</span> },
    { header: 'Theme', accessor: (p: Promotion) => <span className="badge badge-info">{p.colorTheme}</span> },
    { header: 'Active', accessor: (p: Promotion) => <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { header: 'Sort', accessor: (p: Promotion) => p.sortOrder },
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

