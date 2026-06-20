import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { propertyApi, PropertySummary, PropertyStructure, FloorNode, RoomNode } from '../../api/propertyApi';
import { floorApi, CreateFloorPayload, UpdateFloorPayload } from '../../api/floorApi';

// ── Status helpers ────────────────────────────────────────────────────────────

type RoomStatus = RoomNode['status'];

const STATUS_CONFIG: Record<RoomStatus, { dot: string; label: string; badgeCls: string }> = {
  AVAILABLE:       { dot: '#2b9a66', label: 'Available',       badgeCls: 'badge-success' },
  PENDING_DEPOSIT: { dot: '#F59E0B', label: 'Pending Deposit', badgeCls: 'badge-warning' },
  RESERVED:        { dot: '#2563EB', label: 'Reserved',        badgeCls: 'badge-info'    },
  OCCUPIED:        { dot: '#6B7280', label: 'Occupied',        badgeCls: 'badge-neutral' },
  MAINTENANCE:     { dot: '#6B7280', label: 'Maintenance',     badgeCls: 'badge-neutral' },
};

function StatusDot({ status }: { status: RoomStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.AVAILABLE;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0,
      }}
      title={cfg.label}
    />
  );
}

function StatusBadge({ status }: { status: RoomStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.AVAILABLE;
  return <span className={`badge ${cfg.badgeCls}`}>{cfg.label}</span>;
}

// ── Selection types ───────────────────────────────────────────────────────────

type SelectedNode =
  | { type: 'floor'; data: FloorNode }
  | { type: 'room';  data: RoomNode; floor: FloorNode };

// ── Floor Modal ───────────────────────────────────────────────────────────────

interface FloorModalProps {
  mode: 'add' | 'edit';
  propertyId: string;
  initial?: { id: string; floorNumber: number; description: string };
  onClose: () => void;
  onSuccess: () => void;
}

function FloorModal({ mode, propertyId, initial, onClose, onSuccess }: FloorModalProps) {
  const [floorNumber, setFloorNumber] = useState(initial?.floorNumber?.toString() ?? '');
  const [description, setDescription]   = useState(initial?.description ?? '');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  async function handleSubmit() {
    if (!floorNumber || isNaN(Number(floorNumber)) || Number(floorNumber) < 1) {
      setError('Floor number is required and must be a positive integer.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (mode === 'add') {
        const payload: CreateFloorPayload = {
          propertyId,
          floorNumber: Number(floorNumber),
          description: description.trim() || undefined,
        };
        await floorApi.create(payload);
      } else if (initial) {
        const payload: UpdateFloorPayload = {
          floorNumber: Number(floorNumber),
          description: description.trim() || undefined,
        };
        await floorApi.update(initial.id, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'An error occurred. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="card-lg"
        style={{ padding: 28, width: 460, maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="heading-sm" style={{ marginBottom: 20 }}>
          {mode === 'add' ? '+ Add New Floor' : 'Edit Floor'}
        </h2>

        {error && (
          <div
            className="alert-error"
            style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8 }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label className="form-label form-label-required">Floor Number</label>
          <input
            type="number"
            min={1}
            className="input"
            placeholder="e.g. 1"
            value={floorNumber}
            onChange={e => setFloorNumber(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Description</label>
          <input
            className="input"
            placeholder="e.g. Sea View Floor"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving…' : mode === 'add' ? 'Add Floor' : 'Save Changes'}
          </button>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tree Panel ────────────────────────────────────────────────────────────────

interface TreePanelProps {
  structure: PropertyStructure;
  selected: SelectedNode | null;
  onSelectFloor: (floor: FloorNode) => void;
  onSelectRoom:  (room: RoomNode, floor: FloorNode) => void;
}

function TreePanel({ structure, selected, onSelectFloor, onSelectRoom }: TreePanelProps) {
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(() => {
    // Auto-expand all floors if ≤ 5, otherwise collapsed
    const s = new Set<string>();
    if (structure.floors.length <= 5) {
      structure.floors.forEach(f => s.add(f.id));
    }
    return s;
  });

  // Re-sync when structure changes (new property selected)
  useEffect(() => {
    const s = new Set<string>();
    if (structure.floors.length <= 5) {
      structure.floors.forEach(f => s.add(f.id));
    }
    setExpandedFloors(s);
  }, [structure.propertyId]);

  function toggleFloor(id: string) {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const isFloorSelected = (floor: FloorNode) =>
    selected?.type === 'floor' && selected.data.id === floor.id;

  const isRoomSelected = (room: RoomNode) =>
    selected?.type === 'room' && selected.data.id === room.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Property root node */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'var(--surface-bone)',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>🏢</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
          {structure.propertyName}
        </span>
      </div>

      {structure.floors.length === 0 ? (
        <p className="body-sm text-mute" style={{ padding: '12px 8px' }}>
          No floors yet. Add a floor to get started.
        </p>
      ) : (
        structure.floors.map(floor => {
          const expanded = expandedFloors.has(floor.id);
          const floorSelected = isFloorSelected(floor);

          return (
            <div key={floor.id} style={{ marginLeft: 12 }}>
              {/* Floor node */}
              <button
                onClick={() => { toggleFloor(floor.id); onSelectFloor(floor); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: floorSelected ? '#fff1ee' : 'transparent',
                  color: floorSelected ? 'var(--primary)' : 'var(--ink)',
                  fontWeight: floorSelected ? 700 : 600,
                  fontSize: 13,
                  marginBottom: 2,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!floorSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-bone)';
                }}
                onMouseLeave={e => {
                  if (!floorSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Chevron */}
                <span
                  style={{
                    fontSize: 10,
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: 'var(--charcoal)',
                    lineHeight: 1,
                    width: 12,
                    flexShrink: 0,
                  }}
                >
                  ▶
                </span>
                <span style={{ fontSize: 15 }}>🏗</span>
                <span style={{ flex: 1 }}>
                  Floor {floor.floorNumber}
                  {floor.description && (
                    <span style={{ fontWeight: 400, color: 'var(--charcoal)', marginLeft: 4 }}>
                      — {floor.description}
                    </span>
                  )}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: 10, padding: '2px 7px' }}>
                  {floor.rooms.length}
                </span>
              </button>

              {/* Room nodes */}
              {expanded && floor.rooms.length > 0 && (
                <div style={{ marginLeft: 28, marginBottom: 4 }}>
                  {floor.rooms.map(room => {
                    const roomSelected = isRoomSelected(room);
                    return (
                      <button
                        key={room.id}
                        onClick={() => onSelectRoom(room, floor)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          width: '100%',
                          textAlign: 'left',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          background: roomSelected ? '#fff1ee' : 'transparent',
                          color: roomSelected ? 'var(--primary)' : 'var(--body)',
                          fontWeight: roomSelected ? 700 : 400,
                          fontSize: 13,
                          marginBottom: 2,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!roomSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-bone)';
                        }}
                        onMouseLeave={e => {
                          if (!roomSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <StatusDot status={room.status} />
                        <span>🚪</span>
                        <span style={{ flex: 1 }}>{room.roomNumber}</span>
                        <span style={{ fontSize: 10, color: 'var(--charcoal)' }}>{room.roomType}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {expanded && floor.rooms.length === 0 && (
                <p className="body-sm text-mute" style={{ marginLeft: 40, marginBottom: 4, fontSize: 12 }}>
                  No rooms on this floor.
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  selected: SelectedNode | null;
  propertyId: string;
  onEditFloor: (floor: FloorNode) => void;
  onDeleteFloor: (floor: FloorNode) => void;
}

function DetailPanel({ selected, propertyId, onEditFloor, onDeleteFloor }: DetailPanelProps) {
  if (!selected) {
    return (
      <div
        className="card"
        style={{
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 320,
          gap: 12,
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 48 }}>🏗</span>
        <p className="heading-sm" style={{ color: 'var(--charcoal)' }}>
          Select a floor or room
        </p>
        <p className="body-sm text-mute">
          Click any node in the tree to view details and actions.
        </p>
      </div>
    );
  }

  if (selected.type === 'floor') {
    const floor = selected.data;
    return (
      <div className="card" style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: 'var(--surface-bone)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--ink)',
                flexShrink: 0,
              }}
            >
              F{floor.floorNumber}
            </div>
            <div>
              <h2 className="heading-md">Floor {floor.floorNumber}</h2>
              {floor.description && (
                <p className="body-sm text-charcoal">{floor.description}</p>
              )}
            </div>
          </div>
          <span className="badge badge-neutral">{floor.rooms.length} room{floor.rooms.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {(
            [
              { status: 'AVAILABLE',  label: 'Available' },
              { status: 'OCCUPIED',   label: 'Occupied'  },
              { status: 'MAINTENANCE', label: 'Maintenance' },
            ] as const
          ).map(({ status, label }) => {
            const count = floor.rooms.filter(r => r.status === status).length;
            const cfg   = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                style={{
                  background: 'var(--surface-bone)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: cfg.dot,
                    lineHeight: 1.2,
                  }}
                >
                  {count}
                </p>
                <p className="body-sm text-charcoal">{label}</p>
              </div>
            );
          })}
        </div>

        {/* Room list preview */}
        {floor.rooms.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="body-sm text-charcoal" style={{ marginBottom: 8, fontWeight: 600 }}>
              Rooms on this floor
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {floor.rooms.map(r => (
                <Link
                  key={r.id}
                  to={`/manager/rooms/${r.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--hairline)',
                    background: 'var(--surface-card)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-card)')}
                >
                  <StatusDot status={r.status} />
                  {r.roomNumber}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to={`/manager/rooms/add?propertyId=${propertyId}&floorId=${floor.id}`}
            className="btn-primary btn-sm"
          >
            + Add Room
          </Link>
          <Link to={`/manager/rooms?floorId=${floor.id}`} className="btn-outline btn-sm">
            View All Rooms
          </Link>
          <button className="btn-ghost btn-sm" onClick={() => onEditFloor(floor)}>
            Edit Floor
          </button>
          <button
            className="btn-ghost btn-sm"
            style={{ color: 'var(--error)' }}
            onClick={() => onDeleteFloor(floor)}
          >
            Delete Floor
          </button>
        </div>
      </div>
    );
  }

  // Room detail
  const { data: room, floor } = selected;
  const cfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.AVAILABLE;

  return (
    <div className="card" style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: `${cfg.dot}18`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🚪
          </div>
          <div>
            <h2 className="heading-md">{room.roomNumber}</h2>
            <p className="body-sm text-charcoal">
              Floor {floor.floorNumber}
              {floor.description && ` — ${floor.description}`}
            </p>
          </div>
        </div>
        <StatusBadge status={room.status} />
      </div>

      {/* Info grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Room Type',     value: room.roomType },
          { label: 'Status',        value: cfg.label },
          ...(room.pricePerNight !== undefined
            ? [{ label: 'Price / night', value: `₫ ${room.pricePerNight.toLocaleString('vi-VN')}` }]
            : []),
          ...(room.capacity !== undefined
            ? [{ label: 'Capacity', value: `${room.capacity} guest${room.capacity !== 1 ? 's' : ''}` }]
            : []),
        ].map(item => (
          <div
            key={item.label}
            style={{
              background: 'var(--surface-bone)',
              borderRadius: 10,
              padding: '12px 16px',
            }}
          >
            <p className="body-sm text-charcoal" style={{ marginBottom: 2 }}>{item.label}</p>
            <p className="body-md" style={{ fontWeight: 600 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to={`/manager/rooms/${room.id}`} className="btn-primary btn-sm">
          View Room Detail
        </Link>
        <Link to={`/manager/rooms/${room.id}/edit`} className="btn-outline btn-sm">
          Edit Room
        </Link>
        <Link to={`/manager/rooms/${room.id}/status`} className="btn-ghost btn-sm">
          Update Status
        </Link>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function TreeSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          style={{
            height: 36,
            borderRadius: 8,
            background: 'var(--surface-bone)',
            opacity: 1 - i * 0.15,
            animation: 'pulse 1.4s ease-in-out infinite',
            marginLeft: i % 2 === 0 ? 0 : 28,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StructureTreePage() {
  const [searchParams] = useSearchParams();
  const initPropertyId = searchParams.get('propertyId') ?? '';

  // ── State
  const [properties, setProperties]       = useState<PropertySummary[]>([]);
  const [propLoading, setPropLoading]      = useState(true);
  const [propError, setPropError]          = useState('');

  const [selectedPropId, setSelectedPropId] = useState(initPropertyId);

  const [structure, setStructure]     = useState<PropertyStructure | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError]     = useState('');

  const [selected, setSelected]       = useState<SelectedNode | null>(null);

  // Floor modal
  const [floorModal, setFloorModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    floor?: FloorNode;
  }>({ open: false, mode: 'add' });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<FloorNode | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState('');

  // ── Load property list ──────────────────────────────────────────────────────
  useEffect(() => {
    setPropLoading(true);
    propertyApi
      .getAll({ page: 0, size: 100 })
      .then(res => {
        const list = res.data.content ?? [];
        setProperties(list);
        if (!selectedPropId && list.length > 0) {
          setSelectedPropId(list[0].id);
        }
      })
      .catch(() => setPropError('Failed to load properties.'))
      .finally(() => setPropLoading(false));
  }, []);

  // ── Load structure tree ─────────────────────────────────────────────────────
  const loadStructure = useCallback((propId: string) => {
    if (!propId) return;
    setTreeLoading(true);
    setTreeError('');
    setSelected(null);
    propertyApi
      .getStructure(propId)
      .then(res => setStructure(res.data))
      .catch(() => setTreeError('Failed to load structure. Please try again.'))
      .finally(() => setTreeLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPropId) loadStructure(selectedPropId);
  }, [selectedPropId, loadStructure]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handlePropertyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedPropId(e.target.value);
  }

  function handleSelectFloor(floor: FloorNode) {
    setSelected({ type: 'floor', data: floor });
  }

  function handleSelectRoom(room: RoomNode, floor: FloorNode) {
    setSelected({ type: 'room', data: room, floor });
  }

  async function handleDeleteFloor(floor: FloorNode) {
    setDeleteTarget(floor);
    setDeleteError('');
  }

  async function confirmDeleteFloor() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await floorApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      setSelected(null);
      if (selectedPropId) loadStructure(selectedPropId);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to delete floor.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const currentProperty = properties.find(p => p.id === selectedPropId);

  return (
    <ManagerLayout>
      {/* Page header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
      >
        <div>
          <h1 className="display-md" style={{ marginBottom: 4 }}>
            Structure Management
          </h1>
          <p className="body-sm text-charcoal">
            Manage Property → Floor → Room hierarchy
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/manager/floors" className="btn-outline btn-sm">
            Manage Floors
          </Link>
          <Link to="/manager/properties" className="btn-ghost btn-sm">
            All Properties
          </Link>
        </div>
      </div>

      {/* Property selector */}
      {propError ? (
        <div className="alert-error" style={{ marginBottom: 20, padding: '10px 16px', borderRadius: 10 }}>
          {propError}
        </div>
      ) : (
        <div style={{ marginBottom: 24, maxWidth: 420 }}>
          <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
            Select Property
          </label>
          <select
            className="select"
            value={selectedPropId}
            onChange={handlePropertyChange}
            disabled={propLoading}
          >
            {propLoading ? (
              <option>Loading properties…</option>
            ) : properties.length === 0 ? (
              <option>No properties available</option>
            ) : (
              properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Main two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Tree Panel ── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 className="heading-sm">
              {currentProperty?.name ?? 'Structure'}
            </h3>
            {currentProperty && (
              <Link
                to={`/manager/properties/${currentProperty.id}`}
                className="btn-ghost btn-sm"
                style={{ fontSize: 12 }}
              >
                View Property
              </Link>
            )}
          </div>

          {treeLoading ? (
            <TreeSkeleton />
          ) : treeError ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p className="body-sm" style={{ color: 'var(--error)', marginBottom: 10 }}>
                {treeError}
              </p>
              <button
                className="btn-outline btn-sm"
                onClick={() => selectedPropId && loadStructure(selectedPropId)}
              >
                Retry
              </button>
            </div>
          ) : structure ? (
            <TreePanel
              structure={structure}
              selected={selected}
              onSelectFloor={handleSelectFloor}
              onSelectRoom={handleSelectRoom}
            />
          ) : null}

          {/* Add Floor */}
          {!treeLoading && !treeError && selectedPropId && (
            <button
              className="btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
              onClick={() => setFloorModal({ open: true, mode: 'add' })}
            >
              + Add Floor
            </button>
          )}
        </div>

        {/* ── Detail Panel ── */}
        <DetailPanel
          selected={selected}
          propertyId={selectedPropId}
          onEditFloor={floor => setFloorModal({ open: true, mode: 'edit', floor })}
          onDeleteFloor={handleDeleteFloor}
        />
      </div>

      {/* ── Floor Modal ── */}
      {floorModal.open && (
        <FloorModal
          mode={floorModal.mode}
          propertyId={selectedPropId}
          initial={
            floorModal.floor
              ? {
                  id: floorModal.floor.id,
                  floorNumber: floorModal.floor.floorNumber,
                  description: floorModal.floor.description ?? '',
                }
              : undefined
          }
          onClose={() => setFloorModal({ open: false, mode: 'add' })}
          onSuccess={() => selectedPropId && loadStructure(selectedPropId)}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="card-lg"
            style={{ padding: 28, width: 440, maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>
              Delete Floor {deleteTarget.floorNumber}?
            </h2>
            <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>
              This will permanently delete <strong>Floor {deleteTarget.floorNumber}</strong>
              {deleteTarget.description && ` (${deleteTarget.description})`}.
              This action cannot be undone.
            </p>

            {deleteTarget.rooms.length > 0 && (
              <div
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 16,
                }}
              >
                <p className="body-sm" style={{ color: '#92400E' }}>
                  ⚠️ This floor has {deleteTarget.rooms.length} room(s). You must remove all rooms
                  before deleting this floor.
                </p>
              </div>
            )}

            {deleteError && (
              <div
                className="alert-error"
                style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8 }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, background: 'var(--error)' }}
                onClick={confirmDeleteFloor}
                disabled={deleting || deleteTarget.rooms.length > 0}
              >
                {deleting ? 'Deleting…' : 'Delete Floor'}
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
