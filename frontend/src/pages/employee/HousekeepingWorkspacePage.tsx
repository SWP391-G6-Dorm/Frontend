import { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getHousekeepingTasks, updateHousekeepingTaskStatus, type HousekeepingTask } from '../../api/employeeApi';
import { TOUCH, fmtDate, extractErr, Spinner, ErrBanner, StatusBadge } from './EmployeeShared';


export default function HousekeepingWorkspacePage() {
  function hkNext(status: HousekeepingTask['status']): 'IN_PROGRESS' | 'COMPLETED' | null {
    if (status === 'PENDING')     return 'IN_PROGRESS';
    if (status === 'IN_PROGRESS') return 'COMPLETED';
    return null;
  }

  function hkButtonLabel(status: HousekeepingTask['status']): string | null {
    if (status === 'PENDING')     return 'Bắt đầu dọn dẹp';
    if (status === 'IN_PROGRESS') return 'Hoàn thành';
    return null;
  }

  function hkButtonClass(status: HousekeepingTask['status']): string {
    if (status === 'IN_PROGRESS') return 'btn-primary';
    return 'btn-outline';
  }

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

