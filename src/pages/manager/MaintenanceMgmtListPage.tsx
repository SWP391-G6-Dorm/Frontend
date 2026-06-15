// ─── SCR-57: Maintenance Management List ─────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { MGMT_TICKETS, Badge } from './_sharedAdminData';

export function MaintenanceMgmtListPage() {
  const [filter, setFilter] = useState('ALL');
  const TABS = ['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
  const list = filter === 'ALL' ? MGMT_TICKETS : MGMT_TICKETS.filter(t => t.status === filter);

  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Maintenance Management</h1>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>{tab.replace('_',' ')}</button>)}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Room</th><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(t => (
              <tr key={t.id}>
                <td><span className="code-sm">{t.id}</span></td>
                <td>{t.customer}</td>
                <td>{t.room} · {t.property}</td>
                <td className="text-charcoal">{t.title}</td>
                <td><Badge s={t.status} /></td>
                <td className="text-charcoal">{new Date(t.createdAt).toLocaleDateString('en-US')}</td>
                <td><Link to={`/manager/maintenance/${t.id}`} className="btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}
