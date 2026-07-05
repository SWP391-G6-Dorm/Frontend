import { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const TICKETS = [
  { id: 'M001', bookingId: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', title: 'Air conditioner not working', status: 'IN_PROGRESS', createdAt: '2026-06-13T09:00:00', updatedAt: '2026-06-14T10:00:00' },
  { id: 'M002', bookingId: 'B003', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', title: 'Bathroom tap leaking', status: 'RESOLVED', createdAt: '2026-04-06T14:00:00', updatedAt: '2026-04-07T09:00:00' },
];

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  OPEN:        { cls: 'badge-warning', l: 'Open' },
  IN_PROGRESS: { cls: 'badge-info',    l: 'In Progress' },
  RESOLVED:    { cls: 'badge-success', l: 'Resolved' },
  CLOSED:      { cls: 'badge-neutral', l: 'Closed' },
};

function StatusBadge({ s }: { s: string }) {
  const v = STATUS_MAP[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function MaintenanceListPage() {
  const [filter, setFilter] = useState('ALL');
  const tabs = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const list = filter === 'ALL' ? TICKETS : TICKETS.filter(t => t.status === filter);

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Maintenance Requests</h1>
        <Link to="/customer/maintenance/create" className="btn-primary btn-sm">+ New Request</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No maintenance requests</h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Report an issue with your accommodation</p>
          <Link to="/customer/maintenance/create" className="btn-primary">Submit Request</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(t => (
            <div key={t.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</span>
                    <StatusBadge s={t.status} />
                  </div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>📍 {t.roomNumber} · {t.propertyName}</p>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>🎫 Booking: {t.bookingId}</p>
                  <p className="body-sm text-charcoal">
                    Submitted {new Date(t.createdAt).toLocaleDateString('en-US')} · Updated {new Date(t.updatedAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <Link to={`/customer/maintenance/${t.id}`} className="btn-outline btn-sm" style={{ flexShrink: 0 }}>View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}
