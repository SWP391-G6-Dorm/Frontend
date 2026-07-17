import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminProperties, createAdminProperty, updateAdminProperty,
  assignManagerToProperty,
  getManagers, getCustomers, updateAdminUser,
  getPaymentReconciliation,
  getEscalatedDamageReports, coApproveDamageReport,
  getAdminComplaints, resolveComplaint,
  getGlobalRevenueReport,
  getSystemSettings, updateSystemSettings,
  getAdminPromotions, createPromotion, updatePromotion, deletePromotion,
  type AdminUser, type AdminProperty, type AdminDamageReport,
  type AdminComplaint, type PaymentReconciliationItem,
  type Promotion, type SystemSettings, type MonthlyRevenue,
} from '../../api/adminApi';
import { DataTable, StatusBadge as UIStatusBadge } from '../../components/ui';
import { fmtVnd, fmtDate, extractApiError, Spinner, ErrorBanner, SuccessBanner, StatusBadge, Drawer, ConfirmModal, Pagination } from './_adminShared';

const MONTHS_VI = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

export function GlobalReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (y: number) => {
    setLoading(true); setError(null);
    try {
      const res = await getGlobalRevenueReport(y);
      if (res.success) setData(res.data?.monthlyData ?? []);
      else setError('Không tải được báo cáo.');
    } catch (err) { setError(extractApiError(err, 'Không tải được báo cáo.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(year); }, [load, year]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Global Reports</h1>
            <p className="body-sm text-charcoal">SCR-55 — Báo cáo doanh thu toàn hệ thống</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0 }} htmlFor="report-year">Năm:</label>
            <select id="report-year" className="input" style={{ width: 100 }}
              value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Summary KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: 'var(--primary)' }}>{fmtVnd(totalRevenue)}</div>
            <div className="kpi-label">Tổng doanh thu {year}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{data.length}</div>
            <div className="kpi-label">Tháng có dữ liệu</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{data.length > 0 ? fmtVnd(totalRevenue / data.length) : '—'}</div>
            <div className="kpi-label">Doanh thu TB/tháng</div>
          </div>
        </div>

        {error && <ErrorBanner msg={error} />}

        {/* Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Doanh thu theo tháng — {year}</h2>
          {loading ? <div style={{ height: 160 }}><Spinner /></div> : data.length === 0 ? (
            <p className="body-sm text-charcoal" style={{ textAlign: 'center', padding: 40 }}>Chưa có dữ liệu</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0 4px' }}>
              {data.map(d => {
                const pct = Math.round((d.revenue / maxRevenue) * 100);
                return (
                  <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--charcoal)', fontWeight: 600 }}>
                      {d.revenue > 0 ? `${(d.revenue/1_000_000).toFixed(0)}M` : ''}
                    </span>
                    <div
                      title={`${MONTHS_VI[d.month-1]}: ${fmtVnd(d.revenue)}`}
                      style={{ width: '100%', height: `${Math.max(pct, 4)}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', cursor: 'default' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--charcoal)' }}>{MONTHS_VI[d.month-1]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Table */}
        {!loading && data.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <DataTable
              columns={[
                { header: 'Tháng', accessor: (d: MonthlyRevenue) => `${MONTHS_VI[d.month-1]} ${year}` },
                { header: 'Doanh thu', accessor: (d: MonthlyRevenue) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmtVnd(d.revenue)}</span> },
                { header: '% Tổng', accessor: (d: MonthlyRevenue) => `${totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : 0}%` }
              ]}
              data={data}
              keyExtractor={(d) => d.month.toString()}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

