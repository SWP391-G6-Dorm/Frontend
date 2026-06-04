import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-30 Maintenance Ticket List · SCR-31 Create Ticket · SCR-32 Ticket Detail
// Entity: MaintenanceTicket
// Fields: id · tenant · room · title · description · status · createdAt

const MOCK_TICKETS = [
  { id: 'MT-042', title: 'Broken AC Unit',              description: 'The air conditioning in the room stopped working. It makes a loud noise and does not cool.', status: 'IN_PROGRESS', createdAt: '2025-10-20T10:00:00Z', room: 'A-301' },
  { id: 'MT-039', title: 'Leaking faucet in bathroom',  description: 'The bathroom sink faucet is dripping constantly even when fully closed.',                  status: 'OPEN',        createdAt: '2025-10-05T08:00:00Z', room: 'A-301' },
  { id: 'MT-035', title: 'Broken window latch',          description: 'The latch on the bedroom window is broken and cannot be locked properly.',                   status: 'RESOLVED',    createdAt: '2025-09-28T09:00:00Z', room: 'A-301' },
  { id: 'MT-030', title: 'Door handle loose',            description: 'The front door handle is very loose and difficult to operate.',                               status: 'CLOSED',      createdAt: '2025-09-10T14:00:00Z', room: 'A-301' },
];

const TICKET_TIMELINE: Record<string, { step: string; date: string | null; done: boolean; note: string }[]> = {
  'MT-042': [
    { step: 'Ticket Opened',    date: '2025-10-20 10:00', done: true,  note: 'Submitted by tenant.' },
    { step: 'Under Review',     date: '2025-10-21 09:00', done: true,  note: 'Landlord acknowledged the issue.' },
    { step: 'Technician Assigned', date: '2025-10-22 14:00', done: true,  note: 'Technician scheduled for Oct 30.' },
    { step: 'Resolved',         date: null,               done: false, note: 'Awaiting technician visit.' },
  ],
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { OPEN: 'badge-warning', IN_PROGRESS: 'badge-info', RESOLVED: 'badge-success', CLOSED: 'badge-neutral' };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status.replace('_', ' ')}</span>;
}
function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d > 0 ? `${d} days ago` : 'Today';
}

// ─── SCR-30: LIST ─────────────────────────────────────────────────────────────
export function MaintenanceListPage() {
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? MOCK_TICKETS : MOCK_TICKETS.filter(t => t.status === filter);

  return (
    <TenantLayout>
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Maintenance Tickets</h1>
          <Link to="/tenant/maintenance/create" className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14 }}>
            + New Ticket
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="btn-ghost rounded-full text-sm font-semibold px-4"
              style={{ height: 36, background: filter === f ? 'var(--surface-dark)' : 'transparent', color: filter === f ? 'var(--on-dark)' : 'var(--charcoal)', whiteSpace: 'nowrap' }}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <div className="text-5xl mb-3">🔧</div>
            <p className="heading-sm mb-1" style={{ color: 'var(--ink)' }}>No tickets found</p>
            <p className="body-md" style={{ color: 'var(--charcoal)' }}>No maintenance tickets with status "{filter}".</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(ticket => (
              <Link
                key={ticket.id}
                to={`/tenant/maintenance/${ticket.id}`}
                className="card flex items-center justify-between p-5 transition-colors"
                style={{ textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-card)')}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center rounded-full text-lg"
                    style={{ width: 44, height: 44, background: ticket.status === 'OPEN' ? '#fef3c7' : ticket.status === 'IN_PROGRESS' ? '#e0f2fe' : ticket.status === 'RESOLVED' ? '#dcfce7' : 'var(--surface-bone)' }}>
                    {ticket.status === 'OPEN' ? '🔔' : ticket.status === 'IN_PROGRESS' ? '⚙️' : ticket.status === 'RESOLVED' ? '✅' : '📁'}
                  </div>
                  <div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>#{ticket.id} — {ticket.title}</p>
                    <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>Room {ticket.room} · {relTime(ticket.createdAt)}</p>
                    <p className="body-sm mt-1" style={{ color: 'var(--charcoal)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ticket.description}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}

// ─── SCR-31: CREATE ───────────────────────────────────────────────────────────
export function CreateMaintenanceTicketPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!description.trim()) e.description = 'Description is required.';
    if (description.length > 0 && description.length < 20) e.description = 'Please provide more detail (at least 20 chars).';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    // POST MaintenanceTicket.status = OPEN
    setTimeout(() => { setLoading(false); navigate('/tenant/maintenance'); }, 1200);
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 600 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tenant/maintenance" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Report Maintenance Issue</h1>
        </div>

        <div className="alert alert-info mb-5">
          Your ticket will be sent to the landlord with status <strong>OPEN</strong>. You'll be notified once a technician is assigned.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            {/* MaintenanceTicket.title */}
            <div className="mb-5">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                Issue Title <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="mt-title"
                type="text"
                className="input-field-rect"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Broken AC unit, leaking pipe…"
              />
              {errors.title && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.title}</p>}
            </div>

            {/* MaintenanceTicket.description */}
            <div className="mb-5">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                Description <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                id="mt-description"
                className="textarea-field"
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the issue in detail — when it started, how severe it is, what you've tried…"
              />
              <div className="flex justify-between mt-1">
                {errors.description
                  ? <p className="caption" style={{ color: 'var(--error)' }}>{errors.description}</p>
                  : <span />
                }
                <p className="caption" style={{ color: 'var(--ash)' }}>{description.length}/1000</p>
              </div>
            </div>

            {/* Photo upload (optional) */}
            <div className="mb-6">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Photo Evidence (Optional)</label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="Preview" className="rounded-lg object-cover" style={{ width: 180, height: 120 }} />
                  <button type="button" onClick={() => setPhotoPreview(null)}
                    className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-white text-xs font-bold"
                    style={{ width: 20, height: 20, background: 'var(--error)', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center rounded-lg p-6 transition-all"
                  style={{ border: '2px dashed var(--hairline)', background: 'var(--surface-bone)', minHeight: 100 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
                >
                  <span className="text-3xl mb-2">📸</span>
                  <p className="body-sm" style={{ color: 'var(--charcoal)' }}>Upload a photo of the issue</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>JPG, PNG · Max 5MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setPhotoPreview(URL.createObjectURL(file));
                }}
              />
            </div>

            {/* Room (auto-filled from Contract → Room) */}
            <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--surface-bone)' }}>
              <p className="label-sm mb-1" style={{ color: 'var(--charcoal)' }}>SUBMITTING FOR</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>Room A-301 · Block A · Sunset Apartments</p>
              <p className="caption" style={{ color: 'var(--ash)' }}>From your active contract</p>
            </div>

            <div className="flex gap-3">
              <button
                id="mt-submit"
                type="submit"
                className="btn-primary"
                style={{ height: 48, padding: '0 28px', fontSize: 15 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                    Submitting…
                  </span>
                ) : '🔧 Submit Ticket'}
              </button>
              <Link to="/tenant/maintenance" className="btn-outline" style={{ height: 48, padding: '0 20px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}

// ─── SCR-32: DETAIL ───────────────────────────────────────────────────────────
export function MaintenanceTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticket = MOCK_TICKETS.find(t => t.id === id) ?? MOCK_TICKETS[0];
  const timeline = TICKET_TIMELINE[ticket.id] ?? [
    { step: 'Ticket Opened', date: new Date(ticket.createdAt).toLocaleString('en-GB'), done: true, note: 'Submitted by tenant.' },
    { step: 'Under Review', date: null, done: false, note: 'Awaiting landlord response.' },
  ];

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 720 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/tenant/maintenance" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Maintenance</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{ticket.id}</span>
        </nav>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>#{ticket.id} — {ticket.title}</h1>
            <p className="body-sm mt-1 flex items-center gap-2" style={{ color: 'var(--charcoal)' }}>
              🏠 Room {ticket.room} · {relTime(ticket.createdAt)}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Ticket info */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Issue Details</h3>
              <div className="grid grid-cols-2 gap-3 mb-4 rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                {[
                  { label: 'Ticket ID',    value: ticket.id, mono: true },
                  { label: 'Room',         value: `Room ${ticket.room}` },
                  { label: 'Submitted',    value: relTime(ticket.createdAt) },
                  { label: 'Status',       value: ticket.status },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className={row.mono ? 'code-md' : 'body-sm'} style={{ color: 'var(--ink)', fontWeight: 600 }}>{row.value}</p>
                  </div>
                ))}
              </div>
              <h4 className="label-sm mb-2" style={{ color: 'var(--charcoal)' }}>DESCRIPTION</h4>
              <p className="body-md" style={{ color: 'var(--body)', lineHeight: 1.7 }}>{ticket.description}</p>
            </div>

            {/* Timeline */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Resolution Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--hairline)' }} />
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-4 mb-5 last:mb-0">
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full z-10"
                      style={{ width: 32, height: 32, background: item.done ? 'var(--success)' : 'var(--surface-bone)', border: item.done ? 'none' : '2px dashed var(--hairline)', color: item.done ? '#fff' : 'var(--ash)', fontSize: 13 }}>
                      {item.done ? '✓' : '○'}
                    </div>
                    <div className="pt-1">
                      <p className="body-sm font-semibold" style={{ color: item.done ? 'var(--ink)' : 'var(--ash)' }}>{item.step}</p>
                      {item.date && <p className="caption" style={{ color: 'var(--ash)' }}>{item.date}</p>}
                      <p className="caption mt-0.5" style={{ color: 'var(--muted)' }}>{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status sidebar */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Status</h3>
              <StatusBadge status={ticket.status} />
              <p className="body-sm mt-3" style={{ color: 'var(--charcoal)' }}>
                {ticket.status === 'OPEN' && 'Your ticket is awaiting review by the landlord.'}
                {ticket.status === 'IN_PROGRESS' && 'A technician has been assigned and will visit soon.'}
                {ticket.status === 'RESOLVED' && 'The issue has been resolved. Please confirm.'}
                {ticket.status === 'CLOSED' && 'This ticket has been closed.'}
              </p>
              {ticket.status === 'RESOLVED' && (
                <div className="mt-4">
                  <button type="button" className="btn-primary w-full" style={{ height: 40, justifyContent: 'center', fontSize: 13 }}>
                    ✓ Confirm Resolved
                  </button>
                </div>
              )}
              {ticket.status === 'OPEN' && (
                <div className="mt-4">
                  <button type="button" className="btn-outline w-full" style={{ height: 40, justifyContent: 'center', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)' }}>
                    Cancel Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
