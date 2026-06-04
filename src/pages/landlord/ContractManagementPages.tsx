import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_CONTRACTS, MOCK_TENANTS, MOCK_ROOMS, StatusBadge, PageHeader, FilterBar, formatDate, formatPrice } from './shared';

// SCR-50 — Contract List
// SCR-51 — Create Contract
// SCR-52 — Contract Detail Management (+ Renew / Terminate)
// SCR-53 — Renew Contract
// SCR-54 — Terminate Contract

// ─── SCR-50: Contract List ─────────────────────────────────────────────────────
export function ContractManagementListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = MOCK_CONTRACTS
    .filter(c => status === 'ALL' || c.status === status)
    .filter(c =>
      c.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Contracts" sub={`${MOCK_CONTRACTS.filter(c=>c.status==='ACTIVE').length} active`}
          action={<Link to="/landlord/contracts/create" className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14, textDecoration: 'none' }}>+ Create Contract</Link>}
        />
        <FilterBar search={search} onSearch={setSearch}>
          <select className="input-field-rect" style={{ height: 38, width: 180, cursor: 'pointer' }}
            value={status} onChange={e => setStatus(e.target.value)}>
            {['ALL','ACTIVE','PENDING_SIGN','EXPIRED','TERMINATED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </FilterBar>
        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 90px', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Contract No.', 'Tenant', 'Room', 'Start', 'End', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((c, i) => (
            <div key={c.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 90px', gap: '12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{c.id}</p>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{c.tenantName}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{c.propertyName}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{c.roomNumber}</p>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(c.effectiveFrom)}</p>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(c.effectiveTo)}</p>
              <StatusBadge status={c.status} />
              <Link to={`/landlord/contracts/${c.id}`} className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>View</Link>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-51: Create Contract ───────────────────────────────────────────────────
export function CreateContractPage() {
  const navigate = useNavigate();
  const [tenantId, setTenantId]       = useState('');
  const [roomId, setRoomId]           = useState('');
  const [from, setFrom]               = useState('');
  const [to, setTo]                   = useState('');
  const [rent, setRent]               = useState('');
  const [deposit, setDeposit]         = useState('');
  const [terms, setTerms]             = useState('Standard rental terms apply. Monthly rent due by the 5th.');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!tenantId) e.tenant = 'Tenant is required.';
    if (!roomId) e.room = 'Room is required.';
    if (!from) e.from = 'Start date is required.';
    if (!to) e.to = 'End date is required.';
    if (!rent || Number(rent) <= 0) e.rent = 'Monthly rent is required.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/landlord/contracts'); }, 1000);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 700 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/landlord/contracts" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Create Contract</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            <div className="flex flex-col gap-5">
              {/* Contract.tenant */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Tenant <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={tenantId} onChange={e => setTenantId(e.target.value)}>
                    <option value="">Select tenant…</option>
                    {MOCK_TENANTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {errors.tenant && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.tenant}</p>}
                </div>
                {/* Contract.room */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Room <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={roomId} onChange={e => setRoomId(e.target.value)}>
                    <option value="">Select room…</option>
                    {MOCK_ROOMS.filter(r => r.status === 'AVAILABLE').map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber} — {r.propertyName}</option>
                    ))}
                  </select>
                  {errors.room && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.room}</p>}
                </div>
              </div>

              {/* Contract.effectiveFrom / effectiveTo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Start Date <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="date" className="input-field-rect" value={from} onChange={e => setFrom(e.target.value)} />
                  {errors.from && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.from}</p>}
                </div>
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>End Date <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="date" className="input-field-rect" value={to} onChange={e => setTo(e.target.value)} min={from} />
                  {errors.to && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.to}</p>}
                </div>
              </div>

              {/* Contract.monthlyRent / depositAmount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Monthly Rent (₫) <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="number" className="input-field-rect" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500000" min="0" />
                  {errors.rent && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.rent}</p>}
                </div>
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Deposit (₫)</label>
                  <input type="number" className="input-field-rect" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="7000000" min="0" />
                </div>
              </div>

              {/* Contract.terms */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Terms & Conditions</label>
                <textarea className="textarea-field" rows={5} value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}>
                {loading ? '…' : '📄 Create Contract'}
              </button>
              <Link to="/landlord/contracts" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-52: Contract Detail Management ───────────────────────────────────────
export function ContractManagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contract = MOCK_CONTRACTS.find(c => c.id === id) ?? MOCK_CONTRACTS[0];

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 900 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/contracts" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Contracts</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{contract.id}</span>
        </nav>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{contract.id}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{contract.tenantName} · Room {contract.roomNumber}</p>
          </div>
          <div className="flex gap-3">
            {contract.pdfUrl && <a href={contract.pdfUrl} className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📄 PDF</a>}
            <Link to={`/landlord/contracts/${contract.id}/renew`} className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>🔄 Renew</Link>
            <Link to={`/landlord/contracts/${contract.id}/terminate`} className="btn-ghost"
              style={{ height: 38, padding: '0 16px', fontSize: 13, color: 'var(--error)' }}>❌ Terminate</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Contract Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: 'Contract ID',   value: contract.id, mono: true },
                  { label: 'Tenant',        value: contract.tenantName },
                  { label: 'Room',          value: contract.roomNumber },
                  { label: 'Property',      value: contract.propertyName },
                  { label: 'Effective From', value: formatDate(contract.effectiveFrom) },
                  { label: 'Effective To',  value: formatDate(contract.effectiveTo) },
                  { label: 'Monthly Rent',  value: formatPrice(contract.monthlyRent), bold: true },
                  { label: 'Deposit',       value: formatPrice(contract.depositAmount) },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className={row.mono ? 'code-md' : 'body-sm'} style={{ color: row.bold ? 'var(--primary)' : 'var(--ink)', fontWeight: row.bold || row.mono ? 600 : 500 }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Terms</h3>
              <p className="body-md" style={{ color: 'var(--body)', lineHeight: 1.7 }}>{contract.terms}</p>
            </div>
          </div>

          {/* Signatures */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Signatures</h3>
              {[
                { party: 'Landlord', signed: (contract.signedBy as Record<string, string | undefined>)?.landlord },
                { party: 'Tenant',   signed: (contract.signedBy as Record<string, string | undefined>)?.tenant },
              ].map(sig => (
                <div key={sig.party} className="rounded-lg p-3 mb-3 text-center" style={{ background: 'var(--surface-bone)' }}>
                  <p className="caption mb-1" style={{ color: 'var(--ash)' }}>{sig.party}</p>
                  {sig.signed ? (
                    <>
                      <div className="text-xl mb-1">✅</div>
                      <p className="body-sm font-semibold" style={{ color: 'var(--success)' }}>Signed</p>
                      <p className="caption" style={{ color: 'var(--ash)' }}>{new Date(sig.signed).toLocaleDateString('en-GB')}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-xl mb-1">⏳</div>
                      <p className="body-sm" style={{ color: 'var(--warning)' }}>Pending</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-53: Renew Contract ────────────────────────────────────────────────────
export function RenewContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contract = MOCK_CONTRACTS.find(c => c.id === id) ?? MOCK_CONTRACTS[0];
  const [newEndDate, setNewEnd] = useState('');
  const [newRent, setNewRent]   = useState(String(contract.monthlyRent));
  const [newTerms, setTerms]    = useState(contract.terms);
  const [loading, setLoading]   = useState(false);

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/landlord/contracts/${contract.id}`} className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Renew Contract</h1>
        </div>
        <div className="card mb-4" style={{ padding: 18 }}>
          <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Current Contract</p>
          <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{contract.id} · {contract.tenantName} · Room {contract.roomNumber}</p>
          <p className="caption" style={{ color: 'var(--ash)' }}>Expires: {formatDate(contract.effectiveTo)}</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); navigate(`/landlord/contracts/${contract.id}`); }, 1000); }}>
          <div className="card" style={{ padding: 28 }}>
            <div className="flex flex-col gap-5">
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>New End Date <span style={{ color: 'var(--error)' }}>*</span></label>
                <input type="date" className="input-field-rect" value={newEndDate} onChange={e => setNewEnd(e.target.value)} min={contract.effectiveTo} required />
              </div>
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>New Monthly Rent (₫)</label>
                <input type="number" className="input-field-rect" value={newRent} onChange={e => setNewRent(e.target.value)} min="0" />
              </div>
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Updated Terms</label>
                <textarea className="textarea-field" rows={4} value={newTerms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}>
                {loading ? '…' : '🔄 Renew Contract'}
              </button>
              <Link to={`/landlord/contracts/${contract.id}`} className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-54: Terminate Contract ───────────────────────────────────────────────
export function TerminateContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contract = MOCK_CONTRACTS.find(c => c.id === id) ?? MOCK_CONTRACTS[0];
  const [reason, setReason]         = useState('');
  const [effectiveDate, setEffDate] = useState('');
  const [confirmed, setConfirmed]   = useState(false);
  const [loading, setLoading]       = useState(false);

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 560 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/landlord/contracts/${contract.id}`} className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--error)' }}>Terminate Contract</h1>
        </div>
        <div className="rounded-lg px-5 py-4 mb-5 flex items-center gap-3" style={{ background: '#fef2f2' }}>
          <span className="text-xl">⚠️</span>
          <p className="body-sm" style={{ color: 'var(--error)' }}>
            This action is irreversible. The tenant will be notified and the room will be freed.
          </p>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          if (!reason || !effectiveDate) return;
          setLoading(true);
          setTimeout(() => { setLoading(false); navigate('/landlord/contracts'); }, 1000);
        }}>
          <div className="card" style={{ padding: 28 }}>
            <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--surface-bone)' }}>
              <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Contract to Terminate</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{contract.id}</p>
              <p className="caption" style={{ color: 'var(--ash)' }}>{contract.tenantName} · Room {contract.roomNumber}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Termination Reason <span style={{ color: 'var(--error)' }}>*</span></label>
                <textarea className="textarea-field" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for contract termination…" required />
              </div>
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Effective Date <span style={{ color: 'var(--error)' }}>*</span></label>
                <input type="date" className="input-field-rect" value={effectiveDate} onChange={e => setEffDate(e.target.value)} required />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--error)' }} />
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
                  I confirm that I have communicated this termination to the tenant and understand this action cannot be undone.
                </p>
              </label>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit"
                className="btn-primary"
                style={{ height: 44, padding: '0 28px', background: 'var(--error)' }}
                disabled={loading || !reason || !effectiveDate || !confirmed}
              >
                {loading ? '…' : '❌ Terminate Contract'}
              </button>
              <Link to={`/landlord/contracts/${contract.id}`} className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}
