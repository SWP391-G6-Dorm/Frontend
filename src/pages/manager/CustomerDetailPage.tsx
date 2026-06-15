// ─── SCR-54: Customer Detail ──────────────────────────────────────────────────
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { CUSTOMERS, Badge } from './_sharedAdminData';

export function CustomerDetailPage() {
  const { id } = useParams();
  const c = CUSTOMERS.find(x => x.id === id) || CUSTOMERS[0];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/customers" className="text-primary" style={{ textDecoration: 'none' }}>Customers</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>{c.fullName}</span>
      </div>
      <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">{c.fullName}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge s={c.status} />
          {c.status === 'ACTIVE' ? (
            <button className="btn-danger btn-sm">Suspend Account</button>
          ) : (
            <button className="btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>Activate</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div className="card-lg" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { l: 'Full Name', v: c.fullName },
              { l: 'Email', v: c.email },
              { l: 'Phone', v: c.phone },
              { l: 'Joined', v: new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map(row => (
              <div key={row.l}>
                <p className="form-label">{row.l}</p>
                <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{row.v}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kpi-card"><span style={{ fontSize: 24 }}>📋</span><div className="kpi-value">{c.bookingCount}</div><div className="kpi-label">Total Bookings</div></div>
          <Link to={`/manager/bookings?customerId=${c.id}`} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>View Bookings</Link>
        </div>
      </div>
    </ManagerLayout>
  );
}
