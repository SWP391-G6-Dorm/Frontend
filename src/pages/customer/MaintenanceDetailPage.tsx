import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const TICKETS = [
  { id: 'M001', bookingId: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', title: 'Air conditioner not working', description: 'The AC in the bedroom stopped cooling. Room temperature is very high.', status: 'IN_PROGRESS', createdAt: '2026-06-13T09:00:00', updatedAt: '2026-06-14T10:00:00' },
  { id: 'M002', bookingId: 'B003', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', title: 'Bathroom tap leaking', description: 'Hot water tap in bathroom is leaking continuously.', status: 'RESOLVED', createdAt: '2026-04-06T14:00:00', updatedAt: '2026-04-07T09:00:00' },
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

function StatusTimeline({ status }: { status: string }) {
  const steps = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const curIdx = steps.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {steps.map((step, i) => {
        const done = i <= curIdx;
        const isLast = i === steps.length - 1;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{i + 1}</span>}
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: done ? 'var(--primary)' : 'var(--charcoal)', whiteSpace: 'nowrap' }}>{step.replace('_', ' ')}</p>
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, background: i < curIdx ? 'var(--primary)' : 'var(--stone)', margin: '0 4px', marginBottom: 16 }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const ticket = TICKETS.find(t => t.id === id) || TICKETS[0];

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/maintenance" className="text-primary" style={{ textDecoration: 'none' }}>Maintenance</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>#{ticket.id}</span>
        </div>

        <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="heading-md" style={{ marginBottom: 4 }}>{ticket.title}</h1>
            <p className="body-sm text-charcoal">Ticket #{ticket.id} · {ticket.roomNumber} · {ticket.propertyName}</p>
          </div>
          <StatusBadge s={ticket.status} />
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 className="heading-sm" style={{ marginBottom: 20 }}>Status Progress</h2>
          <StatusTimeline status={ticket.status} />
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 className="heading-sm" style={{ marginBottom: 16 }}>Issue Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><p className="body-sm text-charcoal">Room</p><p style={{ fontWeight: 600 }}>{ticket.roomNumber}</p></div>
            <div><p className="body-sm text-charcoal">Property</p><p style={{ fontWeight: 600 }}>{ticket.propertyName}</p></div>
            <div><p className="body-sm text-charcoal">Submitted</p><p style={{ fontWeight: 600 }}>{new Date(ticket.createdAt).toLocaleString('en-US')}</p></div>
            <div><p className="body-sm text-charcoal">Last Updated</p><p style={{ fontWeight: 600 }}>{new Date(ticket.updatedAt).toLocaleString('en-US')}</p></div>
          </div>
          <div>
            <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>Description</p>
            <p className="body-md" style={{ padding: '12px 16px', background: 'var(--surface-bone)', borderRadius: 8 }}>{ticket.description}</p>
          </div>
        </div>

        <Link to="/customer/maintenance" className="btn-outline">← Back to List</Link>
      </div>
    </CustomerLayout>
  );
}
