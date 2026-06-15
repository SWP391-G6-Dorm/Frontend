// ─── SCR-58: Maintenance Management Detail ────────────────────────────────────
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { MGMT_TICKETS, Badge } from './_sharedAdminData';

export function MaintenanceMgmtDetailPage() {
  const { id } = useParams();
  const t = MGMT_TICKETS.find(x => x.id === id) || MGMT_TICKETS[0];
  const [status, setStatus] = useState(t.status);
  const STATUSES = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/maintenance" className="text-primary" style={{ textDecoration: 'none' }}>Maintenance</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{t.id}</span>
      </div>
      <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">{t.title}</h1>
        <Badge s={t.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Customer', v: t.customer },
              { l: 'Room', v: t.room },
              { l: 'Property', v: t.property },
              { l: 'Booking', v: t.bookingId },
              { l: 'Submitted', v: new Date(t.createdAt).toLocaleString('en-US') },
            ].map(row => (
              <div key={row.l}><p className="body-sm text-charcoal">{row.l}</p><p style={{ fontWeight: 600, marginTop: 2 }}>{row.v}</p></div>
            ))}
          </div>
        </div>
        <div className="card-lg" style={{ padding: 24 }}>
          <h3 className="heading-sm" style={{ marginBottom: 14 }}>Update Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {STATUSES.map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1.5px solid ${status === s ? 'var(--primary)' : 'var(--hairline)'}`, borderRadius: 10, cursor: 'pointer', background: status === s ? '#fff1ee' : 'transparent' }}>
                <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{s.replace('_',' ')}</span>
              </label>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>Update Status</button>
        </div>
      </div>
    </ManagerLayout>
  );
}
