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
import { TOUCH, fmtVnd, fmtDate, extractErr, Spinner, ErrBanner, OkBanner, StatusBadge, Drawer, FAB } from './EmployeeShared';


export default function DamageReportListPage() {
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
      <div className="animate-fade-in space-y-4">
        <div style={{ marginBottom: 8 }}>
          <h1 className="font-display text-[28px] font-bold text-[#1E293B]">Damage Reports</h1>
          <p className="body-sm text-charcoal mt-1">Báo cáo hư hại của bạn</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
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

