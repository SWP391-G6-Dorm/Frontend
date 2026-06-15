// ─── SCR-56: Complaint Detail ─────────────────────────────────────────────────
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { COMPLAINTS, Badge } from './_sharedAdminData';

export function ComplaintDetailPage() {
  const { id } = useParams();
  const c = COMPLAINTS.find(x => x.id === id) || COMPLAINTS[0];
  const [status, setStatus] = useState(c.status);
  const STATUSES = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/complaints" className="text-primary" style={{ textDecoration: 'none' }}>Complaints</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{c.id}</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>{c.title}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Complaint Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><p className="body-sm text-charcoal">Customer</p><p style={{ fontWeight: 600 }}>{c.customer}</p></div>
              <div><p className="body-sm text-charcoal">Booking</p><Link to={`/manager/bookings/${c.bookingId}`} className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>{c.bookingId}</Link></div>
              <div><p className="body-sm text-charcoal">Submitted</p><p style={{ fontWeight: 600 }}>{new Date(c.createdAt).toLocaleString('en-US')}</p></div>
            </div>
            <div>
              <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>Description</p>
              <p className="body-md" style={{ padding: '12px 16px', background: 'var(--surface-bone)', borderRadius: 8 }}>{c.description}</p>
            </div>
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
