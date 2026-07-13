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

