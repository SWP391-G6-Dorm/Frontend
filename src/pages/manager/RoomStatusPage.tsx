import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import {
  fetchRoomById,
  updateRoomStatus,
  UpdateRoomStatusPayload,
  RoomDetail,
} from '../../api/roomsApi';

// ── Constants ──────────────────────────────────────────────────────────────────

// Only these two statuses can be set manually by Manager
const MANUAL_STATUSES = ['AVAILABLE', 'MAINTENANCE'] as const;
type ManualStatus = typeof MANUAL_STATUSES[number];

// These are auto-managed by the booking system — read-only display only
const AUTO_STATUSES = ['PENDING_DEPOSIT', 'RESERVED', 'OCCUPIED'] as const;

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: string; desc: string }> = {
  AVAILABLE:       { color: '#2b9a66', bg: '#F0FFF4', label: 'Available',        icon: '✅', desc: 'Room is ready for new bookings' },
  MAINTENANCE:     { color: '#6B7280', bg: '#F9FAFB', label: 'Maintenance',       icon: '🔧', desc: 'Under maintenance, cannot be booked' },
  PENDING_DEPOSIT: { color: '#F59E0B', bg: '#FFFBEB', label: 'Pending Deposit',   icon: '⏳', desc: 'Waiting for deposit payment' },
  RESERVED:        { color: '#2563EB', bg: '#EFF6FF', label: 'Reserved',          icon: '📋', desc: 'Booked and confirmed' },
  OCCUPIED:        { color: '#DC2626', bg: '#FEF2F2', label: 'Occupied',          icon: '🏠', desc: 'Guest is currently checked in' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status, large = false }: { status: string; large?: boolean }) {
  const meta = STATUS_META[status] ?? { color: '#6B7280', label: status, icon: '❓' };
  return (
    <span
      style={{
        background: meta.color,
        color: '#fff',
        borderRadius: 9999,
        padding: large ? '5px 16px' : '3px 10px',
        fontSize: large ? 14 : 12,
        fontWeight: 700,
        letterSpacing: 0.3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {meta.icon} {meta.label.toUpperCase()}
    </span>
  );
}

function LoadingSkeleton() {
  const bar = (w: string, h = 14) => (
    <div
      style={{
        width: w, height: h, borderRadius: 6,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 16, background: 'var(--surface-bone)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bar('60%')} {bar('40%')} {bar('30%', 24)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bar('100%', 72)} {bar('100%', 72)}
      </div>
    </div>
  );
}

// Info panel for status rules
function StatusRulesPanel({ currentStatus }: { currentStatus: string }) {
  const isAutoManaged = AUTO_STATUSES.includes(currentStatus as any);
  return (
    <div
      style={{
        background: 'var(--surface-bone)',
        border: '1px solid var(--hairline)',
        borderRadius: 12,
        padding: 24,
        position: 'sticky',
        top: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Status Rules
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔄</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Manual (Manager)</p>
            <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 2 }}>
              AVAILABLE ↔ MAINTENANCE
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚙️</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Auto (System)</p>
            <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 2 }}>
              PENDING_DEPOSIT · RESERVED · OCCUPIED
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--hairline)' }} />

      {isAutoManaged ? (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
            ⚠ This room is currently in a system-managed status. You can only switch it to
            <strong> AVAILABLE</strong> or <strong>MAINTENANCE</strong>.
          </p>
        </div>
      ) : (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
            💡 Setting to <strong>MAINTENANCE</strong> will prevent new bookings until you restore it to <strong>AVAILABLE</strong>.
          </p>
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', marginBottom: 2 }}>
          Room actions
        </p>
        <Link
          to={`/manager/rooms`}
          style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Back to room list
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RoomStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [room, setRoom]           = useState<RoomDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [selectedStatus, setSelectedStatus] = useState<ManualStatus>('AVAILABLE');
  const [note, setNote]                     = useState('');

  // ── Submission state ────────────────────────────────────────────────────────
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [noteError, setNoteError]   = useState('');

  // ── Load room ───────────────────────────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const r = await fetchRoomById(id);
      setRoom(r);
      // Pre-select current status if it's a manual one
      if (MANUAL_STATUSES.includes(r.status as ManualStatus)) {
        setSelectedStatus(r.status as ManualStatus);
      } else {
        // Auto-managed — default selector to AVAILABLE
        setSelectedStatus('AVAILABLE');
      }
    } catch (err: any) {
      setLoadError(err?.response?.data?.message ?? 'Failed to load room data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const isDirty     = room ? selectedStatus !== room.status : false;
  const noteRequired = selectedStatus === 'MAINTENANCE';
  const noteValid    = !noteRequired || note.trim().length > 0;
  const canSubmit    = isDirty && noteValid && !saving;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleSelectStatus(s: ManualStatus) {
    setSelectedStatus(s);
    setError('');
    setNoteError('');
  }

  function handleNoteChange(v: string) {
    setNote(v);
    if (v.trim()) setNoteError('');
  }

  async function handleSubmit() {
    setError('');
    setNoteError('');

    if (noteRequired && !note.trim()) {
      setNoteError('Please provide a reason when setting status to MAINTENANCE.');
      return;
    }
    if (!isDirty) return;

    setSaving(true);
    try {
      const payload: UpdateRoomStatusPayload = {
        status: selectedStatus,
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      const updated = await updateRoomStatus(id!, payload);
      setRoom(updated);
      setNote(''); // clear note after successful save
      setSuccess(`Status updated to ${STATUS_META[selectedStatus]?.label ?? selectedStatus}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render: Load error ────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <ManagerLayout>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 className="heading-sm" style={{ marginBottom: 8 }}>Failed to load room</h2>
          <p className="body-md" style={{ color: 'var(--charcoal)', marginBottom: 24 }}>{loadError}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={loadRoom}>Retry</button>
            <Link to="/manager/rooms" className="btn-ghost">Back to Rooms</Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  // ── Render: Main ─────────────────────────────────────────────────────────────

  return (
    <ManagerLayout>
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 body-sm" style={{ marginBottom: 20, color: 'var(--charcoal)' }}>
        <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
        <span style={{ color: 'var(--stone)' }}>›</span>
        <Link to={`/manager/rooms/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>
          {room?.roomNumber ?? id}
        </Link>
        <span style={{ color: 'var(--stone)' }}>›</span>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Status Management</span>
      </div>

      <h1 className="heading-md" style={{ marginBottom: 28 }}>
        Room Status: {room?.roomNumber}
      </h1>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Form card ── */}
        <div className="card" style={{ padding: 28, maxWidth: 560 }}>

          {/* Success banner */}
          {success && (
            <div
              style={{
                background: '#F0FFF4',
                border: '1px solid #BBF7D0',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>✅</span>
              <p style={{ fontSize: 14, color: '#166534', fontWeight: 500 }}>{success}</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
              <p style={{ fontSize: 14, color: '#991B1B', fontWeight: 500 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* ── Room Info header ── */}
              <div
                style={{
                  background: 'var(--surface-bone)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{room?.roomNumber}</p>
                  <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 2 }}>
                    {room?.propertyName} · Floor {room?.floorNumber}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--stone)', fontWeight: 600, marginBottom: 4 }}>CURRENT STATUS</p>
                  {room && <StatusBadge status={room.status} large />}
                </div>
              </div>

              {/* ── Selectable statuses ── */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12 }}>
                  Choose New Status
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MANUAL_STATUSES.map(s => {
                    const meta = STATUS_META[s];
                    const isSelected = selectedStatus === s;
                    return (
                      <label
                        key={s}
                        id={`scr44-status-${s.toLowerCase()}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 16px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          border: isSelected
                            ? `2px solid ${meta.color}`
                            : '1.5px solid var(--hairline)',
                          background: isSelected ? meta.bg : 'var(--surface-card)',
                          borderLeft: isSelected ? `4px solid ${meta.color}` : '1.5px solid var(--hairline)',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => handleSelectStatus(s)}
                      >
                        <input
                          type="radio"
                          name="roomStatus"
                          value={s}
                          checked={isSelected}
                          onChange={() => handleSelectStatus(s)}
                          style={{ accentColor: meta.color, width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: 20 }}>{meta.icon}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>
                            {meta.label.toUpperCase()}
                          </p>
                          <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 1 }}>
                            {meta.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* ── Auto-managed statuses (read-only) ── */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--stone)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Auto-managed by Booking System
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {AUTO_STATUSES.map(s => {
                    const meta = STATUS_META[s];
                    const isCurrent = room?.status === s;
                    return (
                      <div
                        key={s}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: isCurrent ? `1.5px solid ${meta.color}` : '1.5px dashed var(--hairline)',
                          background: isCurrent ? meta.bg : 'transparent',
                          opacity: isCurrent ? 1 : 0.55,
                          cursor: 'not-allowed',
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{meta.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: isCurrent ? meta.color : 'var(--charcoal)' }}>
                            {meta.label.toUpperCase()}
                            {isCurrent && <span style={{ marginLeft: 8, fontSize: 11, background: meta.color, color: '#fff', borderRadius: 9999, padding: '1px 8px' }}>CURRENT</span>}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--stone)', marginTop: 1 }}>{meta.desc}</p>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--stone)', flexShrink: 0 }}>🔒 Auto</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--stone)', marginTop: 8 }}>
                  These statuses are automatically managed by the booking system.
                </p>
              </div>

              {/* ── Notes textarea ── */}
              <div style={{ marginBottom: 24 }}>
                <label
                  className="form-label"
                  htmlFor="scr44-note"
                  style={{ color: noteRequired ? 'var(--ink)' : 'var(--stone)' }}
                >
                  Reason / Notes
                  {noteRequired && <span style={{ color: '#DC2626', marginLeft: 4 }}>*</span>}
                </label>
                <textarea
                  id="scr44-note"
                  className="textarea"
                  rows={3}
                  maxLength={500}
                  placeholder={
                    noteRequired
                      ? 'Required: e.g., AC unit repair scheduled, plumbing work…'
                      : 'Optional: add a reason for this status change'
                  }
                  value={note}
                  onChange={e => handleNoteChange(e.target.value)}
                  style={{
                    resize: 'vertical',
                    borderColor: noteError ? '#DC2626' : undefined,
                    boxShadow: noteError ? '0 0 0 3px rgba(220,38,38,0.12)' : undefined,
                    opacity: 1,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
                  {noteError ? (
                    <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>⚠ {noteError}</p>
                  ) : (
                    <p className="body-sm" style={{ color: 'var(--stone)' }}>
                      {noteRequired ? 'Required when setting MAINTENANCE' : 'Optional'}
                    </p>
                  )}
                  <p className="body-sm" style={{ color: 'var(--stone)' }}>{note.length} / 500</p>
                </div>
              </div>

              {/* ── Actions ── */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  id="scr44-submit"
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  title={!isDirty ? 'No changes' : !noteValid ? 'Note required for Maintenance' : undefined}
                >
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      Updating…
                    </span>
                  ) : (
                    '✓ Update Status'
                  )}
                </button>

                <Link to={`/manager/rooms/${id}`} className="btn-ghost">Cancel</Link>

                {!isDirty && !saving && (
                  <p className="body-sm" style={{ color: 'var(--stone)', fontSize: 12 }}>
                    No changes yet
                  </p>
                )}

                {isDirty && !saving && (
                  <p className="body-sm" style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>
                    ● Pending change: {STATUS_META[selectedStatus]?.label.toUpperCase()}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Status rules panel ── */}
        {room && <StatusRulesPanel currentStatus={room.status} />}
      </div>
    </ManagerLayout>
  );
}
