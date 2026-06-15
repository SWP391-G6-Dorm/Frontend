// ─── SCR-55: Complaint List ───────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { COMPLAINTS, Badge } from './_sharedAdminData';

export function ComplaintListPage() {
  const [filter, setFilter] = useState('ALL');
  const TABS = ['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
  const list = filter === 'ALL' ? COMPLAINTS : COMPLAINTS.filter(c => c.status === filter);

  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Complaint Management</h1>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>{tab.replace('_',' ')}</button>)}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Title</th><th>Booking</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id}>
                <td><span className="code-sm">{c.id}</span></td>
                <td style={{ fontWeight: 600 }}>{c.customer}</td>
                <td className="text-charcoal">{c.title}</td>
                <td><Link to={`/manager/bookings/${c.bookingId}`} className="text-primary" style={{ textDecoration: 'none' }}>{c.bookingId}</Link></td>
                <td><Badge s={c.status} /></td>
                <td className="text-charcoal">{new Date(c.createdAt).toLocaleDateString('en-US')}</td>
                <td><Link to={`/manager/complaints/${c.id}`} className="btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}
