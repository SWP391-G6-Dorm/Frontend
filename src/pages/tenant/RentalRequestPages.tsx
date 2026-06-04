import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-19 — Rental Request List  +  SCR-20 — Rental Request Form  +  SCR-21 — Rental Request Detail

// ─── SCR-19: LIST ────────────────────────────────────────────────────────────
const MOCK_REQUESTS = [
  { id: 'RR-001', roomNumber: 'B-202', propertyName: 'Green House', startDate: '2025-09-01', durationMonths: 6, status: 'APPROVED',  note: '',                       createdAt: '2025-08-20', room: { type: 'Single Room', pricePerMonth: 2200000 } },
  { id: 'RR-002', roomNumber: 'C-305', propertyName: 'City Center',  startDate: '2025-11-01', durationMonths: 12, status: 'PENDING',  note: 'Prefer ground floor.',   createdAt: '2025-10-15', room: { type: 'Double Room', pricePerMonth: 4800000 } },
  { id: 'RR-003', roomNumber: 'D-101', propertyName: 'Riverside',    startDate: '2025-07-01', durationMonths: 3, status: 'REJECTED', note: 'Looking for short term.', createdAt: '2025-06-28', room: { type: 'Studio',      pricePerMonth: 3000000 } },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-error', CANCELLED: 'badge-neutral' };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}
function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

export function RentalRequestListPage() {
  return (
    <TenantLayout>
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Rental Requests</h1>
          <Link to="/rooms" className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14 }}>
            + New Request
          </Link>
        </div>

        {MOCK_REQUESTS.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="heading-sm mb-2">No rental requests yet</h3>
            <p className="body-md mb-5" style={{ color: 'var(--charcoal)' }}>Browse available rooms and submit your first request.</p>
            <Link to="/rooms" className="btn-primary">Browse Rooms</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-3 px-5 py-3 border-b" style={{ background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
              {['Request ID', 'Room', 'Property', 'Start Date', 'Duration', 'Status'].map(h => (
                <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
              ))}
            </div>
            {MOCK_REQUESTS.map((req, i) => (
              <Link
                key={req.id}
                to={`/tenant/requests/${req.id}`}
                className="grid grid-cols-6 gap-3 px-5 py-4 transition-colors"
                style={{
                  textDecoration: 'none',
                  borderBottom: i < MOCK_REQUESTS.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{req.id}</div>
                <div>
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{req.roomNumber}</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>{req.room.type}</p>
                </div>
                <div className="body-sm" style={{ color: 'var(--charcoal)' }}>{req.propertyName}</div>
                <div className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(req.startDate)}</div>
                <div className="body-sm" style={{ color: 'var(--ink)' }}>{req.durationMonths} months</div>
                <StatusBadge status={req.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}

// ─── SCR-20: FORM ────────────────────────────────────────────────────────────
export function RentalRequestFormPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('6');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Demo: room info from URL param / context
  const room = { id: 'r-003', roomNumber: 'C-305', roomType: 'Double Room', pricePerMonth: 4800000, propertyName: 'City Center Residences' };

  function validate() {
    const e: Record<string, string> = {};
    if (!startDate) e.startDate = 'Start date is required.';
    if (!duration || Number(duration) < 1) e.duration = 'Duration must be at least 1 month.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/tenant/requests/RR-NEW'); }, 1200);
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/rooms" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Rental Request</h1>
        </div>

        {/* Room summary */}
        <div className="card mb-5" style={{ padding: 20 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Room you're requesting</p>
              <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>{room.roomNumber} — {room.roomType}</h3>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.propertyName}</p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ color: 'var(--primary)', fontSize: 20 }}>{formatPrice(room.pricePerMonth)}</p>
              <p className="caption" style={{ color: 'var(--ash)' }}>/month</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Request Details</h3>

            {/* RentalRequest.startDate */}
            <div className="mb-4">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                Preferred Move-in Date <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="rr-startdate"
                type="date"
                className="input-field-rect"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.startDate}</p>}
            </div>

            {/* RentalRequest.durationMonths */}
            <div className="mb-4">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                Duration (months) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <select
                id="rr-duration"
                className="input-field-rect"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {[1, 2, 3, 6, 12, 18, 24].map(m => <option key={m} value={m}>{m} {m === 1 ? 'month' : 'months'}</option>)}
              </select>
              {errors.duration && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.duration}</p>}
            </div>

            {/* Personal Information (pre-filled from User entity) */}
            <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--surface-bone)' }}>
              <p className="label-sm mb-3" style={{ color: 'var(--charcoal)' }}>YOUR INFORMATION (from profile)</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', val: 'Nguyen Van A' },
                  { label: 'Email',     val: 'vana@example.com' },
                  { label: 'Phone',     val: '+84 912 345 678' },
                  { label: 'Role',      val: 'TENANT' },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{row.val}</p>
                  </div>
                ))}
              </div>
              <Link to="/tenant/profile/edit" className="body-sm mt-3 inline-block font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                Edit Profile →
              </Link>
            </div>

            {/* RentalRequest.note */}
            <div className="mb-6">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Additional Notes</label>
              <textarea
                id="rr-note"
                className="textarea-field"
                rows={4}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any special requirements or questions for the landlord…"
              />
            </div>

            <div className="flex gap-3">
              <button
                id="rr-submit"
                type="submit"
                className="btn-primary"
                style={{ height: 48, padding: '0 32px', fontSize: 15 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Submitting…
                  </span>
                ) : '📋 Submit Request'}
              </button>
              <Link to="/rooms" className="btn-outline" style={{ height: 48, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}

// ─── SCR-21: DETAIL ───────────────────────────────────────────────────────────
const TIMELINE = [
  { step: 'Request Submitted', date: '2025-10-15 10:30', note: 'Your request has been received by the landlord.', done: true },
  { step: 'Under Review',      date: '2025-10-16 09:00', note: 'The landlord is reviewing your application.',    done: true },
  { step: 'Decision Pending',  date: null,               note: 'Awaiting landlord decision.',                    done: false },
];

export function RentalRequestDetailPage() {
  const request = MOCK_REQUESTS[1]; // PENDING request demo
  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 720 }}>
        <div className="flex items-center gap-4 mb-5">
          <Link to="/tenant/requests" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Request {request.id}</h1>
            <p className="body-sm" style={{ color: 'var(--ash)' }}>Submitted {formatDate(request.createdAt)}</p>
          </div>
          <div className="ml-auto"><StatusBadge status={request.status} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main content */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Request Summary */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Request Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Request ID',  value: request.id, mono: true },
                  { label: 'Room',        value: request.roomNumber },
                  { label: 'Property',    value: request.propertyName },
                  { label: 'Start Date',  value: formatDate(request.startDate) },
                  { label: 'Duration',    value: `${request.durationMonths} months` },
                  { label: 'Monthly Rent', value: formatPrice(request.room.pricePerMonth), bold: true },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className={row.mono ? 'code-md' : 'body-sm'} style={{ color: row.bold ? 'var(--primary)' : 'var(--ink)', fontWeight: row.bold || row.mono ? 600 : 500 }}>{row.value}</p>
                  </div>
                ))}
              </div>
              {request.note && (
                <div className="mt-4 rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Notes</p>
                  <p className="body-md" style={{ color: 'var(--body)' }}>{request.note}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Request Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--hairline)' }} />
                {TIMELINE.map((item, i) => (
                  <div key={i} className="flex gap-4 mb-5 last:mb-0 relative">
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full z-10"
                      style={{
                        width: 32, height: 32,
                        background: item.done ? 'var(--success)' : 'var(--surface-bone)',
                        border: item.done ? 'none' : '2px dashed var(--hairline)',
                        color: item.done ? '#fff' : 'var(--ash)',
                        fontSize: 13,
                      }}
                    >
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
          <div className="flex flex-col gap-4">
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Status</h3>
              <div className="mb-4"><StatusBadge status={request.status} /></div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
                {request.status === 'PENDING' && 'Your request is currently being reviewed by the landlord. You\'ll be notified of the decision.'}
                {request.status === 'APPROVED' && 'Your request was approved! Please proceed to sign your contract.'}
                {request.status === 'REJECTED' && 'Unfortunately, your request was not approved. You may submit a new request for a different room.'}
              </p>
            </div>

            {request.status === 'PENDING' && (
              <div className="card" style={{ padding: 20 }}>
                <button type="button" className="btn-outline w-full" style={{ height: 40, justifyContent: 'center', color: 'var(--error)', borderColor: 'var(--error)', fontSize: 13 }}>
                  Cancel Request
                </button>
              </div>
            )}

            {request.status === 'APPROVED' && (
              <Link to="/tenant/contracts" className="btn-primary" style={{ height: 44, justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
                📄 View Contract
              </Link>
            )}
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
