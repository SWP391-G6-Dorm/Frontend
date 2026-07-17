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



export { UserDirectoryPage };
