import { useState, useEffect, useCallback, useRef } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { DataTable, StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerEmployeesV1,
  fetchUnassignedEmployeesV1,
  assignEmployeeV1,
  createEmployeeV1,
  updateEmployeeV1,
  updateEmployeeStatusV1,
  type EmployeeSummary,
} from '../../api/managerEmployeeApi';
import { managerApi } from '../../api/managerApi';
import type { AssignedProperty } from '../../api/reportApi';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  ACTIVE:    { label: 'Đang hoạt động', variant: 'success' },
  SUSPENDED: { label: 'Tạm khóa',       variant: 'danger' },
  INACTIVE:  { label: 'Chưa kích hoạt', variant: 'warning' },
};

const PAGE_SIZE = 10;
const UNASSIGNED_PAGE_SIZE = 20;

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        type="button"
        className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-md disabled:opacity-40"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
      >
        ←
      </button>
      <span className="px-3 py-1.5 text-sm text-[#64748B]">
        Trang {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-md disabled:opacity-40"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        →
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#F1F5F9] rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function EmployeeMgmtPage() {
  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [propLoading, setPropLoading] = useState(true);
  const [propError, setPropError] = useState<string | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [unassigned, setUnassigned] = useState<EmployeeSummary[]>([]);
  const [unassignedLoading, setUnassignedLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const assignDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phone: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeSummary | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Status confirm
  const [statusTarget, setStatusTarget] = useState<EmployeeSummary | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const showEmptyAssigned = !propLoading && properties.length === 0;

  useEffect(() => {
    setPropLoading(true);
    managerApi.getMyAssignedProperties()
      .then(res => {
        if (res.success && res.data) {
          setProperties(res.data);
          if (res.data.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(res.data[0].id);
          }
        }
      })
      .catch(() => setPropError('Không thể tải danh sách homestay.'))
      .finally(() => setPropLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployees = useCallback((pg: number, srch: string, propId: string) => {
    if (!propId) {
      setEmployees([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }
    setLoading(true);
    setError(null);
    fetchManagerEmployeesV1({
      propertyId: propId,
      search: srch || undefined,
      page: pg,
      size: PAGE_SIZE,
    })
      .then(data => {
        setEmployees(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax?.response?.status === 403) {
          setError('Bạn không có quyền xem homestay này.');
        } else {
          setError(ax?.response?.data?.message ?? 'Không thể tải danh sách nhân viên.');
        }
        setEmployees([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      loadEmployees(0, search, selectedPropertyId);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, selectedPropertyId, loadEmployees]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    loadEmployees(newPage, search, selectedPropertyId);
  }

  const loadUnassigned = useCallback((srch: string, propId: string) => {
    if (!propId) return;
    setUnassignedLoading(true);
    setAssignError(null);
    fetchUnassignedEmployeesV1({
      propertyId: propId,
      search: srch || undefined,
      page: 0,
      size: UNASSIGNED_PAGE_SIZE,
    })
      .then(data => setUnassigned(data.content))
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { message?: string } } };
        setAssignError(ax?.response?.data?.message ?? 'Không thể tải danh sách nhân viên chưa gán.');
        setUnassigned([]);
      })
      .finally(() => setUnassignedLoading(false));
  }, []);

  function openAssignModal() {
    if (!selectedPropertyId) {
      setError('Vui lòng chọn homestay trước.');
      return;
    }
    setAssignSearch('');
    setAssignError(null);
    setAssignOpen(true);
    loadUnassigned('', selectedPropertyId);
  }

  useEffect(() => {
    if (!assignOpen) return;
    clearTimeout(assignDebounceRef.current);
    assignDebounceRef.current = setTimeout(() => {
      loadUnassigned(assignSearch, selectedPropertyId);
    }, 300);
    return () => clearTimeout(assignDebounceRef.current);
  }, [assignSearch, assignOpen, selectedPropertyId, loadUnassigned]);

  async function handleAssign(employeeId: string) {
    setAssigningId(employeeId);
    setAssignError(null);
    try {
      await assignEmployeeV1(employeeId, selectedPropertyId);
      setAssignOpen(false);
      setSuccessMsg('Gán nhân viên thành công.');
      loadEmployees(page, search, selectedPropertyId);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setAssignError(ax?.response?.data?.message ?? 'Không thể gán nhân viên.');
    } finally {
      setAssigningId(null);
    }
  }

  function openCreateModal() {
    if (!selectedPropertyId) {
      setError('Vui lòng chọn homestay trước.');
      return;
    }
    setCreateForm({ fullName: '', email: '', phone: '' });
    setCreateError(null);
    setCreateFieldErrors({});
    setCreateOpen(true);
  }

  async function handleCreate() {
    const fullName = createForm.fullName.trim();
    const email = createForm.email.trim();
    if (!fullName || !email) {
      setCreateError('Họ tên và email là bắt buộc.');
      return;
    }
    if (fullName.length < 2) {
      setCreateFieldErrors({ fullName: 'Họ tên phải có ít nhất 2 ký tự.' });
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    setCreateFieldErrors({});
    try {
      await createEmployeeV1({
        fullName,
        email,
        phone: createForm.phone.trim() || undefined,
        propertyId: selectedPropertyId,
      });
      setCreateOpen(false);
      setSuccessMsg('Tạo nhân viên thành công.');
      loadEmployees(page, search, selectedPropertyId);
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string; data?: Record<string, string> } };
      };
      const fieldErrors = ax?.response?.data?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        setCreateFieldErrors(fieldErrors);
        setCreateError(ax?.response?.data?.message ?? 'Dữ liệu không hợp lệ.');
      } else {
        setCreateError(ax?.response?.data?.message ?? 'Không thể tạo nhân viên.');
      }
    } finally {
      setCreateSubmitting(false);
    }
  }

  function openEditModal(emp: EmployeeSummary) {
    setEditTarget(emp);
    setEditForm({ fullName: emp.fullName, phone: emp.phone ?? '' });
    setEditError(null);
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editTarget || !editForm.fullName.trim()) {
      setEditError('Họ tên là bắt buộc.');
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await updateEmployeeV1(editTarget.id, selectedPropertyId, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || undefined,
      });
      setEditOpen(false);
      setSuccessMsg('Cập nhật nhân viên thành công.');
      loadEmployees(page, search, selectedPropertyId);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setEditError(ax?.response?.data?.message ?? 'Không thể cập nhật nhân viên.');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusSubmitting(true);
    try {
      await updateEmployeeStatusV1(statusTarget.id, selectedPropertyId, newStatus);
      setStatusTarget(null);
      setSuccessMsg(newStatus === 'SUSPENDED' ? 'Đã tạm khóa nhân viên.' : 'Đã kích hoạt nhân viên.');
      loadEmployees(page, search, selectedPropertyId);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message ?? 'Không thể cập nhật trạng thái.');
      setStatusTarget(null);
    } finally {
      setStatusSubmitting(false);
    }
  }

  const columns = [
    {
      header: 'Họ tên',
      accessor: (e: EmployeeSummary) => (
        <span className="font-semibold text-sm text-[#1E293B]">{e.fullName}</span>
      ),
    },
    {
      header: 'Email',
      accessor: (e: EmployeeSummary) => (
        <span className="text-sm text-[#334155]">{e.email}</span>
      ),
    },
    {
      header: 'Điện thoại',
      accessor: (e: EmployeeSummary) => (
        <span className="text-sm text-[#334155]">{e.phone || '—'}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (e: EmployeeSummary) => {
        const cfg = STATUS_VI[e.status] ?? { label: e.status, variant: 'neutral' as StatusVariant };
        return <StatusBadge status={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      header: 'Ngày gán',
      accessor: (e: EmployeeSummary) => (
        <span className="text-sm text-[#334155]">{formatDate(e.assignedAt ?? '')}</span>
      ),
    },
    {
      header: 'Thao tác',
      accessor: (e: EmployeeSummary) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm text-[#0F766E] hover:underline"
            onClick={() => openEditModal(e)}
          >
            Sửa
          </button>
          <span className="text-[#CBD5E1]">·</span>
          {(e.status === 'ACTIVE' || e.status === 'SUSPENDED') && (
            <button
              type="button"
              className={`text-sm hover:underline ${e.status === 'ACTIVE' ? 'text-[#DC2626]' : 'text-[#0F766E]'}`}
              onClick={() => setStatusTarget(e)}
            >
              {e.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="heading-md m-0">Quản lý nhân viên</h1>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={openAssignModal}>
              Gán nhân viên
            </button>
            <button type="button" className="btn-outline" onClick={openCreateModal}>
              Thêm nhân viên
            </button>
          </div>
        </div>

        {propError && <Alert variant="error" message={propError} />}
        {error && <Alert variant="error" message={error} closeable onClose={() => setError(null)} />}
        {successMsg && <Alert variant="success" message={successMsg} closeable onClose={() => setSuccessMsg(null)} />}

        {showEmptyAssigned && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
            <p className="text-[#64748B] m-0">Bạn chưa được gán homestay nào.</p>
          </div>
        )}

        {!showEmptyAssigned && (
          <>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="input-field flex-1 sm:max-w-xs"
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            disabled={propLoading}
          >
            <option value="">— Chọn homestay —</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="search"
            className="input-field flex-1"
            placeholder="Tìm theo tên, email, điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {selectedProperty && (
          <p className="text-sm text-[#64748B] m-0">
            {totalElements} nhân viên tại <strong>{selectedProperty.name}</strong>
          </p>
        )}

        {loading ? (
          <TableSkeleton />
        ) : !selectedPropertyId ? (
          <div className="text-center py-16 text-[#64748B]">
            Vui lòng chọn homestay để xem danh sách nhân viên.
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
            <p className="text-[#64748B] mb-4">Không tải được danh sách nhân viên.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => loadEmployees(page, search, selectedPropertyId)}
            >
              Thử lại
            </button>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
            <p className="text-[#64748B] mb-4">Chưa có nhân viên tại homestay này.</p>
            <button type="button" className="btn-primary" onClick={openAssignModal}>
              Gán nhân viên
            </button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={employees}
              keyExtractor={e => e.id}
            />
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
          </>
        )}
      </div>

      {/* Assign modal */}
      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Gán nhân viên"
        size="lg"
      >
        {assignError && <Alert variant="error" message={assignError} />}
        <input
          type="search"
          className="input-field w-full mb-4"
          placeholder="Tìm nhân viên chưa gán..."
          value={assignSearch}
          onChange={e => setAssignSearch(e.target.value)}
        />
        {unassignedLoading ? (
          <TableSkeleton />
        ) : assignError ? (
          <div className="text-center py-8">
            <p className="text-[#64748B] mb-4">Không tải được danh sách nhân viên chưa gán.</p>
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => loadUnassigned(assignSearch, selectedPropertyId)}
            >
              Thử lại
            </button>
          </div>
        ) : unassigned.length === 0 ? (
          <p className="text-center text-[#64748B] py-8">Không có nhân viên chưa gán.</p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9] max-h-80 overflow-y-auto">
            {unassigned.map(u => (
              <li key={u.id} className="flex items-center justify-between py-3 gap-4">
                <div>
                  <p className="font-semibold text-sm text-[#1E293B] m-0">{u.fullName}</p>
                  <p className="text-xs text-[#64748B] m-0 mt-0.5">{u.email}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary text-sm px-3 py-1.5"
                  disabled={assigningId === u.id}
                  onClick={() => handleAssign(u.id)}
                >
                  {assigningId === u.id ? 'Đang gán...' : 'Gán'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm nhân viên"
        actions={[
          { label: 'Hủy', onClick: () => setCreateOpen(false), variant: 'ghost' },
          { label: createSubmitting ? 'Đang lưu...' : 'Tạo', onClick: handleCreate, variant: 'primary' },
        ]}
      >
        {createError && <Alert variant="error" message={createError} />}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Họ tên *</label>
            <input
              className="input-field w-full"
              value={createForm.fullName}
              onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
            />
            {createFieldErrors.fullName && (
              <p className="text-sm text-[#DC2626] mt-1 m-0">{createFieldErrors.fullName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Email *</label>
            <input
              type="email"
              className="input-field w-full"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
            />
            {createFieldErrors.email && (
              <p className="text-sm text-[#DC2626] mt-1 m-0">{createFieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Điện thoại</label>
            <input
              className="input-field w-full"
              value={createForm.phone}
              onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
            />
            {createFieldErrors.phone && (
              <p className="text-sm text-[#DC2626] mt-1 m-0">{createFieldErrors.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Homestay</label>
            <input
              className="input-field w-full bg-[#F8FAFC]"
              value={selectedProperty?.name ?? ''}
              readOnly
            />
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Sửa thông tin nhân viên"
        actions={[
          { label: 'Hủy', onClick: () => setEditOpen(false), variant: 'ghost' },
          { label: editSubmitting ? 'Đang lưu...' : 'Lưu', onClick: handleEdit, variant: 'primary' },
        ]}
      >
        {editError && <Alert variant="error" message={editError} />}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Họ tên *</label>
            <input
              className="input-field w-full"
              value={editForm.fullName}
              onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Email</label>
            <input
              className="input-field w-full bg-[#F8FAFC]"
              value={editTarget?.email ?? ''}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Điện thoại</label>
            <input
              className="input-field w-full"
              value={editForm.phone}
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Status confirm */}
      <Modal
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.status === 'ACTIVE' ? 'Tạm khóa nhân viên' : 'Kích hoạt nhân viên'}
        actions={[
          { label: 'Hủy', onClick: () => setStatusTarget(null), variant: 'ghost' },
          {
            label: statusSubmitting ? 'Đang xử lý...' : 'Xác nhận',
            onClick: handleStatusConfirm,
            variant: 'primary',
          },
        ]}
      >
        <p className="text-[#334155] m-0">
          {statusTarget?.status === 'ACTIVE'
            ? `Bạn có chắc muốn tạm khóa "${statusTarget?.fullName}"? Nhân viên sẽ không thể đăng nhập.`
            : `Bạn có chắc muốn kích hoạt lại "${statusTarget?.fullName}"?`}
        </p>
      </Modal>
    </ManagerLayout>
  );
}
