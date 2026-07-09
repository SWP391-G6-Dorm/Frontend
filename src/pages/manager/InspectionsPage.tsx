import { useState, useEffect, useCallback } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import { Drawer, StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerInspectionsV1,
  type InspectionSummary,
} from '../../api/managerInspectionApi';
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
  { value: 'PENDING', label: 'Chờ kiểm tra' },
  { value: 'IN_PROGRESS', label: 'Đang kiểm tra' },
  { value: 'PASSED', label: 'Đạt' },
  { value: 'FAILED_WITH_DAMAGE', label: 'Không đạt' },
];

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

export default function InspectionsPage() {
  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<InspectionSummary | null>(null);

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

  const loadInspections = useCallback(() => {
    if (!selectedPropertyId) {
      setInspections([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchManagerInspectionsV1({
      propertyId: selectedPropertyId,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
      page: 0,
      size: 100,
    })
      .then(data => setInspections(data.content))
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax?.response?.status === 403) {
          setError('Bạn không có quyền xem homestay này.');
        } else {
          setError(ax?.response?.data?.message ?? 'Không thể tải danh sách kiểm tra phòng.');
        }
        setInspections([]);
      })
      .finally(() => setLoading(false));
  }, [selectedPropertyId, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const isEmpty = !loading && inspections.length === 0;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="heading-md m-0">Kiểm tra phòng</h1>
          <p className="text-sm text-[#64748B] mt-1 m-0">
            Theo dõi kết quả kiểm tra phòng trước khi Check-out theo homestay.
          </p>
        </div>

        {error && <Alert variant="error" message={error} closeable onClose={() => setError(null)} />}

        <div className="flex flex-wrap gap-3 items-end bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="min-w-[180px] flex-1 sm:max-w-xs">
            <label className="block text-sm font-medium text-[#334155] mb-1">Homestay</label>
            <select
              className="input-field w-full"
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
            <label className="block text-sm font-medium text-[#334155] mb-1">Tìm theo số phòng</label>
            <input
              type="text"
              className="input-field w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nhập số phòng..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  statusFilter === f.value
                    ? 'border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E] font-semibold'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!selectedPropertyId ? (
          <div className="text-center py-16 text-[#64748B]">
            Vui lòng chọn homestay để xem danh sách kiểm tra phòng.
          </div>
        ) : loading ? (
          <div className="h-64 bg-[#F1F5F9] rounded-xl animate-pulse" />
        ) : isEmpty ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0] text-[#64748B]">
            Không có bản ghi kiểm tra phòng phù hợp.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
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
                  {inspections.map(item => (
                    <tr
                      key={item.id}
                      className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer"
                      onClick={() => setDrawerItem(item)}
                    >
                      <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">
                        {item.roomNumber}
                      </td>
                      <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{shortId(item.bookingId)}</td>
                      <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                        {item.inspectorName || 'Chưa gán'}
                      </td>
                      <td className="px-4 py-3">{badge(item.status)}</td>
                      <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                        {formatDateTime(item.inspectedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-[#0F766E] hover:underline text-sm font-medium"
                          onClick={e => { e.stopPropagation(); setDrawerItem(item); }}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Drawer
        isOpen={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        title={drawerItem ? `Phòng ${drawerItem.roomNumber} — Kiểm tra` : ''}
      >
        {drawerItem && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Kết quả</span>
                {badge(drawerItem.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Booking</span>
                <span className="font-medium">{shortId(drawerItem.bookingId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Người kiểm tra</span>
                <span className="font-medium">{drawerItem.inspectorName || 'Chưa gán'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Tạo lúc</span>
                <span>{formatDateTime(drawerItem.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Kiểm tra lúc</span>
                <span>{formatDateTime(drawerItem.inspectedAt)}</span>
              </div>
              {drawerItem.inspectionDurationMinutes != null && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Thời lượng kiểm tra</span>
                  <span>{drawerItem.inspectionDurationMinutes} phút</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[#64748B] text-sm">Ghi chú kiểm tra</span>
              <p className="m-0 mt-1 text-[#334155] whitespace-pre-wrap">
                {drawerItem.note || 'Không có ghi chú.'}
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </ManagerLayout>
  );
}
