// ─── SCR-53: Customer List ────────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { CUSTOMERS, Badge } from './_sharedAdminData';

export function CustomerListPage() {
  const [search, setSearch] = useState('');
  const list = CUSTOMERS.filter(c => c.fullName.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Customer Management</h1>
      </div>
      <div style={{ marginBottom: 16, maxWidth: 340 }}>
        <input className="input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Bookings</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id}>
                <td>
                  <p style={{ fontWeight: 700, fontSize: 13 }}>{c.fullName}</p>
                  <p style={{ fontSize: 11, color: 'var(--ash)' }}>{c.email}</p>
                </td>
                <td className="text-charcoal">{c.phone}</td>
                <td><span className="badge badge-neutral">{c.bookingCount} bookings</span></td>
                <td><Badge s={c.status} /></td>
                <td className="text-charcoal">{new Date(c.createdAt).toLocaleDateString('en-US')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link to={`/manager/customers/${c.id}`} className="btn-ghost btn-sm">View</Link>
                    {c.status === 'ACTIVE' ? (
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--error)' }}>Suspend</button>
                    ) : (
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--success)' }}>Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}
