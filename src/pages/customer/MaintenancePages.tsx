// ─── MaintenancePages.tsx — SCR-27, 28, 29 ───────────────────────────────────
// Exports: MaintenanceListPage, CreateMaintenancePage, MaintenanceDetailPage

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const TICKETS = [
  { id: 'M001', bookingId: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', title: 'Air conditioner not working', description: 'The AC in the bedroom stopped cooling. Room temperature is very high.', status: 'IN_PROGRESS', createdAt: '2026-06-13T09:00:00', updatedAt: '2026-06-14T10:00:00' },
  { id: 'M002', bookingId: 'B003', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', title: 'Bathroom tap leaking', description: 'Hot water tap in bathroom is leaking continuously.', status: 'RESOLVED', createdAt: '2026-04-06T14:00:00', updatedAt: '2026-04-07T09:00:00' },
];

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    OPEN:        { cls: 'badge-warning', l: 'Open' },
    IN_PROGRESS: { cls: 'badge-info',    l: 'In Progress' },
    RESOLVED:    { cls: 'badge-success', l: 'Resolved' },
    CLOSED:      { cls: 'badge-neutral', l: 'Closed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

function StatusTimeline({ status }: { status: string }) {
  const steps = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
  const curIdx = steps.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((step, i) => {
        const done = i <= curIdx;
        const isLast = i === steps.length - 1;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{i+1}</span>}
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: done ? 'var(--primary)' : 'var(--charcoal)', whiteSpace: 'nowrap' }}>{step.replace('_',' ')}</p>
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, background: i < curIdx ? 'var(--primary)' : 'var(--stone)', margin: '0 4px', marginBottom: 16 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── SCR-27: List ──────────────────────────────────────────────────────────────
export function MaintenanceListPage() {
  const [filter, setFilter] = useState('ALL');
  const tabs = ['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'];

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
            {tab.replace('_',' ')}
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
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>
                    📍 {t.roomNumber} · {t.propertyName}
                  </p>
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

// ── SCR-28: Create ────────────────────────────────────────────────────────────
export function CreateMaintenancePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ bookingId: '', title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.bookingId.trim()) e.bookingId = 'Booking is required';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.description.length < 20) e.description = 'Please provide more detail (at least 20 characters)';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // TODO: await maintenanceApi.create(form);
      await new Promise(r => setTimeout(r, 800));
      navigate('/customer/maintenance');
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/maintenance" className="text-primary" style={{ textDecoration: 'none' }}>Maintenance</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>New Request</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 24 }}>Submit Maintenance Request</h1>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="bookingId">Related Booking</label>
            <select id="bookingId" className={`select ${errors.bookingId ? 'input-error' : ''}`}
              value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))}>
              <option value="">Select a booking</option>
              <option value="B001">B001 – Villa 01, Sunset Resort (Jul 10-13)</option>
              <option value="B002">B002 – Deluxe 05, Mountain View (Aug 1-3)</option>
            </select>
            {errors.bookingId && <p className="form-error">{errors.bookingId}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="title">Issue Title</label>
            <input id="title" className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g., Air conditioner not working"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label form-label-required" htmlFor="description">Description</label>
            <textarea id="description" className={`textarea ${errors.description ? 'input-error' : ''}`}
              rows={5} placeholder="Describe the issue in detail so we can help you quickly..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.description ? <p className="form-error">{errors.description}</p> : <span />}
              <span className="form-hint">{form.description.length} chars</span>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Our team will review your request and update the status within 24 hours.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link to="/customer/maintenance" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-29: Detail ────────────────────────────────────────────────────────────
export function MaintenanceDetailPage() {
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

        {/* Progress */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 className="heading-sm" style={{ marginBottom: 20 }}>Status Progress</h2>
          <StatusTimeline status={ticket.status} />
        </div>

        {/* Info */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 className="heading-sm" style={{ marginBottom: 16 }}>Issue Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <p className="body-sm text-charcoal">Room</p>
              <p style={{ fontWeight: 600 }}>{ticket.roomNumber}</p>
            </div>
            <div>
              <p className="body-sm text-charcoal">Property</p>
              <p style={{ fontWeight: 600 }}>{ticket.propertyName}</p>
            </div>
            <div>
              <p className="body-sm text-charcoal">Submitted</p>
              <p style={{ fontWeight: 600 }}>{new Date(ticket.createdAt).toLocaleString('en-US')}</p>
            </div>
            <div>
              <p className="body-sm text-charcoal">Last Updated</p>
              <p style={{ fontWeight: 600 }}>{new Date(ticket.updatedAt).toLocaleString('en-US')}</p>
            </div>
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
