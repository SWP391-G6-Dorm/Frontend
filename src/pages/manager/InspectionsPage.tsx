import { useState, useEffect, useCallback, useMemo } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import { Drawer, StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerInspectionsV1,
  assignInspectionInspectorV1,
  type InspectionSummary,
} from '../../api/managerInspectionApi';
import { fetchManagerEmployeesV1, type EmployeeSummary } from '../../api/managerEmployeeApi';
import { managerApi } from '../../api/managerApi';
import type { AssignedProperty } from '../../api/reportApi';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING:            { label: 'Chờ kiểm tra',           variant: 'warning' },
  IN_PROGRESS:        { label: 'Đang kiểm tra',          variant: 'info' },
  PASSED:             { label: 'Đạt',                    variant: 'success' },
  FAILED_WITH_DAMAGE: { label: 'Không đạt – có hư hại',  variant: 'danger' },
};

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'UNASSIGNED', label: 'Chưa gán' },
  { value: 'PENDING', label: 'Chờ kiểm tra' },
  { value: 'IN_PROGRESS', label: 'Đang kiểm tra' },
  { value: 'PASSED', label: 'Đạt' },
  { value: 'FAILED_WITH_DAMAGE', label: 'Không đạt' },
] as const;

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string): string {
  return `BK-${id.slice(0, 8).toUpperCase()}`;
}

function badge(status: string) {
  const cfg = STATUS_VI[status] ?? { label: status, variant: 'neutral' as StatusVariant };
  return <StatusBadge status={cfg.label} variant={cfg.variant} />;
}

function canAssign(status: string): boolean {
  return status === 'PENDING' || status === 'IN_PROGRESS';
}

function needsAssign(item: InspectionSummary): boolean {
  return !item.assignedEmployee && canAssign(item.status);
}

function KpiChip({
  label,
  value,
  active,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  accent?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-left rounded-lg border px-3 py-2 min-w-[108px] transition-colors ${
        active
          ? 'border-[#0F766E] bg-[#CCFBF1]'
          : 'border-[#E2E8F0] bg-white hover:border-[#0F766E]/40'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <p className="text-[11px] text-[#64748B] m-0">{label}</p>
      <p className={`text-xl font-bold m-0 mt-0.5 ${accent ?? 'text-[#1E293B]'}`}>{value}</p>
    </Tag>
  );
}

export default function InspectionsPage() {
  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [allForKpis, setAllForKpis] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<InspectionSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    managerApi.getMyAssignedProperties()
      .then(res => {
        if (res.success && res.data) {
          setProperties(res.data);
          if (res.data.length > 0) {
            setSelectedPropertyId(prev => prev || res.data![0].id);
          }
        }
      })
      .catch(() => setError('Không thể tải danh sách homestay.'));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const loadInspections = useCallback(() => {
    if (!selectedPropertyId) {
      setInspections([]);
      setAllForKpis([]);
      return;
    }
    setLoading(true);
    setError(null);
    const unassignedOnly = statusFilter === 'UNASSIGNED';

    const listPromise = fetchManagerInspectionsV1({
      propertyId: selectedPropertyId,
      status: unassignedOnly ? undefined : (statusFilter || undefined),
      unassignedOnly: unassignedOnly || undefined,
      search: debouncedSearch || undefined,
      page: 0,
      size: 100,
    });

    // KPI snapshot (no status filter) so chips stay useful while filtering
    const kpiPromise = fetchManagerInspectionsV1({
      propertyId: selectedPropertyId,
      page: 0,
      size: 100,
    });

    Promise.all([listPromise, kpiPromise])
      .then(([listData, kpiData]) => {
        setInspections(listData.content);
        setAllForKpis(kpiData.content);
        setDrawerItem(prev => {
          if (!prev) return null;
          return listData.content.find(i => i.id === prev.id)
            ?? kpiData.content.find(i => i.id === prev.id)
            ?? prev;
        });
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax?.response?.status === 403) {
          setError('Bạn không có quyền xem homestay này.');
        } else {
          setError(ax?.response?.data?.message ?? 'Không thể tải danh sách kiểm tra phòng.');
        }
        setInspections([]);
        setAllForKpis([]);
      })
      .finally(() => setLoading(false));
  }, [selectedPropertyId, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  useEffect(() => {
    if (!drawerItem || !selectedPropertyId || !canAssign(drawerItem.status)) {
      setEmployees([]);
      setSelectedEmployeeId('');
      return;
    }
    setEmployeesLoading(true);
    fetchManagerEmployeesV1({ propertyId: selectedPropertyId, page: 0, size: 100 })
      .then(data => {
        setEmployees(data.content);
        setSelectedEmployeeId(drawerItem.assignedEmployee?.id ?? '');
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false));
  }, [drawerItem?.id, drawerItem?.status, drawerItem?.assignedEmployee?.id, selectedPropertyId]);

  const kpis = useMemo(() => {
    const unassigned = allForKpis.filter(needsAssign).length;
    const pending = allForKpis.filter(i => i.status === 'PENDING').length;
    const inProgress = allForKpis.filter(i => i.status === 'IN_PROGRESS').length;
    const failed = allForKpis.filter(i => i.status === 'FAILED_WITH_DAMAGE').length;
    return { total: allForKpis.length, unassigned, pending, inProgress, failed };
  }, [allForKpis]);

  async function handleAssign() {
    if (!drawerItem || !selectedEmployeeId) {
      setActionError('Vui lòng chọn nhân viên.');
      return;
    }
    setAssigning(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      await assignInspectionInspectorV1(drawerItem.id, selectedEmployeeId);
      const emp = employees.find(e => e.id === selectedEmployeeId);
      setSuccessMsg(
        emp
          ? `Đã gán ${emp.fullName} kiểm tra phòng ${drawerItem.room.roomNumber}.`
          : 'Đã gán inspector thành công.',
      );
      loadInspections();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setActionError(ax?.response?.data?.message ?? 'Không thể gán inspector.');
    } finally {
      setAssigning(false);
    }
  }

  function openDrawer(item: InspectionSummary) {
    setActionError(null);
    setDrawerItem(item);
  }

  const isEmpty = !loading && inspections.length === 0;
  const showEmptyAssigned = properties.length === 0;

  return (
    <ManagerLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="heading-md m-0">Kiểm tra phòng</h1>
            <p className="text-sm text-[#64748B] mt-1 m-0">
              Gán người kiểm tra trước Check-out — Pass/Fail do Employee thực hiện.
            </p>
          </div>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={loadInspections}
            disabled={loading || !selectedPropertyId}
          >
            Làm mới
          </button>
        </div>

        {error && <Alert variant="error" message={error} closeable onClose={() => setError(null)} />}
        {actionError && !drawerItem && (
          <Alert variant="error" message={actionError} closeable onClose={() => setActionError(null)} />
        )}
        {successMsg && (
          <Alert variant="success" message={successMsg} closeable onClose={() => setSuccessMsg(null)} />
        )}

        {showEmptyAssigned ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
            <p className="text-[#64748B] m-0">Bạn chưa được gán homestay nào.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 items-end bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
              <div className="min-w-[180px] flex-1 sm:max-w-xs">
                <label className="form-label" htmlFor="insp-property">Homestay</label>
                <select
                  id="insp-property"
                  className="input w-full"
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                >
                  <option value="">— Chọn homestay —</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[200px] flex-1 sm:max-w-xs">
                <label className="form-label" htmlFor="insp-search">Tìm số phòng</label>
                <input
                  id="insp-search"
                  type="search"
                  className="input w-full"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="VD: 101"
                  autoComplete="off"
                />
              </div>
            </div>

            {selectedPropertyId && !loading && (
              <div className="flex flex-wrap gap-2">
                <KpiChip
                  label="Tổng"
                  value={kpis.total}
                  active={statusFilter === ''}
                  onClick={() => setStatusFilter('')}
                />
                <KpiChip
                  label="Chưa gán"
                  value={kpis.unassigned}
                  accent="text-[#B45309]"
                  active={statusFilter === 'UNASSIGNED'}
                  onClick={() => setStatusFilter('UNASSIGNED')}
                />
                <KpiChip
                  label="Chờ kiểm tra"
                  value={kpis.pending}
                  accent="text-[#F59E0B]"
                  active={statusFilter === 'PENDING'}
                  onClick={() => setStatusFilter('PENDING')}
                />
                <KpiChip
                  label="Đang kiểm tra"
                  value={kpis.inProgress}
                  accent="text-[#3B82F6]"
                  active={statusFilter === 'IN_PROGRESS'}
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                />
                <KpiChip
                  label="Không đạt"
                  value={kpis.failed}
                  accent="text-[#EF4444]"
                  active={statusFilter === 'FAILED_WITH_DAMAGE'}
                  onClick={() => setStatusFilter('FAILED_WITH_DAMAGE')}
                />
              </div>
            )}

            {selectedPropertyId && kpis.unassigned > 0 && statusFilter !== 'UNASSIGNED' && (
              <button
                type="button"
                onClick={() => setStatusFilter('UNASSIGNED')}
                className="w-full text-left rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] px-4 py-3 hover:bg-[#FEF3C7] transition-colors"
              >
                <p className="m-0 text-sm font-semibold text-[#92400E]">
                  {kpis.unassigned} phòng chưa có người kiểm tra
                </p>
                <p className="m-0 mt-0.5 text-xs text-[#B45309]">
                  Bấm để lọc và gán inspector — Check-out sẽ bị chặn đến khi kiểm tra xong.
                </p>
              </button>
            )}

            <div className="flex gap-2 flex-wrap" role="group" aria-label="Lọc trạng thái">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded-md border min-h-[36px] ${
                    statusFilter === f.value
                      ? 'border-[#0F766E] bg-[#CCFBF1] text-[#0F766E] font-semibold'
                      : 'border-[#E2E8F0] text-[#64748B] bg-white'
                  }`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {!selectedPropertyId ? (
              <div className="text-center py-16 text-[#64748B]">
                Vui lòng chọn homestay để xem danh sách kiểm tra phòng.
              </div>
            ) : loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-20 bg-[#E2E8F0] rounded-xl" />
                <div className="h-48 bg-[#E2E8F0] rounded-xl" />
              </div>
            ) : isEmpty ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-[#E2E8F0] px-6">
                <p className="text-[#1E293B] font-medium m-0">
                  {statusFilter === 'UNASSIGNED'
                    ? 'Không còn phòng chưa gán'
                    : 'Không có bản ghi phù hợp'}
                </p>
                <p className="text-sm text-[#64748B] mt-2 m-0">
                  {statusFilter || debouncedSearch
                    ? 'Thử đổi bộ lọc hoặc xóa từ khóa tìm kiếm.'
                    : 'Inspection xuất hiện khi booking chuyển sang chờ kiểm tra trước Check-out.'}
                </p>
                {(statusFilter || debouncedSearch) && (
                  <button
                    type="button"
                    className="btn-outline btn-sm mt-4"
                    onClick={() => { setStatusFilter(''); setSearch(''); }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="grid gap-3 sm:hidden">
                  {inspections.map(item => {
                    const unassigned = needsAssign(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openDrawer(item)}
                        className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-colors ${
                          unassigned
                            ? 'border-[#F59E0B]/50 bg-[#FFFBEB]'
                            : 'border-[#E2E8F0] hover:border-[#0F766E]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-semibold text-[#1E293B]">
                            Phòng {item.room.roomNumber}
                          </span>
                          {badge(item.status)}
                        </div>
                        <p className="text-xs text-[#64748B] m-0 mb-1">{shortId(item.bookingId)}</p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          {unassigned ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#FEF3C7] text-[#B45309]">
                              Chưa gán
                            </span>
                          ) : (
                            <span className="text-sm text-[#64748B]">
                              {item.assignedEmployee?.fullName}
                            </span>
                          )}
                          <span className="text-sm font-medium text-[#0F766E]">
                            {unassigned ? 'Gán →' : canAssign(item.status) ? 'Đổi người →' : 'Xem →'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F8FAFC] text-[#64748B] text-left text-[12px] uppercase tracking-wide">
                          <th className="px-4 py-3 font-medium">Phòng</th>
                          <th className="px-4 py-3 font-medium">Booking</th>
                          <th className="px-4 py-3 font-medium">Người kiểm tra</th>
                          <th className="px-4 py-3 font-medium">Kết quả</th>
                          <th className="px-4 py-3 font-medium">Kiểm tra lúc</th>
                          <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.map(item => {
                          const unassigned = needsAssign(item);
                          return (
                            <tr
                              key={item.id}
                              className={`border-t border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer ${
                                unassigned ? 'bg-[#FFFBEB]/80' : ''
                              }`}
                              onClick={() => openDrawer(item)}
                            >
                              <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">
                                {item.room.roomNumber}
                              </td>
                              <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                                {shortId(item.bookingId)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {unassigned ? (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#FEF3C7] text-[#B45309]">
                                    Chưa gán
                                  </span>
                                ) : (
                                  <span className="text-[#64748B]">
                                    {item.assignedEmployee!.fullName}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">{badge(item.status)}</td>
                              <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                                {formatDateTime(item.inspectedAt)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  className={
                                    unassigned
                                      ? 'btn-primary btn-sm'
                                      : 'text-[#0F766E] hover:underline text-sm font-medium'
                                  }
                                  onClick={e => { e.stopPropagation(); openDrawer(item); }}
                                >
                                  {unassigned ? 'Gán ngay' : canAssign(item.status) ? 'Đổi người' : 'Xem'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Drawer
        isOpen={!!drawerItem}
        onClose={() => { setDrawerItem(null); setActionError(null); }}
        title={drawerItem ? `Phòng ${drawerItem.room.roomNumber} — Kiểm tra` : ''}
      >
        {drawerItem && (
          <div className="space-y-4">
            {needsAssign(drawerItem) && (
              <div className="rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB] px-3 py-2 text-sm text-[#92400E]">
                Chưa gán inspector — chọn nhân viên bên dưới để Check-out không bị kẹt.
              </div>
            )}

            {actionError && (
              <Alert variant="error" message={actionError} closeable onClose={() => setActionError(null)} />
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2 items-center">
                <span className="text-[#64748B]">Kết quả</span>
                {badge(drawerItem.status)}
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Booking</span>
                <span className="font-medium">{shortId(drawerItem.bookingId)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Đã gán</span>
                <span className="font-medium">
                  {drawerItem.assignedEmployee?.fullName ?? 'Chưa gán'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Người hoàn tất</span>
                <span className="font-medium">
                  {drawerItem.inspectedBy?.fullName ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Tạo lúc</span>
                <span>{formatDateTime(drawerItem.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Kiểm tra lúc</span>
                <span>{formatDateTime(drawerItem.inspectedAt)}</span>
              </div>
              {drawerItem.inspectionDurationMinutes != null && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#64748B]">Thời lượng</span>
                  <span>{drawerItem.inspectionDurationMinutes} phút</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[#64748B] text-sm">Ghi chú</span>
              <p className="m-0 mt-1 text-[#334155] whitespace-pre-wrap rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-sm">
                {drawerItem.note || 'Không có ghi chú.'}
              </p>
            </div>

            {canAssign(drawerItem.status) && (
              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <label className="form-label" htmlFor="insp-assign-employee">
                  {drawerItem.assignedEmployee ? 'Đổi người kiểm tra' : 'Gán người kiểm tra'}
                </label>
                <select
                  id="insp-assign-employee"
                  className="input w-full"
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  disabled={assigning || employeesLoading}
                >
                  <option value="">
                    {employeesLoading ? 'Đang tải nhân viên…' : '— Chọn nhân viên —'}
                  </option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}{emp.email ? ` · ${emp.email}` : ''}
                    </option>
                  ))}
                </select>
                {!employeesLoading && employees.length === 0 && (
                  <p className="text-xs text-[#B45309] m-0">
                    Chưa có employee ACTIVE trên homestay. Vào Quản lý nhân viên để gán trước.
                  </p>
                )}
                <button
                  type="button"
                  className="btn-primary w-full min-h-[44px]"
                  onClick={handleAssign}
                  disabled={assigning || employeesLoading || !selectedEmployeeId}
                >
                  {assigning
                    ? 'Đang gán…'
                    : drawerItem.assignedEmployee
                      ? 'Cập nhật người kiểm tra'
                      : 'Gán ngay'}
                </button>
                <p className="text-xs text-[#64748B] m-0">
                  Sau khi gán, Employee vào <strong>Kiểm tra phòng</strong> để Pass / Fail.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </ManagerLayout>
  );
}
