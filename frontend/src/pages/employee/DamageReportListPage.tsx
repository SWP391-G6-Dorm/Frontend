import { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeDamageReports, type DamageReport } from '../../api/employeeApi';
import { fmtVnd, fmtDate, extractErr, Spinner, ErrBanner, StatusBadge, FAB } from './employeeUtils';

// ── SCR-63: Damage Report List ─────────────────────────────────────────────────

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
