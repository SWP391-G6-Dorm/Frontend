import { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeMaintenanceTickets, updateMaintenanceTicketStatus, type MaintenanceTicket } from '../../api/employeeApi';
import { TOUCH, fmtDate, extractErr, Spinner, ErrBanner, StatusBadge, Drawer } from './EmployeeShared';

// ── SCR-61: Maintenance Workspace ──────────────────────────────────────────────

function mxNext(status: MaintenanceTicket['status']): 'IN_PROGRESS' | 'RESOLVED' | null {
  if (status === 'ASSIGNED') return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return 'RESOLVED';
  return null;
}

export default function MaintenanceWorkspacePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<MaintenanceTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [drawerErr, setDrawerErr] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployeeMaintenanceTickets({ size: 50, status: statusFilter || undefined });
      if (res.success) setTickets(res.data.content ?? []);
      else {
        setTickets([]);
        setError('Không tải được danh sách.');
      }
    } catch (err) {
      setTickets([]);
      setError(extractErr(err, 'Không tải được danh sách.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openTicket(ticket: MaintenanceTicket) {
    setSelected(ticket);
    setResolutionNote(ticket.resolutionNote ?? '');
    setDrawerErr(null);
    setDrawerOpen(true);
  }

  /** ASSIGNED → IN_PROGRESS (no note). RESOLVED must go through drawer with note. */
  async function handleStart(ticket: MaintenanceTicket) {
    if (ticket.status !== 'ASSIGNED' || updating) return;
    const prev = ticket.status;
    setTickets((list) => list.map((t) => (t.id === ticket.id ? { ...t, status: 'IN_PROGRESS' } : t)));
    if (selected?.id === ticket.id) setSelected((s) => (s ? { ...s, status: 'IN_PROGRESS' } : s));
    setUpdating(ticket.id);
    setDrawerErr(null);
    try {
      const res = await updateMaintenanceTicketStatus(ticket.id, 'IN_PROGRESS');
      if (res.success && res.data) {
        setTickets((list) => list.map((t) => (t.id === ticket.id ? { ...t, ...res.data } : t)));
        if (selected?.id === ticket.id) setSelected((s) => (s ? { ...s, ...res.data } : s));
      }
      showToast('▶ Đã bắt đầu xử lý');
    } catch (err) {
      setTickets((list) => list.map((t) => (t.id === ticket.id ? { ...t, status: prev } : t)));
      if (selected?.id === ticket.id) setSelected((s) => (s ? { ...s, status: prev } : s));
      const msg = extractErr(err, 'Cập nhật thất bại.');
      if (drawerOpen) setDrawerErr(msg);
      else setError(msg);
    } finally {
      setUpdating(null);
    }
  }

  async function handleResolve() {
    if (!selected || selected.status !== 'IN_PROGRESS' || updating) return;
    const note = resolutionNote.trim();
    if (!note) {
      setDrawerErr('Vui lòng ghi chú vật tư / cách xử lý trước khi đánh dấu đã xử lý.');
      return;
    }
    const prev = selected;
    setTickets((list) =>
      list.map((t) => (t.id === selected.id ? { ...t, status: 'RESOLVED', resolutionNote: note } : t)),
    );
    setSelected((s) => (s ? { ...s, status: 'RESOLVED', resolutionNote: note } : s));
    setUpdating(selected.id);
    setDrawerErr(null);
    try {
      const res = await updateMaintenanceTicketStatus(selected.id, 'RESOLVED', note);
      if (res.success && res.data) {
        setTickets((list) => list.map((t) => (t.id === selected.id ? { ...t, ...res.data } : t)));
        setSelected((s) => (s ? { ...s, ...res.data } : s));
      }
      showToast('Đã đánh dấu xử lý xong');
      setTimeout(() => {
        setDrawerOpen(false);
        setSelected(null);
      }, 600);
    } catch (err) {
      setTickets((list) => list.map((t) => (t.id === prev.id ? prev : t)));
      setSelected(prev);
      setDrawerErr(extractErr(err, 'Cập nhật thất bại.'));
    } finally {
      setUpdating(null);
    }
  }

  const STATUS_FILTERS = [
    { v: '', label: 'Tất cả' },
    { v: 'ASSIGNED', label: 'Được giao' },
    { v: 'IN_PROGRESS', label: 'Đang xử lý' },
    { v: 'RESOLVED', label: 'Đã xử lý' },
  ];

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
              Bảo trì
            </h1>
            <p className="body-sm text-charcoal">{tickets.length} yêu cầu được giao</p>
          </div>
          <button
            onClick={() => load()}
            style={{
              ...TOUCH,
              background: 'var(--surface-bone)',
              border: '1px solid var(--hairline)',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 14px',
              gap: 6,
              fontSize: 13,
              color: 'var(--charcoal)',
              fontWeight: 600,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Tải lại
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 12 }}>
            <ErrBanner msg={error} />
            <button type="button" className="btn-outline" onClick={() => load()} style={{ ...TOUCH, marginTop: 4, borderRadius: 10, fontSize: 13 }}>
              Thử lại
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTERS.map((f) => (
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

        {loading ? (
          <Spinner />
        ) : error ? null : tickets.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Không có yêu cầu bảo trì</p>
            <p className="body-sm text-charcoal">Hiện không có việc được giao cho bạn.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tickets.map((ticket) => {
              const next = mxNext(ticket.status);
              return (
                <div
                  key={ticket.id}
                  className="card"
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    borderLeft:
                      ticket.status === 'IN_PROGRESS'
                        ? '4px solid #2563EB'
                        : ticket.status === 'RESOLVED'
                          ? '4px solid #2b9a66'
                          : '4px solid var(--hairline)',
                    opacity: ticket.status === 'RESOLVED' ? 0.65 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onClick={() => openTicket(ticket)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'var(--surface-bone)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      🔧
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                          {ticket.roomName || 'Phòng'}
                        </p>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p
                        className="body-sm text-charcoal"
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {ticket.issueType}
                        {ticket.description ? ` — ${ticket.description}` : ''}
                      </p>
                    </div>
                    {next === 'IN_PROGRESS' && (
                      <button
                        className="btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart(ticket);
                        }}
                        disabled={updating === ticket.id}
                        style={{
                          ...TOUCH,
                          padding: '0 14px',
                          borderRadius: 10,
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {updating === ticket.id ? '...' : 'Bắt đầu'}
                      </button>
                    )}
                    {next === 'RESOLVED' && (
                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicket(ticket);
                        }}
                        style={{
                          ...TOUCH,
                          padding: '0 14px',
                          borderRadius: 10,
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Hoàn thành
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Drawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelected(null);
            setDrawerErr(null);
          }}
          title="Chi tiết yêu cầu"
        >
          {selected && (
            <div>
              {drawerErr && <ErrBanner msg={drawerErr} />}
              <div style={{ marginBottom: 16 }}>
                {[
                  { label: 'Phòng', value: selected.roomName || '—' },
                  { label: 'Sự cố', value: selected.issueType || '—' },
                  { label: 'Trạng thái', value: <StatusBadge status={selected.status} /> },
                  { label: 'Được giao', value: selected.assignedAt ? fmtDate(selected.assignedAt) : '—' },
                  { label: 'Hoàn tất', value: selected.resolvedAt ? fmtDate(selected.resolvedAt) : '—' },
                ].map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right', maxWidth: '60%' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface-bone)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Mô tả sự cố</p>
                <p className="body-sm">{selected.description || '—'}</p>
              </div>

              {selected.resolutionNote && selected.status !== 'IN_PROGRESS' && (
                <div style={{ background: 'var(--surface-bone)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú xử lý</p>
                  <p className="body-sm">{selected.resolutionNote}</p>
                </div>
              )}

              {selected.status === 'IN_PROGRESS' && (
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="mx-resolution-note" style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Ghi chú vật tư / cách xử lý <span style={{ color: 'var(--danger, #c0392b)' }}>*</span>
                  </label>
                  <textarea
                    id="mx-resolution-note"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Ví dụ: thay bóng đèn phòng tắm, kiểm tra lại…"
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: '1px solid var(--hairline)',
                      padding: '10px 12px',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {selected.status === 'ASSIGNED' && (
                <button
                  className="btn-outline"
                  style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                  disabled={updating === selected.id}
                  onClick={() => handleStart(selected)}
                >
                  {updating === selected.id ? 'Đang cập nhật...' : 'Bắt đầu xử lý'}
                </button>
              )}

              {selected.status === 'IN_PROGRESS' && (
                <button
                  className="btn-primary"
                  style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                  disabled={updating === selected.id}
                  onClick={() => handleResolve()}
                >
                  {updating === selected.id ? 'Đang cập nhật...' : 'Đánh dấu đã xử lý'}
                </button>
              )}
            </div>
          )}
        </Drawer>

        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--ink)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 600,
              zIndex: 2000,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            {toastMsg}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
