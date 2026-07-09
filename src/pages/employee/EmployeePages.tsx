/**
 * EmployeePages.tsx — SCR-59..65
 * Mobile-first Employee Portal: all touch targets ≥ 48px, optimistic UI for status updates.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import {
  getEmployeeKpis, type EmployeeKpis,
  getHousekeepingTasks, updateHousekeepingTaskStatus, type HousekeepingTask,
  getEmployeeMaintenanceTickets, updateMaintenanceTicketStatus, type MaintenanceTicket,
  getEmployeeInspections, passInspection, failInspection,
  type InspectionChecklist, type InspectionSummary,
  getEmployeeDamageReports, createDamageReport, type DamageReport, type DamageItem,
  getEmployeeRooms, type EmployeeRoom,
} from '../../api/employeeApi';

// ── Constants ──────────────────────────────────────────────────────────────────

const TOUCH = { minHeight: 48, minWidth: 48 }; // touch target constraint

const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  !s ? '—' : new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function extractErr(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--hairline)', borderTopColor: 'var(--primary)',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <div className="alert alert-error" style={{ marginBottom: 12 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </div>
  );
}

function OkBanner({ msg }: { msg: string }) {
  return (
    <div className="alert alert-success" style={{ marginBottom: 12 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
      </svg>
      {msg}
    </div>
  );
}

/** Status badge — colour by value */
function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { cls: string; label: string }> = {
    PENDING:         { cls: 'badge-warning', label: 'Pending' },
    IN_PROGRESS:     { cls: 'badge-info',    label: 'In Progress' },
    COMPLETED:       { cls: 'badge-success', label: 'Completed' },
    ASSIGNED:        { cls: 'badge-warning', label: 'Assigned' },
    RESOLVED:        { cls: 'badge-success', label: 'Resolved' },
    CLEAN:           { cls: 'badge-success', label: 'Clean' },
    AVAILABLE:       { cls: 'badge-success', label: 'Available' },
    OCCUPIED:        { cls: 'badge-info',    label: 'Occupied' },
    MAINTENANCE:     { cls: 'badge-warning', label: 'Maintenance' },
    PENDING_CLEANING:{ cls: 'badge-warning', label: 'Needs Cleaning' },
    PENDING_REVIEW:  { cls: 'badge-warning', label: 'Pending Review' },
    APPROVED:        { cls: 'badge-success', label: 'Approved' },
    ESCALATED:       { cls: 'badge-error',   label: 'Escalated' },
    REJECTED:        { cls: 'badge-error',   label: 'Rejected' },
    PASS:            { cls: 'badge-success', label: '✓ Pass' },
    FAIL:            { cls: 'badge-error',   label: '✗ Fail' },
  };
  const v = MAP[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${v.cls}`}>{v.label}</span>;
}

/** Slide-in drawer from right */
function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)', zIndex: 998,
        }} />
      )}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%',
        width: 420, maxWidth: '95vw',
        background: 'var(--surface-card)',
        boxShadow: '-6px 0 28px rgba(0,0,0,0.14)',
        zIndex: 999,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{title}</h3>
          <button onClick={onClose} style={{ ...TOUCH, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</div>
      </div>
    </>
  );
}

/** FAB (Floating Action Button) */
function FAB({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} style={{
      position: 'fixed', bottom: 24, right: 20,
      width: 56, height: 56, borderRadius: '50%',
      background: 'var(--primary)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, fontWeight: 700,
      boxShadow: '0 4px 18px rgba(15,118,110,0.45)',
      textDecoration: 'none', zIndex: 100,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      title={label}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; }}
    >
      +
    </Link>
  );
}

// ── SCR-59: Employee Dashboard ─────────────────────────────────────────────────

export function EmployeeDashboardPage() {
  const [kpis, setKpis] = useState<EmployeeKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const employeeName = sessionStorage.getItem('fullName') || 'Nhân viên';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getEmployeeKpis();
        if (!cancelled && res.success) setKpis(res.data);
      } catch { if (!cancelled) setError('Không tải được KPI. Vui lòng thử lại.'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const actionCards = [
    {
      to: '/employee/housekeeping', icon: '🧹', label: 'Housekeeping',
      count: kpis?.pendingHousekeeping, desc: 'Dọn phòng đang chờ',
      gradient: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
    },
    {
      to: '/employee/maintenance', icon: '🔧', label: 'Maintenance',
      count: kpis?.pendingMaintenance, desc: 'Yêu cầu sửa chữa',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #0891B2 100%)',
    },
    {
      to: '/employee/inspections', icon: '🔍', label: 'Inspections',
      count: null, desc: 'Kiểm tra phòng',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    },
  ];

  return (
    <EmployeeLayout>
      <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }} className="animate-fade-in">
        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <p className="body-sm text-charcoal" style={{ marginBottom: 2 }}>Xin chào 👋</p>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{employeeName}</h1>
          <p className="body-sm text-charcoal" style={{ marginTop: 4 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {error && <ErrBanner msg={error} />}

        {/* Action Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {actionCards.map((card) => (
            <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: card.gradient,
                borderRadius: 16, padding: '20px 22px',
                minHeight: 100,
                display: 'flex', alignItems: 'center', gap: 18,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              >
                <div style={{ fontSize: 36, flexShrink: 0 }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 4 }}>{card.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{card.desc}</p>
                </div>
                {card.count !== null && card.count !== undefined && (
                  <div style={{
                    background: 'rgba(255,255,255,0.22)', borderRadius: 12,
                    padding: '6px 14px', textAlign: 'center', flexShrink: 0,
                  }}>
                    {loading ? (
                      <div style={{ width: 24, height: 22, background: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
                    ) : (
                      <>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 24, color: '#fff', lineHeight: 1 }}>{card.count}</p>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>đang chờ</p>
                      </>
                    )}
                  </div>
                )}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { to: '/employee/damage', icon: '📋', label: 'My Damage Reports' },
            { to: '/employee/damage/create', icon: '📝', label: 'Báo cáo hư hại mới' },
            { to: '/employee/rooms', icon: '🚪', label: 'Danh sách phòng' },
          ].map(link => (
            <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface-card)', borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 10, minHeight: 56,
                border: '1px solid var(--hairline)', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hairline)'; }}
              >
                <span style={{ fontSize: 20 }}>{link.icon}</span>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-60: Housekeeping Workspace ─────────────────────────────────────────────

/** Next status in housekeeping flow */
function hkNext(status: HousekeepingTask['status']): 'IN_PROGRESS' | 'COMPLETED' | null {
  if (status === 'PENDING')     return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return 'COMPLETED';
  return null;
}

function hkButtonLabel(status: HousekeepingTask['status']) {
  if (status === 'PENDING')     return '▶ Bắt đầu';
  if (status === 'IN_PROGRESS') return '✓ Hoàn thành';
  return null;
}

function hkButtonClass(status: HousekeepingTask['status']) {
  if (status === 'IN_PROGRESS') return 'btn-primary';
  return 'btn-outline';
}

export function HousekeepingWorkspacePage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await getHousekeepingTasks({ size: 50, status: statusFilter || undefined });
      if (res.success) setTasks(res.data.content);
      else setError('Không tải được danh sách.');
    } catch (err) { setError(extractErr(err, 'Không tải được danh sách.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusUpdate(task: HousekeepingTask) {
    const next = hkNext(task.status);
    if (!next || updating) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    setUpdating(task.id);
    try {
      await updateHousekeepingTaskStatus(task.id, next);
      showToast(next === 'COMPLETED' ? '✅ Đã hoàn thành!' : '▶ Đã bắt đầu!');
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      setError(extractErr(err, 'Cập nhật thất bại. Đã hoàn tác.'));
    } finally { setUpdating(null); }
  }

  const STATUS_FILTERS = [
    { v: '', label: 'Tất cả' },
    { v: 'PENDING', label: '⏳ Pending' },
    { v: 'IN_PROGRESS', label: '▶ In Progress' },
    { v: 'COMPLETED', label: '✅ Done' },
  ];

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>🧹 Housekeeping</h1>
            <p className="body-sm text-charcoal">SCR-60 — {tasks.length} tác vụ</p>
          </div>
          <button
            onClick={() => load(true)} disabled={refreshing}
            style={{ ...TOUCH, background: 'var(--surface-bone)', border: '1px solid var(--hairline)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {refreshing ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        {error && <ErrBanner msg={error} />}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)} style={{
              ...TOUCH, padding: '0 16px', borderRadius: 20,
              border: `1.5px solid ${statusFilter === f.v ? 'var(--primary)' : 'var(--hairline)'}`,
              background: statusFilter === f.v ? 'rgba(15,118,110,0.10)' : 'var(--surface-card)',
              color: statusFilter === f.v ? 'var(--primary)' : 'var(--charcoal)',
              fontWeight: statusFilter === f.v ? 700 : 400, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>{f.label}</button>
          ))}
        </div>

        {/* Task list */}
        {loading ? <Spinner /> : tasks.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Không có tác vụ nào!</p>
            <p className="body-sm text-charcoal">Tất cả phòng đã sạch.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(task => {
              const nextLabel = hkButtonLabel(task.status);
              const isUpdating = updating === task.id;
              return (
                <div key={task.id} className="card" style={{
                  padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
                  borderLeft: task.status === 'IN_PROGRESS' ? '4px solid var(--primary)' : task.status === 'COMPLETED' ? '4px solid #2b9a66' : '4px solid var(--hairline)',
                  opacity: task.status === 'COMPLETED' ? 0.65 : 1,
                  transition: 'opacity 0.2s, border-color 0.2s',
                }}>
                  {/* Room icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: task.status === 'IN_PROGRESS' ? 'rgba(15,118,110,0.10)' : 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    🚪
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>{task.roomName || task.roomNumber || 'Phòng'}</p>
                    {task.floorName && <p className="body-sm text-charcoal">{task.floorName}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <StatusBadge status={task.status} />
                      {task.assignedAt && <span className="body-sm text-charcoal">{fmtDate(task.assignedAt)}</span>}
                    </div>
                  </div>
                  {/* Action button */}
                  {nextLabel && (
                    <button
                      className={hkButtonClass(task.status)}
                      onClick={() => handleStatusUpdate(task)}
                      disabled={isUpdating}
                      style={{ ...TOUCH, padding: '0 16px', borderRadius: 10, flexShrink: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      {isUpdating ? '...' : nextLabel}
                    </button>
                  )}
                  {task.status === 'COMPLETED' && (
                    <div style={{ color: '#2b9a66', fontSize: 22, flexShrink: 0 }}>✓</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--ink)', color: '#fff', padding: '10px 20px',
            borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 2000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease',
          }}>
            {toastMsg}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-61: Maintenance Workspace ──────────────────────────────────────────────

function mxNext(status: MaintenanceTicket['status']): 'IN_PROGRESS' | 'RESOLVED' | null {
  if (status === 'ASSIGNED')    return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return 'RESOLVED';
  return null;
}

const ISSUE_TYPE_ICONS: Record<string, string> = {
  ELECTRICAL: '⚡', PLUMBING: '🔧', HVAC: '❄️', FURNITURE: '🪑',
  APPLIANCE: '📺', STRUCTURAL: '🏗️', OTHER: '🛠️',
};

export function MaintenanceWorkspacePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<MaintenanceTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [drawerErr, setDrawerErr] = useState<string | null>(null);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2400); };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getEmployeeMaintenanceTickets({ size: 50, status: statusFilter || undefined });
      if (res.success) setTickets(res.data.content);
      else setError('Không tải được danh sách.');
    } catch (err) { setError(extractErr(err, 'Không tải được danh sách.')); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusUpdate(ticket: MaintenanceTicket) {
    const next = mxNext(ticket.status);
    if (!next || updating) return;
    // Optimistic
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: next } : t));
    if (selected?.id === ticket.id) setSelected(s => s ? { ...s, status: next } : s);
    setUpdating(ticket.id); setDrawerErr(null);
    try {
      await updateMaintenanceTicketStatus(ticket.id, next);
      showToast(next === 'RESOLVED' ? '✅ Đã giải quyết!' : '▶ Đang xử lý!');
      if (next === 'RESOLVED') { setTimeout(() => setDrawerOpen(false), 600); }
    } catch (err) {
      // Rollback
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: ticket.status } : t));
      if (selected?.id === ticket.id) setSelected(s => s ? { ...s, status: ticket.status } : s);
      setDrawerErr(extractErr(err, 'Cập nhật thất bại.'));
    } finally { setUpdating(null); }
  }

  const STATUS_FILTERS = [
    { v: '', label: 'Tất cả' }, { v: 'ASSIGNED', label: '📋 Assigned' },
    { v: 'IN_PROGRESS', label: '▶ In Progress' }, { v: 'RESOLVED', label: '✅ Resolved' },
  ];

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>🔧 Maintenance</h1>
            <p className="body-sm text-charcoal">SCR-61 — {tickets.length} yêu cầu</p>
          </div>
          <button onClick={() => load()} style={{ ...TOUCH, background: 'var(--surface-bone)', border: '1px solid var(--hairline)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', gap: 6, fontSize: 13, color: 'var(--charcoal)', fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
        {error && <ErrBanner msg={error} />}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)} style={{
              ...TOUCH, padding: '0 14px', borderRadius: 20,
              border: `1.5px solid ${statusFilter === f.v ? 'var(--primary)' : 'var(--hairline)'}`,
              background: statusFilter === f.v ? 'rgba(15,118,110,0.10)' : 'var(--surface-card)',
              color: statusFilter === f.v ? 'var(--primary)' : 'var(--charcoal)',
              fontWeight: statusFilter === f.v ? 700 : 400, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>{f.label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : tickets.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Không có yêu cầu bảo trì!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tickets.map(ticket => {
              const next = mxNext(ticket.status);
              const icon = ISSUE_TYPE_ICONS[ticket.issueType] || '🛠️';
              return (
                <div key={ticket.id} className="card" style={{
                  padding: '16px 18px', cursor: 'pointer',
                  borderLeft: ticket.status === 'IN_PROGRESS' ? '4px solid #2563EB' : ticket.status === 'RESOLVED' ? '4px solid #2b9a66' : '4px solid var(--hairline)',
                  opacity: ticket.status === 'RESOLVED' ? 0.65 : 1,
                  transition: 'opacity 0.2s',
                }} onClick={() => { setSelected(ticket); setDrawerErr(null); setDrawerOpen(true); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{ticket.roomName}</p>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="body-sm text-charcoal" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.issueType} — {ticket.description}
                      </p>
                    </div>
                    {next && (
                      <button
                        className={next === 'RESOLVED' ? 'btn-primary' : 'btn-outline'}
                        onClick={e => { e.stopPropagation(); handleStatusUpdate(ticket); }}
                        disabled={updating === ticket.id}
                        style={{ ...TOUCH, padding: '0 14px', borderRadius: 10, flexShrink: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        {updating === ticket.id ? '...' : next === 'RESOLVED' ? '✓ Done' : '▶ Start'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drawer: Ticket Detail */}
        <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} title="Chi tiết yêu cầu">
          {selected && (
            <div>
              {drawerErr && <ErrBanner msg={drawerErr} />}
              <div style={{ marginBottom: 16 }}>
                {[
                  { label: 'Phòng', value: selected.roomName },
                  { label: 'Loại sự cố', value: `${ISSUE_TYPE_ICONS[selected.issueType] || '🛠️'} ${selected.issueType}` },
                  { label: 'Trạng thái', value: <StatusBadge status={selected.status} /> },
                  { label: 'Được giao', value: selected.assignedAt ? fmtDate(selected.assignedAt) : '—' },
                  { label: 'Giải quyết', value: selected.resolvedAt ? fmtDate(selected.resolvedAt) : '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--surface-bone)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Mô tả sự cố:</p>
                <p className="body-sm">{selected.description}</p>
              </div>
              {mxNext(selected.status) && (
                <button
                  className={mxNext(selected.status) === 'RESOLVED' ? 'btn-primary' : 'btn-outline'}
                  style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                  disabled={updating === selected.id}
                  onClick={() => handleStatusUpdate(selected)}
                >
                  {updating === selected.id ? 'Đang cập nhật...' : mxNext(selected.status) === 'RESOLVED' ? '✅ Đánh dấu Đã xử lý' : '▶ Bắt đầu xử lý'}
                </button>
              )}
            </div>
          )}
        </Drawer>

        {/* Toast */}
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: '#fff', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            {toastMsg}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-62: Room Inspection Hub ─────────────────────────────────────────────────

const CHECKLIST_ITEMS: { key: keyof InspectionChecklist; label: string; icon: string }[] = [
  { key: 'tv',       label: 'TV / Giải trí',    icon: '📺' },
  { key: 'minibar',  label: 'Minibar',           icon: '🍾' },
  { key: 'ac',       label: 'Điều hòa (AC)',     icon: '❄️' },
  { key: 'bathroom', label: 'Phòng tắm',         icon: '🚿' },
  { key: 'beds',     label: 'Giường / Ga gối',   icon: '🛏️' },
];

export function RoomInspectionHubPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [checklist, setChecklist] = useState<InspectionChecklist>({ tv: true, minibar: true, ac: true, bathroom: true, beds: true });
  const [result, setResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [notes, setNotes] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingList(true); setError(null);
    try {
      const res = await getEmployeeInspections({ size: 50 });
      if (res.success) {
        setInspections(res.data.content);
        setSelectedId(prev => {
          if (prev && res.data.content.some(i => i.id === prev)) return prev;
          return res.data.content[0]?.id ?? '';
        });
      } else setError('Không tải được danh sách kiểm tra.');
    } catch (err) { setError(extractErr(err, 'Không tải được danh sách kiểm tra.')); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleItem(key: keyof InspectionChecklist) {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    const anyFail = Object.values(checklist).some(v => !v);
    if (anyFail && result === 'PASS') setResult('FAIL');
  }, [checklist, result]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) { setFormErr('Vui lòng chọn phòng cần kiểm tra.'); return; }
    if (result === 'FAIL' && !notes.trim()) {
      setFormErr('Ghi chú bắt buộc khi FAIL.');
      return;
    }
    setFormErr(null); setError(null); setSubmitting(true);
    const selected = inspections.find(i => i.id === selectedId);
    try {
      const body = { notes: notes.trim() || undefined, checklist };
      const res = result === 'PASS'
        ? await passInspection(selectedId, body)
        : await failInspection(selectedId, { notes: notes.trim(), checklist });
      if (res.success) {
        if (result === 'FAIL') {
          navigate('/employee/damage/create', {
            state: { roomId: selected?.roomId, fromInspection: true },
          });
        } else {
          navigate('/employee/dashboard');
        }
      } else setError('Nộp kiểm tra thất bại.');
    } catch (err) { setError(extractErr(err, 'Nộp kiểm tra thất bại.')); }
    finally { setSubmitting(false); }
  }

  const passCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>🔍 Room Inspection</h1>
          <p className="body-sm text-charcoal">SCR-62 — Kiểm tra phòng trước Check-out</p>
        </div>
        {error && <ErrBanner msg={error} />}

        {loadingList ? <Spinner /> : inspections.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Không có phòng cần kiểm tra</p>
            <p className="body-sm text-charcoal">No rooms ready for inspection.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <label className="form-label form-label-required" htmlFor="inspection-pick">Chọn phòng cần kiểm tra</label>
              <select id="inspection-pick" className="input" style={{ ...TOUCH }}
                value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {inspections.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.roomName || i.roomNumber || 'Phòng'} — {i.status}
                  </option>
                ))}
              </select>
              {formErr && <p className="form-error">{formErr}</p>}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>📋 Checklist ({passCount}/{totalCount})</p>
                <div style={{ width: 80, height: 6, background: 'var(--hairline)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(passCount / totalCount) * 100}%`, height: '100%', background: passCount === totalCount ? '#2b9a66' : 'var(--primary)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0', borderBottom: '1px solid var(--hairline)',
                  cursor: 'pointer', ...TOUCH,
                }}>
                  <input type="checkbox" checked={checklist[item.key]} onChange={() => toggleItem(item.key)}
                    style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontWeight: checklist[item.key] ? 500 : 400, fontSize: 15, color: checklist[item.key] ? 'var(--ink)' : 'var(--charcoal)', textDecoration: checklist[item.key] ? 'none' : 'line-through', flex: 1 }}>
                    {item.label}
                  </span>
                  {checklist[item.key]
                    ? <span style={{ color: '#2b9a66', fontSize: 16, fontWeight: 700 }}>✓</span>
                    : <span style={{ color: '#dc2626', fontSize: 16 }}>✗</span>
                  }
                </label>
              ))}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 14 }}>Kết quả kiểm tra</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${result === 'PASS' ? '#2b9a66' : 'var(--hairline)'}`,
                  background: result === 'PASS' ? 'rgba(43,154,102,0.08)' : 'var(--surface-card)',
                  transition: 'all 0.15s', ...TOUCH,
                }}>
                  <input type="radio" name="result" value="PASS" checked={result === 'PASS'} onChange={() => setResult('PASS')} style={{ width: 18, height: 18, accentColor: '#2b9a66' }} />
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span style={{ fontWeight: 700, color: result === 'PASS' ? '#2b9a66' : 'var(--charcoal)', fontSize: 15 }}>PASS</span>
                </label>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${result === 'FAIL' ? '#dc2626' : 'var(--hairline)'}`,
                  background: result === 'FAIL' ? 'rgba(220,38,38,0.06)' : 'var(--surface-card)',
                  transition: 'all 0.15s', ...TOUCH,
                }}>
                  <input type="radio" name="result" value="FAIL" checked={result === 'FAIL'} onChange={() => setResult('FAIL')} style={{ width: 18, height: 18, accentColor: '#dc2626' }} />
                  <span style={{ fontSize: 20 }}>❌</span>
                  <span style={{ fontWeight: 700, color: result === 'FAIL' ? '#dc2626' : 'var(--charcoal)', fontSize: 15 }}>FAIL</span>
                </label>
              </div>
              {result === 'FAIL' && (
                <div className="alert alert-error" style={{ marginTop: 12, fontSize: 13 }}>
                  ⚠️ FAIL sẽ chuyển bạn đến tạo Damage Report.
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
              <label className={`form-label${result === 'FAIL' ? ' form-label-required' : ''}`} htmlFor="inspection-notes">
                Ghi chú {result === 'FAIL' ? '(bắt buộc)' : 'thêm'}
              </label>
              <textarea id="inspection-notes" className="textarea" rows={3}
                placeholder="Mô tả vấn đề nếu có..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}
              style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
              {submitting ? 'Đang nộp...' : result === 'PASS' ? '✅ Nộp — PASS' : '❌ Nộp — FAIL & Báo cáo'}
            </button>
          </form>
        )}
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-63: Damage Report List ─────────────────────────────────────────────────

export function DamageReportListPage() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async (p = 0) => {
    setLoading(true); setError(null);
    try {
      const res = await getEmployeeDamageReports({ page: p, size: 15 });
      if (res.success) { setReports(res.data.content); setTotalPages(res.data.totalPages); setPage(p); }
      else setError('Không tải được danh sách.');
    } catch (err) { setError(extractErr(err, 'Không tải được danh sách.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>📋 Damage Reports</h1>
          <p className="body-sm text-charcoal">SCR-63 — Báo cáo hư hại của bạn</p>
        </div>
        {error && <ErrBanner msg={error} />}
        {loading ? <Spinner /> : reports.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Chưa có báo cáo nào</p>
            <p className="body-sm text-charcoal" style={{ marginBottom: 20 }}>Nhấn + để tạo báo cáo hư hại mới.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {reports.map(r => (
                <div key={r.id} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚠️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{r.roomName}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="body-sm text-charcoal">{r.items.length} hư hại • {fmtVnd(r.totalCost)}</p>
                    <p className="body-sm text-charcoal">{fmtDate(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => load(page - 1)}>‹ Trước</button>
                <span className="body-sm" style={{ alignSelf: 'center' }}>Trang {page + 1}/{totalPages}</span>
                <button className="btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Sau ›</button>
              </div>
            )}
          </>
        )}
        {/* FAB */}
        <FAB to="/employee/damage/create" label="Tạo báo cáo hư hại" />
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-64: Create Damage Report ───────────────────────────────────────────────

interface DamageItemRow extends DamageItem {
  _key: string;
}

export function CreateDamageReportPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<EmployeeRoom[]>([]);
  const [roomId, setRoomId] = useState('');
  const [items, setItems] = useState<DamageItemRow[]>([
    { _key: crypto.randomUUID(), name: '', estimatedCost: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadRooms() {
      setLoadingRooms(true);
      try {
        const res = await getEmployeeRooms({ size: 100 });
        if (res.success) setRooms(res.data.content);
      } catch { /* silent */ }
      finally { setLoadingRooms(false); }
    }
    loadRooms();
  }, []);

  const totalCost = items.reduce((sum, i) => sum + (Number(i.estimatedCost) || 0), 0);

  function addItem() {
    setItems(prev => [...prev, { _key: crypto.randomUUID(), name: '', estimatedCost: 0 }]);
  }

  function removeItem(key: string) {
    if (items.length === 1) return;
    setItems(prev => prev.filter(i => i._key !== key));
  }

  function updateItem(key: string, field: 'name' | 'estimatedCost', value: string | number) {
    setItems(prev => prev.map(i => i._key === key ? { ...i, [field]: value } : i));
  }

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoPreviews(prev => [...prev, url]);
      // In real app: upload to server and get URL. Here we use object URL as placeholder.
      setPhotoUrls(prev => [...prev, url]);
    });
    e.target.value = '';
  }

  function removePhoto(idx: number) {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
    setPhotoUrls(prev => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!roomId) errs.roomId = 'Vui lòng chọn phòng';
    const hasEmpty = items.some(i => !i.name.trim());
    if (hasEmpty) errs.items = 'Tất cả tên hư hại không được để trống';
    const hasInvalidCost = items.some(i => Number(i.estimatedCost) <= 0);
    if (hasInvalidCost) errs.costs = 'Phí ước tính phải lớn hơn 0';
    return errs;
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({}); setShowSummary(true);
  }

  async function handleSubmit() {
    setError(null); setSubmitting(true);
    try {
      const res = await createDamageReport({
        roomId,
        items: items.map(i => ({ name: i.name.trim(), estimatedCost: Number(i.estimatedCost) })),
        attachments: photoUrls.map(url => ({ url, type: 'IMAGE' })),
        notes: notes.trim() || undefined,
      });
      if (res.success) { navigate('/employee/damage'); }
      else { setError('Tạo báo cáo thất bại.'); setShowSummary(false); }
    } catch (err) { setError(extractErr(err, 'Tạo báo cáo thất bại.')); setShowSummary(false); }
    finally { setSubmitting(false); }
  }

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 560, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 20 }}>
          <Link to="/employee/damage" className="body-sm text-primary" style={{ textDecoration: 'none' }}>← My Reports</Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginTop: 8, marginBottom: 2 }}>📝 Create Damage Report</h1>
          <p className="body-sm text-charcoal">SCR-64 — Ghi nhận hư hại</p>
        </div>
        {error && <ErrBanner msg={error} />}

        {/* Summary Preview */}
        {showSummary && (
          <div className="card" style={{ padding: 20, marginBottom: 16, border: '2px solid var(--primary)' }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--ink)' }}>📄 Xác nhận nộp báo cáo</p>
            <div style={{ marginBottom: 12 }}>
              {[
                { label: 'Phòng', value: rooms.find(r => r.id === roomId)?.name || roomId },
                { label: 'Số mục hư hại', value: `${items.length} mục` },
                { label: 'Tổng phí ước tính', value: fmtVnd(totalCost) },
                { label: 'Ảnh đính kèm', value: `${photoUrls.length} ảnh` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
                  <span className="body-sm text-charcoal">{r.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.value}</span>
                </div>
              ))}
            </div>
            {totalCost > 5_000_000 && (
              <div className="alert alert-error" style={{ marginBottom: 12, fontSize: 13 }}>
                ⚠️ Tổng phí &gt; {fmtVnd(5_000_000)} — báo cáo sẽ được escalate lên Admin sau khi nộp.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1, ...TOUCH, borderRadius: 12, fontWeight: 700 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang nộp...' : '✓ Xác nhận Nộp'}
              </button>
              <button className="btn-ghost" style={{ ...TOUCH, borderRadius: 12 }} onClick={() => setShowSummary(false)}>
                Sửa lại
              </button>
            </div>
          </div>
        )}

        {!showSummary && (
          <form onSubmit={handlePreview}>
            {/* Room picker */}
            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <label className="form-label form-label-required" htmlFor="damage-room">Phòng bị hư hại</label>
              {loadingRooms ? <div style={{ height: 44, background: 'var(--surface-bone)', borderRadius: 8 }} /> : (
                <select id="damage-room" className="input" style={{ ...TOUCH }}
                  value={roomId} onChange={e => setRoomId(e.target.value)}>
                  <option value="">— Chọn phòng —</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name || r.roomNumber}</option>
                  ))}
                </select>
              )}
              {formErrors.roomId && <p className="form-error">{formErrors.roomId}</p>}
            </div>

            {/* Damage Items */}
            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>🔨 Danh sách hư hại</p>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{fmtVnd(totalCost)}</p>
              </div>
              {(formErrors.items || formErrors.costs) && (
                <ErrBanner msg={formErrors.items || formErrors.costs} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item, idx) => (
                  <div key={item._key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      {idx === 0 && <label className="form-label" style={{ fontSize: 12 }}>Tên hư hại</label>}
                      <input className="input" style={{ ...TOUCH }}
                        placeholder="VD: TV bị vỡ"
                        value={item.name}
                        onChange={e => updateItem(item._key, 'name', e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      {idx === 0 && <label className="form-label" style={{ fontSize: 12 }}>Phí ước tính (VNĐ)</label>}
                      <input className="input" type="number" min={0} style={{ ...TOUCH }}
                        placeholder="0"
                        value={item.estimatedCost || ''}
                        onChange={e => updateItem(item._key, 'estimatedCost', Number(e.target.value))} />
                    </div>
                    <button type="button" onClick={() => removeItem(item._key)}
                      style={{ ...TOUCH, width: 44, background: 'none', border: '1px solid var(--hairline)', borderRadius: 8, cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, alignSelf: idx === 0 ? 'flex-end' : 'auto' }}
                      disabled={items.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="btn-ghost"
                style={{ marginTop: 12, width: '100%', ...TOUCH, borderRadius: 10, borderStyle: 'dashed', borderWidth: 1.5, fontSize: 14 }}>
                + Thêm mục hư hại
              </button>
            </div>

            {/* Photo Upload */}
            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>📷 Ảnh hư hại</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handlePhotoAdd}
                style={{ display: 'none' }}
                id="damage-photo-input"
              />
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', ...TOUCH, borderRadius: 10, background: 'var(--surface-bone)', border: '1.5px dashed var(--hairline)', cursor: 'pointer', fontSize: 14, color: 'var(--charcoal)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                📸 Chụp / Chọn ảnh
              </button>
              {photoPreviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                  {photoPreviews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={src} alt={`Ảnh ${idx + 1}`}
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--hairline)' }} />
                      <button type="button" onClick={() => removePhoto(idx)}
                        style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
              <label className="form-label" htmlFor="damage-notes">Ghi chú</label>
              <textarea id="damage-notes" className="textarea" rows={3}
                placeholder="Mô tả thêm về tình trạng hư hại..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {/* Total summary bar */}
            {totalCost > 0 && (
              <div style={{ background: totalCost > 5_000_000 ? 'rgba(220,38,38,0.08)' : 'rgba(15,118,110,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Tổng ước tính:</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: totalCost > 5_000_000 ? '#dc2626' : 'var(--primary)' }}>{fmtVnd(totalCost)}</span>
              </div>
            )}
            {totalCost > 5_000_000 && (
              <div className="alert alert-error" style={{ marginBottom: 14, fontSize: 13 }}>
                ⚠️ Tổng phí &gt; {fmtVnd(5_000_000)} — sẽ được escalate lên Admin để co-approve.
              </div>
            )}

            <button type="submit" className="btn-primary"
              style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
              Xem trước & Xác nhận →
            </button>
          </form>
        )}
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-65: Property Room List ─────────────────────────────────────────────────

export function PropertyRoomListPage() {
  const [rooms, setRooms] = useState<EmployeeRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getEmployeeRooms({ size: 100 });
        if (res.success) setRooms(res.data.content);
        else setError('Không tải được danh sách phòng.');
      } catch (err) { setError(extractErr(err, 'Không tải được danh sách phòng.')); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = rooms.filter(r => {
    const matchSearch = !search || (r.name || r.roomNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const STATUS_FILTERS = [
    { v: '', label: 'Tất cả' },
    { v: 'AVAILABLE', label: 'Available' },
    { v: 'OCCUPIED', label: 'Occupied' },
    { v: 'PENDING_CLEANING', label: 'Cần dọn' },
    { v: 'MAINTENANCE', label: 'Bảo trì' },
  ];

  const ROOM_STATUS_BG: Record<string, string> = {
    AVAILABLE: 'rgba(43,154,102,0.08)',
    CLEAN: 'rgba(43,154,102,0.08)',
    OCCUPIED: 'rgba(37,99,235,0.08)',
    PENDING_CLEANING: 'rgba(217,119,6,0.08)',
    MAINTENANCE: 'rgba(220,38,38,0.08)',
  };

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>🚪 Room List</h1>
          <p className="body-sm text-charcoal">SCR-65 — {rooms.length} phòng</p>
        </div>
        {error && <ErrBanner msg={error} />}

        {/* Search */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
          <input id="room-search" className="input" style={{ ...TOUCH }}
            placeholder="🔍 Tìm theo số phòng..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)} style={{
              ...TOUCH, padding: '0 14px', borderRadius: 20,
              border: `1.5px solid ${statusFilter === f.v ? 'var(--primary)' : 'var(--hairline)'}`,
              background: statusFilter === f.v ? 'rgba(15,118,110,0.10)' : 'var(--surface-card)',
              color: statusFilter === f.v ? 'var(--primary)' : 'var(--charcoal)',
              fontWeight: statusFilter === f.v ? 700 : 400, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>{f.label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Không tìm thấy phòng</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(room => (
              <div key={room.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, background: ROOM_STATUS_BG[room.status] || 'var(--surface-card)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  🚪
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                    {room.name || room.roomNumber || room.id.slice(0, 8)}
                  </p>
                  {room.floorName && <p className="body-sm text-charcoal">{room.floorName}</p>}
                </div>
                <StatusBadge status={room.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
