import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_REQUESTS, MOCK_TENANTS, StatusBadge, PageHeader, FilterBar, formatDate, formatPrice, relTime } from './shared';

// SCR-45 — Rental Request Management (List)
// SCR-46 — Rental Request Detail (with Approve / Reject)
// SCR-47 — Tenant List
// SCR-48 — Tenant Detail
// SCR-49 — Rental History

// ─── SCR-45: Rental Request List ──────────────────────────────────────────────
export function RequestManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = MOCK_REQUESTS
    .filter(r => status === 'ALL' || r.status === status)
    .filter(r =>
      r.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Rental Requests" sub={`${MOCK_REQUESTS.filter(r=>r.status==='PENDING').length} pending`} />
        <FilterBar search={search} onSearch={setSearch}>
          <select className="input-field-rect" style={{ height: 38, width: 160, cursor: 'pointer' }}
            value={status} onChange={e => setStatus(e.target.value)}>
            {['ALL','PENDING','APPROVED','REJECTED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterBar>

        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 0.8fr 1fr 90px', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Request ID', 'Tenant', 'Room', 'Start Date', 'Duration', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((req, i) => (
            <div key={req.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 0.8fr 1fr 90px', gap: '12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{req.id}</p>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{req.tenantName}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{req.tenantEmail}</p>
              </div>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{req.roomNumber}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{req.propertyName}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(req.startDate)}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{req.durationMonths}mo</p>
              <StatusBadge status={req.status} />
              <Link to={`/landlord/requests/${req.id}`} className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>Review</Link>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-46: Rental Request Detail (Approve/Reject) ───────────────────────────
export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const request = MOCK_REQUESTS.find(r => r.id === id) ?? MOCK_REQUESTS[0];
  const [decision, setDecision]     = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setReject]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [doneStatus, setDoneStatus] = useState('');

  function handleDecision(action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectReason.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setDoneStatus(action === 'approve' ? 'APPROVED' : 'REJECTED');
    }, 1000);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/requests" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Requests</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{request.id}</span>
        </nav>

        {done && (
          <div className={`rounded-lg px-5 py-4 mb-5 flex items-center gap-3`}
            style={{ background: doneStatus === 'APPROVED' ? '#dcfce7' : '#fee2e2' }}>
            <span className="text-xl">{doneStatus === 'APPROVED' ? '✅' : '❌'}</span>
            <p className="body-sm font-semibold" style={{ color: doneStatus === 'APPROVED' ? 'var(--success)' : 'var(--error)' }}>
              Request {doneStatus}. {doneStatus === 'APPROVED' ? 'A contract can now be created.' : 'Tenant has been notified.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Request info */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Request Details</h3>
                <StatusBadge status={done ? doneStatus : request.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Request ID',   value: request.id, mono: true },
                  { label: 'Submitted',    value: relTime(request.createdAt) },
                  { label: 'Room',         value: request.roomNumber },
                  { label: 'Property',     value: request.propertyName },
                  { label: 'Start Date',   value: formatDate(request.startDate) },
                  { label: 'Duration',     value: `${request.durationMonths} months` },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className={row.mono ? 'code-md' : 'body-sm'} style={{ color: 'var(--ink)', fontWeight: 600 }}>{row.value}</p>
                  </div>
                ))}
              </div>
              {request.note && (
                <div className="mt-4 rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Notes from tenant</p>
                  <p className="body-sm" style={{ color: 'var(--body)' }}>{request.note}</p>
                </div>
              )}
            </div>

            {/* Applicant info */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Applicant</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center rounded-full text-xl"
                  style={{ width: 48, height: 48, background: 'var(--surface-bone)', flexShrink: 0 }}>👤</div>
                <div>
                  <p className="body-sm font-bold" style={{ color: 'var(--ink)' }}>{request.tenantName}</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>{request.tenantEmail}</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>{request.tenantPhone}</p>
                </div>
              </div>
              <Link to={`/landlord/tenants/${request.tenantId}`} className="btn-outline" style={{ height: 34, padding: '0 16px', fontSize: 13 }}>
                View Tenant Profile →
              </Link>
            </div>
          </div>

          {/* Decision panel */}
          {!done && request.status === 'PENDING' ? (
            <div className="flex flex-col gap-4">
              <div className="card" style={{ padding: 20 }}>
                <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Decision</h3>

                <button
                  type="button"
                  className="btn-primary w-full mb-3"
                  style={{ height: 44, justifyContent: 'center', background: 'var(--success)', fontSize: 14 }}
                  onClick={() => handleDecision('approve')}
                  disabled={loading}
                >
                  ✅ Approve Request
                </button>

                <div className="border-t pt-4" style={{ borderColor: 'var(--hairline)' }}>
                  <p className="label-sm mb-2" style={{ color: 'var(--charcoal)' }}>Rejection Reason</p>
                  <textarea
                    className="textarea-field mb-3"
                    rows={3}
                    value={rejectReason}
                    onChange={e => setReject(e.target.value)}
                    placeholder="Reason for rejection (required)…"
                  />
                  <button
                    type="button"
                    className="btn-outline w-full"
                    style={{ height: 40, justifyContent: 'center', color: 'var(--error)', borderColor: 'var(--error)', fontSize: 13 }}
                    onClick={() => handleDecision('reject')}
                    disabled={loading || !rejectReason.trim()}
                  >
                    ❌ Reject Request
                  </button>
                </div>
              </div>

              {done === false && (
                <div className="alert alert-info">
                  After approval, a contract will be created for tenant signature.
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <StatusBadge status={done ? doneStatus : request.status} />
              <p className="body-sm mt-3" style={{ color: 'var(--charcoal)' }}>
                {(done ? doneStatus : request.status) === 'APPROVED' && 'Request was approved. Contract created.'}
                {(done ? doneStatus : request.status) === 'REJECTED' && 'Request was rejected.'}
              </p>
              {(done ? doneStatus : request.status) === 'APPROVED' && (
                <Link to="/landlord/contracts" className="btn-primary mt-4 w-full" style={{ height: 38, justifyContent: 'center', fontSize: 13, textDecoration: 'none', display: 'flex' }}>
                  View Contract →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-47: Tenant List ───────────────────────────────────────────────────────
export function TenantListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = MOCK_TENANTS
    .filter(t => status === 'ALL' || t.status === status)
    .filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Tenants" sub={`${MOCK_TENANTS.length} registered tenants`} />
        <FilterBar search={search} onSearch={setSearch}>
          <select className="input-field-rect" style={{ height: 38, width: 160, cursor: 'pointer' }}
            value={status} onChange={e => setStatus(e.target.value)}>
            {['ALL','ACTIVE','PENDING','SUSPENDED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterBar>

        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Tenant', 'Email / Phone', 'Room', 'Contract', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((tenant, i) => (
            <div key={tenant.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', gap: '12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ width: 36, height: 36, background: 'var(--surface-bone)', color: 'var(--primary)', flexShrink: 0 }}>
                  {tenant.name.charAt(0)}
                </div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{tenant.name}</p>
              </div>
              <div>
                <p className="body-sm" style={{ color: 'var(--ink)' }}>{tenant.email}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{tenant.phone}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{tenant.roomNumber}</p>
              <StatusBadge status={tenant.contractStatus} />
              <StatusBadge status={tenant.status} />
              <Link to={`/landlord/tenants/${tenant.id}`} className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>View</Link>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-48: Tenant Detail ────────────────────────────────────────────────────
export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenant = MOCK_TENANTS.find(t => t.id === id) ?? MOCK_TENANTS[0];

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/tenants" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Tenants</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{tenant.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--hero-glow))', color: '#fff' }}>
                {tenant.name.charAt(0)}
              </div>
              <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>{tenant.name}</h3>
              <StatusBadge status={tenant.status} />
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: '✉️', value: tenant.email },
                { icon: '📞', value: tenant.phone },
                { icon: '🏠', value: `Room ${tenant.roomNumber}` },
                { icon: '📄', value: `Contract: ${tenant.contractStatus}` },
                { icon: '📅', value: `Joined: ${formatDate(tenant.createdAt)}` },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--hairline)' }}>
                  <span>{row.icon}</span>
                  <p className="body-sm" style={{ color: 'var(--ink)' }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center rounded-lg py-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="heading-md" style={{ color: 'var(--primary)' }}>1</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>Active Contract</p>
                </div>
                <div className="text-center rounded-lg py-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="heading-md" style={{ color: 'var(--success)' }}>₫4.1M</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>Total Paid</p>
                </div>
                <div className="text-center rounded-lg py-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="heading-md" style={{ color: 'var(--warning)' }}>2</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>Open Tickets</p>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Link to={`/landlord/contracts?tenant=${tenant.id}`} className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}>📄 Contracts</Link>
                <Link to={`/landlord/billing?tenant=${tenant.id}`} className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}>💳 Bills</Link>
                <Link to={`/landlord/tenants/${tenant.id}/history`} className="btn-ghost" style={{ height: 38, padding: '0 16px', fontSize: 13, color: 'var(--charcoal)' }}>🕘 History</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-49: Rental History ───────────────────────────────────────────────────
export function RentalHistoryPage() {
  const { tenantId } = useParams<{ tenantId?: string }>();
  const tenant = tenantId ? MOCK_TENANTS.find(t => t.id === tenantId) : null;

  const HISTORY = [
    { id: 'h-001', property: 'Sunset Apartments', room: 'A-301', from: '2024-09-01', to: '2026-01-31', rent: 3500000, status: 'ACTIVE'   },
    { id: 'h-002', property: 'Green House',        room: 'B-102', from: '2023-09-01', to: '2024-08-31', rent: 2800000, status: 'EXPIRED'  },
    { id: 'h-003', property: 'City View',          room: 'C-201', from: '2022-06-01', to: '2023-05-31', rent: 3100000, status: 'EXPIRED'  },
  ];

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <div className="flex items-center gap-4 mb-6">
          {tenant && <Link to={`/landlord/tenants/${tenantId}`} className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>}
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>
            Rental History{tenant ? ` — ${tenant.name}` : ''}
          </h1>
        </div>
        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Property', 'Room', 'From', 'To', 'Monthly Rent', 'Status'].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {HISTORY.map((h, i) => (
            <div key={h.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', borderBottom: i < HISTORY.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{h.property}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{h.room}</p>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(h.from)}</p>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(h.to)}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--primary)' }}>{formatPrice(h.rent)}</p>
              <StatusBadge status={h.status} />
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}
