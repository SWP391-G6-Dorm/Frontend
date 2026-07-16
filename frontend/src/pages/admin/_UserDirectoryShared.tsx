import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getManagers, getCustomers, updateAdminUser,
  getAdminUserById, getAdminCustomerBookings,
  type AdminUser, type AdminCustomerBookingSummary,
} from '../../api/adminApi';
import { DataTable, StatusBadge as UIStatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import { fmtDate, fmtVnd, extractApiError, Spinner, ErrorBanner, SuccessBanner, StatusBadge, Drawer, ConfirmModal, Pagination } from './_adminShared';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  ACTIVE:    { label: 'Đang hoạt động', variant: 'success' },
  INACTIVE:  { label: 'Vô hiệu hóa',   variant: 'neutral' },
  SUSPENDED: { label: 'Tạm khóa',      variant: 'danger' },
};

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Vô hiệu hóa' },
  { value: 'SUSPENDED', label: 'Tạm khóa' },
];

function statusBadge(status: string) {
  const cfg = STATUS_VI[status] ?? { label: status, variant: 'neutral' as StatusVariant };
  return <UIStatusBadge status={cfg.label} variant={cfg.variant} />;
}

const BOOKING_STATUS_VI: Record<string, string> = {
  PENDING_DEPOSIT: 'Chờ cọc',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  PENDING_INSPECTION: 'Chờ kiểm tra',
  PENDING_DAMAGE_PAYMENT: 'Chờ thanh toán hư hại',
  CHECKED_OUT: 'Đã trả phòng',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

function UserDirectoryPage({ role, title, scr }: { role: 'MANAGER' | 'CUSTOMER'; title: string; scr: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [customerBookings, setCustomerBookings] = useState<AdminCustomerBookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async (p = 0, kw = '', st = '') => {
    setLoading(true);
    setError(null);
    try {
      const fn = role === 'MANAGER' ? getManagers : getCustomers;
      const res = await fn({
        page: p,
        size: 10,
        keyword: kw || undefined,
        status: st || undefined,
      });
      if (res.success) {
        setUsers(res.data.content);
        setTotalPages(res.data.totalPages);
        setPage(p);
      } else {
        setUsers([]);
        setTotalPages(0);
        setError('Không tải được danh sách.');
      }
    } catch (err) {
      setUsers([]);
      setTotalPages(0);
      setError(extractApiError(err, 'Không tải được danh sách.'));
    } finally {
      setLoading(false);
    }
  }, [role]);

  const columns = [
    { header: 'Họ tên', accessor: (u: AdminUser) => <span className="font-semibold">{u.fullName}</span> },
    { header: 'Email', accessor: (u: AdminUser) => u.email },
    { header: 'Điện thoại', accessor: (u: AdminUser) => u.phone || '—' },
    ...(role === 'MANAGER'
      ? [{
          header: 'Homestay gán',
          accessor: (u: AdminUser) => (
            <span>{u.propertiesAssigned ?? 0}</span>
          ),
        }]
      : [
          {
            header: 'Tổng đơn',
            accessor: (u: AdminUser) => <span>{u.totalBookings ?? 0}</span>,
          },
          {
            header: 'Tổng chi tiêu',
            accessor: (u: AdminUser) => (
              <span>{fmtVnd(u.totalSpend ?? 0)}</span>
            ),
          },
        ]),
    { header: 'Ngày tạo', accessor: (u: AdminUser) => fmtDate(u.createdAt) },
    { header: 'Trạng thái', accessor: (u: AdminUser) => statusBadge(u.status) },
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: (u: AdminUser) => openDrawer(u),
    },
  ];

  async function loadCustomerBookings(userId: string) {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const res = await getAdminCustomerBookings(userId, { page: 0, size: 5 });
      if (res.success) {
        setCustomerBookings(res.data.content);
      } else {
        setCustomerBookings([]);
        setBookingsError('Không tải được lịch sử đặt phòng.');
      }
    } catch (err) {
      setCustomerBookings([]);
      setBookingsError(extractApiError(err, 'Không tải được lịch sử đặt phòng.'));
    } finally {
      setBookingsLoading(false);
    }
  }

  async function openDrawer(u: AdminUser) {
    setDrawerOpen(true);
    setActionMsg(null);
    setDrawerError(null);
    setDrawerLoading(true);
    setCustomerBookings([]);
    setBookingsError(null);

    try {
      const res = await getAdminUserById(u.id);
      if (res.success && res.data) {
        setSelectedUser(res.data);
        if (role === 'CUSTOMER') {
          await loadCustomerBookings(u.id);
        }
      } else {
        setSelectedUser(u);
        setDrawerError('Không tải được chi tiết tài khoản.');
      }
    } catch (err) {
      setSelectedUser(u);
      setDrawerError(extractApiError(err, 'Không tải được chi tiết tài khoản.'));
    } finally {
      setDrawerLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers(0, keyword, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reload khi đổi role/status filter
  }, [fetchUsers, statusFilter]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearch(v: string) {
    setKeyword(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(0, v, statusFilter), 400);
  }

  async function handleToggleStatus(user: AdminUser) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoading(true);
    setActionMsg(null);
    try {
      await updateAdminUser(user.id, { status: newStatus });
      setActionMsg({
        type: 'success',
        msg: `Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản.`,
      });
      setSelectedUser(u => (u ? { ...u, status: newStatus } : null));
      setConfirmUser(null);
      fetchUsers(page, keyword, statusFilter);
    } catch (err) {
      setActionMsg({ type: 'error', msg: extractApiError(err, 'Thao tác thất bại.') });
      setConfirmUser(null);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</h1>
            <p className="body-sm text-charcoal">{scr} — Quản lý tài khoản {role === 'MANAGER' ? 'Manager' : 'Customer'}</p>
          </div>
        </div>
        {error && <ErrorBanner msg={error} />}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <input
            id={`${role}-search`}
            className="input"
            placeholder="Tìm theo tên, email hoặc điện thoại..."
            value={keyword}
            onChange={e => handleSearch(e.target.value)}
            style={{ maxWidth: 340 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                className={statusFilter === f.value ? 'btn-primary' : 'btn-outline'}
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Không tải được danh sách.</p>
            <button type="button" className="btn-primary" onClick={() => fetchUsers(page, keyword, statusFilter)}>
              Thử lại
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p className="body-md text-charcoal">Không có tài khoản phù hợp.</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={users}
              keyExtractor={(u) => u.id}
              actions={actions}
            />
            <Pagination page={page} totalPages={totalPages} onPage={p => fetchUsers(p, keyword, statusFilter)} />
          </>
        )}

        <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedUser(null); setCustomerBookings([]); }} title="Chi tiết tài khoản">
          {drawerLoading ? (
            <Spinner />
          ) : selectedUser && (
            <div>
              {drawerError && <ErrorBanner msg={drawerError} />}
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
                  { label: 'Vai trò', value: selectedUser.role },
                  { label: 'Điện thoại', value: selectedUser.phone || '—' },
                  ...(role === 'MANAGER'
                    ? [{ label: 'Homestay gán', value: String(selectedUser.propertiesAssigned ?? 0) }]
                    : [
                        { label: 'Tổng đơn', value: String(selectedUser.totalBookings ?? 0) },
                        { label: 'Tổng chi tiêu', value: fmtVnd(selectedUser.totalSpend ?? 0) },
                      ]),
                  { label: 'Ngày tạo', value: fmtDate(selectedUser.createdAt) },
                  { label: 'Cập nhật', value: fmtDate(selectedUser.updatedAt) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {role === 'CUSTOMER' && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>
                    Lịch sử đặt phòng gần đây
                  </h3>
                  {bookingsLoading ? (
                    <Spinner />
                  ) : bookingsError ? (
                    <div>
                      <ErrorBanner msg={bookingsError} />
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        style={{ marginTop: 8 }}
                        onClick={() => loadCustomerBookings(selectedUser.id)}
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : customerBookings.length === 0 ? (
                    <p className="body-sm text-charcoal m-0">Chưa có đơn đặt phòng.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {customerBookings.map(b => (
                        <div
                          key={b.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid var(--hairline)',
                            background: '#FAFAFA',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                              Phòng {b.roomNumber} — {b.propertyName}
                            </span>
                            <span className="body-sm text-charcoal">
                              {BOOKING_STATUS_VI[b.status] ?? b.status}
                            </span>
                          </div>
                          <p className="body-sm text-charcoal m-0">
                            {fmtDate(b.checkInDate)} → {fmtDate(b.checkOutDate)} · {fmtVnd(b.totalAmount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(selectedUser.status === 'ACTIVE' || selectedUser.status === 'INACTIVE') && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={selectedUser.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}
                    disabled={actionLoading}
                    onClick={() => setConfirmUser(selectedUser)}
                  >
                    {selectedUser.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Drawer>

        <ConfirmModal
          open={!!confirmUser}
          title={confirmUser?.status === 'ACTIVE' ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
          message={
            confirmUser?.status === 'ACTIVE'
              ? `Bạn có chắc muốn vô hiệu hóa "${confirmUser?.fullName}"? Tài khoản sẽ không đăng nhập được.`
              : `Bạn có chắc muốn kích hoạt lại "${confirmUser?.fullName}"?`
          }
          confirmLabel={actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
          danger={confirmUser?.status === 'ACTIVE'}
          onConfirm={() => confirmUser && handleToggleStatus(confirmUser)}
          onCancel={() => setConfirmUser(null)}
        />
      </div>
    </AdminLayout>
  );
}

export { UserDirectoryPage };
