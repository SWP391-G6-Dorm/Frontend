import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import {
  fetchRoomsManager,
  deleteRoom,
  RoomListItem,
  ROOM_TYPES,
} from '../../api/roomsApi';
import { propertyApi, PropertySummary } from '../../api/propertyApi';
import { floorApi, FloorSummary } from '../../api/floorApi';
import { DataTable, StatusBadge as UIStatusBadge } from '../../components/ui';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  AVAILABLE:       { cls: 'badge-success', label: 'Available' },
  PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending' },
  RESERVED:        { cls: 'badge-info',    label: 'Reserved' },
  OCCUPIED:        { cls: 'badge-error',   label: 'Occupied' },
  MAINTENANCE:     { cls: 'badge-neutral', label: 'Maintenance' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <tbody>
      {[...Array(6)].map((_, i) => (
        <tr key={i}>
          {[...Array(8)].map((__, j) => (
            <td key={j}>
              <div
                style={{
                  height: 14,
                  borderRadius: 4,
                  background: 'var(--surface-bone)',
                  width: j === 7 ? 100 : '70%',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  opacity: 1 - i * 0.12,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  room: RoomListItem;
  deleting: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteModal({ room, deleting, error, onConfirm, onClose }: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={() => !deleting && onClose()}
    >
      <div
        className="card-lg"
        style={{ padding: 28, width: 440, maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="heading-sm" style={{ marginBottom: 12 }}>
          Delete Room {room.roomNumber}?
        </h2>
        <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>
          Permanently delete room <strong>{room.roomNumber}</strong> ({room.roomType}) from{' '}
          <strong>{room.propertyName}</strong>? This cannot be undone.
        </p>

        {room.status !== 'AVAILABLE' && (
          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <p className="body-sm" style={{ color: '#92400E' }}>
              Room status is <strong>{room.status}</strong>. Rooms with active bookings cannot be deleted.
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            style={{ flex: 1, background: 'var(--error)' }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete Room'}
          </button>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
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

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push('...');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages - 1);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
      <button className="btn-ghost btn-sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>←</button>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`dot-${idx}`} style={{ padding: '4px 8px', color: 'var(--stone)' }}>…</span>
        ) : (
          <button
            key={p}
            className={p === page ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
            onClick={() => onPageChange(p as number)}
          >
            {(p as number) + 1}
          </button>
        ),
      )}
      <button className="btn-ghost btn-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>→</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoomListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filter state
  const [search, setSearch]                 = useState('');
  const [selectedPropertyId, setPropertyId] = useState(searchParams.get('propertyId') ?? '');
  const [selectedFloorId, setFloorId]       = useState(searchParams.get('floorId') ?? '');
  const [selectedStatus, setStatus]         = useState('');
  const [selectedRoomType, setRoomType]     = useState('');
  const [page, setPage]                     = useState(0);
  const PAGE_SIZE = 20;

  // Data state
  const [rooms, setRooms]                   = useState<RoomListItem[]>([]);
  const [totalElements, setTotalElements]   = useState(0);
  const [totalPages, setTotalPages]         = useState(0);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  // Dropdown state
  const [properties, setProperties]         = useState<PropertySummary[]>([]);
  const [floors, setFloors]                 = useState<FloorSummary[]>([]);
  const [propLoading, setPropLoading]       = useState(true);
  const [floorLoading, setFloorLoading]     = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget]     = useState<RoomListItem | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [deleteError, setDeleteError]       = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load properties on mount
  useEffect(() => {
    propertyApi
      .getAll({ page: 0, size: 100 })
      .then(res => setProperties(res.data.content ?? []))
      .catch(() => {})
      .finally(() => setPropLoading(false));
  }, []);

  // Load floors when property changes
  useEffect(() => {
    setFloorId('');
    if (!selectedPropertyId) { setFloors([]); return; }
    setFloorLoading(true);
    floorApi
      .getByProperty(selectedPropertyId)
      .then(res => setFloors(res.data ?? []))
      .catch(() => setFloors([]))
      .finally(() => setFloorLoading(false));
  }, [selectedPropertyId]);

  // Core fetch
  const loadRooms = useCallback((
    pg: number, srch: string, propId: string, flId: string, st: string, rt: string,
  ) => {
    setLoading(true);
    setError('');
    fetchRoomsManager({
      page: pg, size: PAGE_SIZE,
      search: srch || undefined,
      propertyId: propId || undefined,
      floorId: flId || undefined,
      status: st || undefined,
      roomType: rt || undefined,
    })
      .then(data => {
        setRooms(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load rooms. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Debounce filter changes → reset to page 0
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      loadRooms(0, search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType]);

  // Page change (no debounce)
  useEffect(() => {
    loadRooms(page, search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleClearFilters() {
    setSearch(''); setPropertyId(''); setFloorId(''); setStatus(''); setRoomType('');
    setPage(0);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteRoom(deleteTarget.id);
      setDeleteTarget(null);
      loadRooms(page, search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to delete room.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = !!(search || selectedPropertyId || selectedFloorId || selectedStatus || selectedRoomType);
  const statusCounts = rooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
  }, {});

  const columns = [
    { header: 'Room', accessor: (r: RoomListItem) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {r.primaryImageUrl ? (
          <img src={r.primaryImageUrl} alt={r.roomNumber} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🛏</div>
        )}
        <span style={{ fontWeight: 700 }}>{r.roomNumber}</span>
      </div>
    ) },
    { header: 'Type', accessor: (r: RoomListItem) => <span className="text-charcoal">{r.roomType || '—'}</span> },
    { header: 'Property', accessor: (r: RoomListItem) => <span style={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{r.propertyName}</span> },
    { header: 'Floor', accessor: (r: RoomListItem) => r.floorNumber != null ? <span className="badge badge-neutral" style={{ fontSize: 11 }}>F{r.floorNumber}</span> : '—' },
    { header: 'Price / night', accessor: (r: RoomListItem) => <span style={{ fontWeight: 600 }}>{r.pricePerNight != null ? `₫${r.pricePerNight.toLocaleString('vi-VN')}` : '—'}</span> },
    { header: 'Cap.', accessor: (r: RoomListItem) => <span className="badge badge-neutral">{r.capacity ?? '—'}</span> },
    { header: 'Status', accessor: (r: RoomListItem) => <UIStatusBadge status={r.status} variant={r.status === 'AVAILABLE' ? 'success' : r.status === 'OCCUPIED' ? 'danger' : r.status === 'MAINTENANCE' ? 'neutral' : 'warning'} /> }
  ];

  const actions = [
    { label: 'View', onClick: (r: RoomListItem) => navigate(`/manager/rooms/${r.id}`) },
    { label: 'Edit', onClick: (r: RoomListItem) => navigate(`/manager/rooms/${r.id}/edit`) },
    { label: 'Status', onClick: (r: RoomListItem) => navigate(`/manager/rooms/${r.id}/status`) },
    { label: 'Delete', onClick: (r: RoomListItem) => { setDeleteTarget(r); setDeleteError(''); } }
  ];

  return (
    <ManagerLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 className="display-md" style={{ marginBottom: 4 }}>Room Management</h1>
          <p className="body-sm text-charcoal">Manage all rooms across your properties</p>
        </div>
        <Link to="/manager/rooms/add" className="btn-primary btn-sm">+ Add Room</Link>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 body-sm" style={{ marginBottom: 24, color: 'var(--charcoal)' }}>
        <Link to="/manager/structure" className="text-primary" style={{ textDecoration: 'none' }}>Structure</Link>
        <span style={{ color: 'var(--stone)' }}>/</span>
        <Link to="/manager/floors" className="text-primary" style={{ textDecoration: 'none' }}>Floors</Link>
        <span style={{ color: 'var(--stone)' }}>/</span>
        <span>Rooms</span>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Search</label>
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="input" style={{ paddingLeft: 32 }} placeholder="Room number, type…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Property */}
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Property</label>
            <select className="select" value={selectedPropertyId}
              onChange={e => setPropertyId(e.target.value)} disabled={propLoading}>
              <option value="">All Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Floor */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Floor</label>
            <select className="select" value={selectedFloorId}
              onChange={e => setFloorId(e.target.value)} disabled={!selectedPropertyId || floorLoading}>
              <option value="">All Floors</option>
              {floors.map(f => (
                <option key={f.id} value={f.id}>
                  F{f.floorNumber}{f.description ? ` — ${f.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Status</label>
            <select className="select" value={selectedStatus} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="PENDING_DEPOSIT">Pending Deposit</option>
              <option value="RESERVED">Reserved</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Room Type */}
          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Room Type</label>
            <select className="select" value={selectedRoomType} onChange={e => setRoomType(e.target.value)}>
              <option value="">All Types</option>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button className="btn-ghost btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 2 }}
              onClick={handleClearFilters}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {!loading && rooms.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <span className="body-sm text-charcoal">{totalElements} room{totalElements !== 1 ? 's' : ''} found</span>
          {Object.entries(statusCounts).map(([s, count]) => {
            const sd = STATUS_MAP[s] ?? { cls: 'badge-neutral', label: s };
            return <span key={s} className={`badge ${sd.cls}`} style={{ fontSize: 11 }}>{sd.label}: {count}</span>;
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button className="btn-outline btn-sm"
            onClick={() => loadRooms(page, search, selectedPropertyId, selectedFloorId, selectedStatus, selectedRoomType)}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ marginBottom: 20 }}>
        {loading && rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div>
        ) : (
          <DataTable 
            columns={columns}
            data={rooms}
            keyExtractor={(r) => r.id}
            actions={actions}
          />
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {deleteTarget && (
        <DeleteModal
          room={deleteTarget}
          deleting={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => { if (!deleting) { setDeleteTarget(null); setDeleteError(''); } }}
        />
      )}
    </ManagerLayout>
  );
}
