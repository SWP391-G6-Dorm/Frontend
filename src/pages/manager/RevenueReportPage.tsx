// ─── SCR-60: Revenue Report ───────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { REVENUE_DATA } from './_sharedAdminData';

export function RevenueReportPage() {
  const max = Math.max(...REVENUE_DATA.map(d => d.amount), 1);
  const total = REVENUE_DATA.reduce((s, d) => s + d.amount, 0);
  const avg = REVENUE_DATA.filter(d => d.amount > 0).length > 0 ? total / REVENUE_DATA.filter(d => d.amount > 0).length : 0;

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/reports" className="text-primary" style={{ textDecoration: 'none' }}>Reports</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Revenue</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Revenue Report — 2026</h1>

      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 28 }}>
        {[
          { l: 'Total YTD', v: `₫${(total / 1000000).toFixed(1)}M`, c: 'var(--primary)' },
          { l: 'Monthly Avg', v: `₫${(avg / 1000000).toFixed(1)}M`, c: 'var(--ink)' },
          { l: 'Best Month', v: 'June', c: 'var(--success)' },
        ].map(k => (
          <div key={k.l} className="kpi-card">
            <div className="kpi-value" style={{ color: k.c }}>{k.v}</div>
            <div className="kpi-label">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="card-lg" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="heading-sm" style={{ marginBottom: 24 }}>Monthly Revenue (₫M)</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 180 }}>
          {REVENUE_DATA.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {d.amount > 0 && (
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{(d.amount / 1000000).toFixed(0)}M</p>
              )}
              <div style={{ width: '100%', background: d.amount > 0 ? (i === 5 ? 'var(--primary)' : 'var(--stone)') : 'var(--hairline)', borderRadius: '5px 5px 0 0', height: d.amount > 0 ? `${(d.amount / max) * 140}px` : '4px', transition: 'height 0.3s' }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--charcoal)', marginTop: 6 }}>{d.month}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Month</th><th>Revenue</th><th>vs Avg</th></tr></thead>
          <tbody>
            {REVENUE_DATA.filter(d => d.amount > 0).map(d => (
              <tr key={d.month}>
                <td style={{ fontWeight: 600 }}>{d.month}</td>
                <td style={{ fontWeight: 700 }}>₫{d.amount.toLocaleString()}</td>
                <td>
                  <span className={`badge ${d.amount >= avg ? 'badge-success' : 'badge-error'}`}>{d.amount >= avg ? '▲' : '▼'} {Math.abs(((d.amount - avg) / avg) * 100).toFixed(0)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}
