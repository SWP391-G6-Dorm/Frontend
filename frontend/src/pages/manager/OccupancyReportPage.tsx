// ─── SCR-61: Occupancy Report ─────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const PROPERTIES_OCC = [
  { name: 'Sunset Resort Đà Nẵng', totalRooms: 15, occupiedRooms: 11, rate: 73 },
  { name: 'Mountain View Homestay', totalRooms: 8, occupiedRooms: 5, rate: 63 },
  { name: 'Hội An Garden Villa', totalRooms: 12, occupiedRooms: 10, rate: 83 },
];

export function OccupancyReportPage() {
  const overall = Math.round(PROPERTIES_OCC.reduce((s, p) => s + p.rate, 0) / PROPERTIES_OCC.length);

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/reports" className="text-primary" style={{ textDecoration: 'none' }}>Reports</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Occupancy</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Occupancy Rate Report</h1>

      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 28 }}>
        <div className="kpi-card"><div className="kpi-value text-primary">{overall}%</div><div className="kpi-label">Overall Occupancy</div></div>
        <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--success)' }}>26</div><div className="kpi-label">Available Rooms</div></div>
        <div className="kpi-card"><div className="kpi-value">35</div><div className="kpi-label">Total Rooms</div></div>
      </div>

      <div className="card-lg" style={{ padding: 28 }}>
        <h2 className="heading-sm" style={{ marginBottom: 20 }}>Occupancy by Property</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PROPERTIES_OCC.map(p => (
            <div key={p.name}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontWeight: 700, color: p.rate >= 80 ? 'var(--success)' : p.rate >= 60 ? 'var(--warning)' : 'var(--error)' }}>{p.rate}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--hairline)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${p.rate}%`, height: '100%', background: p.rate >= 80 ? 'var(--success)' : p.rate >= 60 ? 'var(--warning)' : 'var(--error)', borderRadius: 6, transition: 'width 0.6s ease' }} />
              </div>
              <p className="body-sm text-charcoal" style={{ marginTop: 4 }}>{p.occupiedRooms}/{p.totalRooms} rooms occupied</p>
            </div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
}
