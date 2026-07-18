import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import { DataTable, StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerRoomsV1,
  ROOM_TYPES,
  type RoomListItem,
} from '../../api/roomsApi';
import { managerApi } from '../../api/managerApi';
import { floorApi, type FloorSummary } from '../../api/floorApi';
import type { AssignedProperty } from '../../api/reportApi';

// ── Status mapping (tiếng Việt) ───────────────────────────────────────────────

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  AVAILABLE:            { label: 'Trống',           variant: 'success' },
  PENDING_DEPOSIT:      { label: 'Chờ cọc',         variant: 'warning' },
  RESERVED:             { label: 'Đã đặt',          variant: 'info' },
  OCCUPIED:             { label: 'Đang ở',          variant: 'primary' },
  PENDING_CLEANING:     { label: 'Chờ dọn',         variant: 'warning' },
  CLEANING_IN_PROGRESS: { label: 'Đang dọn',        variant: 'info' },
  MAINTENANCE:          { label: 'Bảo trì',         variant: 'danger' },
  OUT_OF_SERVICE:       { label: 'Ngưng phục vụ',   variant: 'neutral' },
};

const ALL_STATUSES = Object.keys(STATUS_VI);

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

// ── Pagination ────────────────────────────────────────────────────────────────

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoomListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initPropertyId = searchParams.get('propertyId') ?? '';
  const initFloorId = searchParams.get('floorId') ?? '';

  const PAGE_SIZE = 10;

  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [propLoading, setPropLoading] = useState(true);
  const [propError, setPropError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedPropertyId, setPropertyId] = useState(initPropertyId);
  const [selectedFloorId, setFloorId] = useState(initFloorId);
  const [selectedStatus, setStatus] = useState('');
  const [selectedRoomType, setRoomType] = useState('');
  const [page, setPage] = useState(0);

  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [floorLoading, setFloorLoading] = useState(false);

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load assigned properties
  useEffect(() => {
    setPropLoading(true);
    managerApi.getMyAssignedProperties()
      .then(res => {
        if (res.success && res.data) {
          setProperties(res.data);
          const validInit = initPropertyId && res.data.some(p => p.id === initPropertyId);
          if (validInit) {
            setPropertyId(initPropertyId);
          } else if (!selectedPropertyId && res.data.length > 0) {
            setPropertyId(res.data[0].id);
          }
        }
      })
      .catch(() => setPropError('Không thể tải danh sách homestay.'))
      .finally(() => setPropLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load floors when property changes
  useEffect(() => {
    if (!selectedPropertyId) {
      setFloors([]);
      setFloorId('');
      return;
    }
    setFloorLoading(true);
    floorApi.getByProperty(selectedPropertyId)
      .then(res => {
        if (res.success) setFloors(res.data ?? []);
      })
      .catch(() => setFloors([]))
      .finally(() => setFloorLoading(false));
  }, [selectedPropertyId]);

  const loadRooms = useCallback((
    pg: number,
    srch: string,
    propId: string,
    flId: string,
    st: string,
    rt: string,
  ) => {
    setLoading(true);
    setError(null);
    fetchManagerRoomsV1({
      page: pg,
      size: PAGE_SIZE,
      search: srch || undefined,
      propertyId: propId || undefined,
      floorId: flId || undefined,
      status: st || undefined,
      roomType: rt || undefined,
    })
      .then(data => {
        setRooms(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax?.response?.status === 403) {
          setError('Bạn không có quyền xem homestay này.');
        } else {
          setError(ax?.response?.data?.message ?? 'Không thể tải danh sách phòng.');
        }
        setRooms([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Debounced filter changes (reset page)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      loadRooms(0, search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType, loadRooms]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    loadRooms(newPage, search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType);
  }

  const hasFilters = !!(search || selectedFloorId || selectedStatus || selectedRoomType);

  function handleClearFilters() {
    setSearch('');
    setFloorId('');
    setStatus('');
    setRoomType('');
    setPage(0);
  }

  const columns = [
    {
      header: 'Số phòng',
      accessor: (r: RoomListItem) => (
        <div className="flex items-center gap-2">
          {r.primaryImageUrl ? (
            <img
              src={r.primaryImageUrl}
              alt={r.roomNumber}
              className="w-9 h-9 rounded-md object-cover flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-md bg-[#F1F5F9] flex items-center justify-center text-sm flex-shrink-0">
              🛏
            </div>
          )}
          <span className="font-semibold text-[#1E293B]">{r.roomNumber}</span>
        </div>
      ),
    },
    {
      header: 'Loại',
      accessor: (r: RoomListItem) => (
        <span className="text-[#64748B]">{r.roomType || '—'}</span>
      ),
    },
    {
      header: 'Tầng',
      accessor: (r: RoomListItem) => (
        <span className="text-[#334155]">
          {r.floorNumber != null ? `Tầng ${r.floorNumber}` : '—'}
        </span>
      ),
    },
    {
      header: 'Giá/đêm',
      accessor: (r: RoomListItem) => (
        <span className="font-medium text-[#1E293B]">
          {r.pricePerNight != null ? formatVnd(r.pricePerNight) : '—'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (r: RoomListItem) => {
        const cfg = STATUS_VI[r.status] ?? { label: r.status, variant: 'neutral' as StatusVariant };
        return <StatusBadge status={cfg.label} variant={cfg.variant} />;
      },
    },
  ];

  const actions = [
    { label: 'Sửa', onClick: (r: RoomListItem) => navigate(`/manager/rooms/${r.id}/edit`) },
    { label: 'Thư viện ảnh', onClick: (r: RoomListItem) => navigate(`/manager/rooms/${r.id}/gallery`) },
    { label: 'Trạng thái', onClick: (r: RoomListItem) => navigate(`/manager/rooms/${r.id}/status`) },
  ];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-display text-[28px] font-bold text-[#1E293B]">
            Danh sách phòng
          </h1>
          {properties.length > 0 && (
            <button
              type="button"
              className="bg-[#0F766E] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#0D6B63]"
              onClick={() => navigate('/manager/rooms/add')}
            >
              Thêm phòng mới
            </button>
          )}
        </div>

        {propError && <Alert variant="error" message={propError} />}
        {error && <Alert variant="error" message={error} closeable onClose={() => setError(null)} />}

        {!propLoading && properties.length === 0 && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-10 text-center">
            <p className="text-[#64748B]">Bạn chưa được gán homestay nào.</p>
          </div>
        )}

        {properties.length > 0 && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-[#64748B] mb-1">Tìm kiếm</label>
                  <input
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm"
                    placeholder="Số phòng, loại phòng…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div className="min-w-[160px]">
                  <label className="block text-xs text-[#64748B] mb-1">Homestay</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedPropertyId}
                    onChange={e => { setPropertyId(e.target.value); setFloorId(''); }}
                    disabled={propLoading}
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[130px]">
                  <label className="block text-xs text-[#64748B] mb-1">Tầng</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedFloorId}
                    onChange={e => setFloorId(e.target.value)}
                    disabled={floorLoading || !selectedPropertyId}
                  >
                    <option value="">Tất cả tầng</option>
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>Tầng {f.floorNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[140px]">
                  <label className="block text-xs text-[#64748B] mb-1">Trạng thái</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedStatus}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_VI[s].label}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[130px]">
                  <label className="block text-xs text-[#64748B] mb-1">Loại phòng</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedRoomType}
                    onChange={e => setRoomType(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {ROOM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    className="text-sm text-[#0F766E] px-3 py-2"
                    onClick={handleClearFilters}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <TableSkeleton />
            ) : rooms.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center">
                <p className="text-[#64748B]">Không tìm thấy phòng phù hợp.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#64748B]">
                  {totalElements} phòng
                </p>
                <DataTable
                  columns={columns}
                  data={rooms}
                  keyExtractor={r => r.id}
                  actions={actions}
                />
                <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
