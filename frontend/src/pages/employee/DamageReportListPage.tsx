import { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeDamageReports, type DamageReport } from '../../api/employeeApi';
import { TOUCH, fmtVnd, fmtDate, extractErr, Spinner, ErrBanner, StatusBadge, Drawer, FAB } from './EmployeeShared';

// ── SCR-63: Damage Report List ─────────────────────────────────────────────────

export default function DamageReportListPage() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<DamageReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployeeDamageReports({ page: p, size: 15 });
      if (res.success) {
        setReports(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
        setPage(p);
      } else {
        setReports([]);
        setError('Không tải được danh sách.');
      }
    } catch (err) {
      setReports([]);
      setError(extractErr(err, 'Không tải được danh sách.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  function openDetail(r: DamageReport) {
    setSelected(r);
    setDrawerOpen(true);
  }

  function itemCount(r: DamageReport) {
    if (typeof r.itemCount === 'number') return r.itemCount;
    return r.items?.length ?? 0;
  }

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
              Báo cáo của tôi
            </h1>
            <p className="body-sm text-charcoal">Danh sách báo cáo hư hại đã ghi nhận</p>
          </div>
          <button
            type="button"
            onClick={() => load(page)}
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
            Tải lại
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 12 }}>
            <ErrBanner msg={error} />
            <button
              type="button"
              className="btn-outline"
              onClick={() => load(page)}
              style={{ ...TOUCH, marginTop: 4, borderRadius: 10, fontSize: 13 }}
            >
              Thử lại
            </button>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : error ? null : reports.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Chưa có báo cáo nào</p>
            <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>
              Nhấn + để tạo báo cáo hư hại mới.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="card"
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetail(r);
                    }
                  }}
                  style={{
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    borderLeft: r.requiresAdminEscalation ? '4px solid #c0392b' : '4px solid var(--hairline)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(220,38,38,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    ⚠️
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{r.roomName || 'Phòng'}</p>
                      <StatusBadge status={r.status} />
                      {r.requiresAdminEscalation && (
                        <span className="badge badge-error" style={{ fontSize: 11 }}>
                          &gt; 5M
                        </span>
                      )}
                    </div>
                    <p className="body-sm text-charcoal">
                      {itemCount(r)} mục • {fmtVnd(Number(r.totalCost) || 0)}
                    </p>
                    <p className="body-sm text-charcoal">{fmtDate(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => load(page - 1)}>
                  ‹ Trước
                </button>
                <span className="body-sm" style={{ alignSelf: 'center' }}>
                  Trang {page + 1}/{totalPages}
                </span>
                <button
                  className="btn-ghost btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => load(page + 1)}
                >
                  Sau ›
                </button>
              </div>
            )}
          </>
        )}

        <Drawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelected(null);
          }}
          title="Chi tiết báo cáo"
        >
          {selected && (
            <div>
              <div style={{ marginBottom: 16 }}>
                {[
                  { label: 'Phòng', value: selected.roomName || '—' },
                  { label: 'Trạng thái', value: <StatusBadge status={selected.status} /> },
                  { label: 'Ngày tạo', value: fmtDate(selected.createdAt) },
                  { label: 'Tổng ước tính', value: fmtVnd(Number(selected.totalCost) || 0) },
                  {
                    label: 'Leo thang Admin',
                    value: selected.requiresAdminEscalation ? 'Có (> 5M)' : 'Không',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span className="body-sm text-charcoal">{row.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {selected.note && (
                <div style={{ background: 'var(--surface-bone)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú</p>
                  <p className="body-sm">{selected.note}</p>
                </div>
              )}

              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Hạng mục hư hại ({itemCount(selected)})
              </p>
              {(selected.items?.length ?? 0) === 0 ? (
                <p className="body-sm text-charcoal">Không có chi tiết hạng mục.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.items.map((it, idx) => (
                    <div
                      key={`${it.name}-${idx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'var(--surface-bone)',
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{it.name || `Mục ${idx + 1}`}</span>
                      <span className="body-sm">{fmtVnd(Number(it.estimatedCost) || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Drawer>

        <FAB to="/employee/damage/create" label="Tạo báo cáo hư hại" />
      </div>
    </EmployeeLayout>
  );
}
