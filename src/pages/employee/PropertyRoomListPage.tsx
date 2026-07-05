import { useState, useEffect } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeRooms, type EmployeeRoom } from '../../api/employeeApi';
import { TOUCH, fmtVnd, extractErr, Spinner, ErrBanner, StatusBadge } from './employeeUtils';

// ── SCR-65: Property Room List ─────────────────────────────────────────────────

export default function PropertyRoomListPage() {
  const [rooms, setRooms] = useState<EmployeeRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const PAGE_SIZE = 20;

  // Initial load
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getEmployeeRooms({ page: 0, size: PAGE_SIZE });
        if (res.success) {
          setRooms(res.data.content);
          setCurrentPage(res.data.page);
          setTotalPages(res.data.totalPages);
        } else {
          setError('Không tải được danh sách phòng.');
        }
      } catch (err) {
        setError(extractErr(err, 'Không tải được danh sách phòng.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load more (append next page)
  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await getEmployeeRooms({ page: nextPage, size: PAGE_SIZE });
      if (res.success) {
        setRooms(prev => [...prev, ...res.data.content]);
        setCurrentPage(res.data.page);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      setError(extractErr(err, 'Không tải thêm được dữ liệu.'));
    } finally {
      setLoadingMore(false);
    }
  }

  // Client-side filter (search + status)
  const filtered = rooms.filter(r => {
    const matchSearch = !search ||
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.roomType || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const STATUS_FILTERS = [
    { v: '', label: 'Tất cả' },
    { v: 'AVAILABLE',        label: 'Available' },
    { v: 'OCCUPIED',         label: 'Occupied' },
    { v: 'RESERVED',         label: 'Reserved' },
    { v: 'PENDING_CLEANING', label: 'Cần dọn' },
    { v: 'MAINTENANCE',      label: 'Bảo trì' },
  ];

  // Background tint per status
  const ROOM_STATUS_BG: Record<string, string> = {
    AVAILABLE:          'rgba(16,185,129,0.07)',
    RESERVED:           'rgba(37,99,235,0.07)',
    OCCUPIED:           'rgba(37,99,235,0.10)',
    PENDING_DEPOSIT:    'rgba(245,158,11,0.07)',
    PENDING_CLEANING:   'rgba(245,158,11,0.10)',
    CLEANING_IN_PROGRESS:'rgba(245,158,11,0.07)',
    MAINTENANCE:        'rgba(239,68,68,0.08)',
    OUT_OF_SERVICE:     'rgba(100,116,139,0.08)',
  };

  // Room type chip colour
  const ROOM_TYPE_COLOR: Record<string, string> = {
    Studio:   '#6366f1',
    Standard: '#0ea5e9',
    Deluxe:   '#0f766e',
    Suite:    '#d97706',
    Villa:    '#7c3aed',
  };

  const hasMore = currentPage + 1 < totalPages;

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
            🚪 Room List
          </h1>
          <p className="body-sm text-charcoal">SCR-65 — {rooms.length} phòng đã tải</p>
        </div>

        {error && <ErrBanner msg={error} />}

        {/* Search bar */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
          <input
            id="room-search"
            className="input"
            style={{ ...TOUCH }}
            placeholder="🔍 Tìm theo số phòng hoặc loại phòng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              style={{
                ...TOUCH,
                padding: '0 14px',
                borderRadius: 20,
                border: `1.5px solid ${statusFilter === f.v ? 'var(--primary)' : 'var(--hairline)'}`,
                background: statusFilter === f.v ? 'rgba(15,118,110,0.10)' : 'var(--surface-card)',
                color: statusFilter === f.v ? 'var(--primary)' : 'var(--charcoal)',
                fontWeight: statusFilter === f.v ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Room list */}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>🔍</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Không tìm thấy phòng phù hợp</p>
            <p className="body-sm text-charcoal">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(room => {
              const typeColor = ROOM_TYPE_COLOR[room.roomType] ?? 'var(--primary)';
              return (
                <div
                  key={room.id}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    background: ROOM_STATUS_BG[room.status] ?? 'var(--surface-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {/* Room icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(15,118,110,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    🚪
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Room number + type chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                        Phòng {room.roomNumber}
                      </span>
                      {room.roomType && (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          background: `${typeColor}18`,
                          color: typeColor,
                          border: `1px solid ${typeColor}40`,
                          borderRadius: 6, padding: '2px 8px',
                        }}>
                          {room.roomType}
                        </span>
                      )}
                    </div>

                    {/* Meta row: capacity + price + floor */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span className="body-sm text-charcoal" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        👥 {room.capacity} khách
                      </span>
                      <span className="body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {fmtVnd(room.pricePerNight)}/đêm
                      </span>
                      {room.floorName && (
                        <span className="body-sm text-charcoal">
                          📍 {room.floorName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={room.status} />
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && !search && !statusFilter && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              id="room-list-load-more"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn-secondary"
              style={{ ...TOUCH, padding: '0 32px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}
            >
              {loadingMore ? 'Đang tải...' : `Tải thêm (trang ${currentPage + 2}/${totalPages})`}
            </button>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
