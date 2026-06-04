import { Link, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-23 — My Contract List  +  SCR-24 — Contract Detail
// Entity: Contract
// Fields: Contract.id · rentalRequest · tenant · room · terms · signedBy · pdfUrl
//         status · effectiveFrom · effectiveTo · depositAmount · monthlyRent

const MOCK_CONTRACTS = [
  {
    id: 'C-2024-001', status: 'ACTIVE',
    effectiveFrom: '2024-09-01', effectiveTo: '2026-01-31',
    monthlyRent: 3500000, depositAmount: 7000000,
    pdfUrl: '#',
    room: { roomNumber: 'A-301', roomType: 'Studio', blockName: 'Block A', propertyName: 'Sunset Apartments', address: '125 Nguyen Hue, District 1, HCMC' },
    rentalRequest: { id: 'RR-001', startDate: '2024-09-01', durationMonths: 12 },
    tenant: { name: 'Nguyen Van A', email: 'vana@example.com', phone: '+84 912 345 678' },
    terms: 'This agreement constitutes the full agreement between the tenant and landlord. Monthly rent is due on the 5th of each month. A 30-day notice is required for early termination. The deposit will be refunded within 15 days of move-out inspection, minus any deductions for damages.',
    signedBy: { tenant: '2024-08-28T10:00:00Z', landlord: '2024-08-29T14:00:00Z' },
  },
  {
    id: 'C-2023-008', status: 'EXPIRED',
    effectiveFrom: '2023-09-01', effectiveTo: '2024-08-31',
    monthlyRent: 3200000, depositAmount: 6400000,
    pdfUrl: '#',
    room: { roomNumber: 'B-102', roomType: 'Single Room', blockName: 'Block B', propertyName: 'Green House', address: '88 Le Van Viet, Thu Duc, HCMC' },
    rentalRequest: { id: 'RR-000', startDate: '2023-09-01', durationMonths: 12 },
    tenant: { name: 'Nguyen Van A', email: 'vana@example.com', phone: '+84 912 345 678' },
    terms: 'Standard contract terms apply.',
    signedBy: { tenant: '2023-08-25T09:00:00Z', landlord: '2023-08-26T11:00:00Z' },
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { ACTIVE: 'badge-success', EXPIRED: 'badge-neutral', TERMINATED: 'badge-error', DRAFT: 'badge-warning', PENDING_SIGN: 'badge-warning' };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status.replace('_', ' ')}</span>;
}
function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
function formatDateTime(iso: string) { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }

// ─── SCR-23: LIST ───────────────────────────────────────────────────────────
export function ContractListPage() {
  return (
    <TenantLayout>
      <div className="animate-fade-up">
        <h1 className="heading-lg mb-5" style={{ color: 'var(--ink)' }}>My Contracts</h1>

        <div className="card overflow-hidden">
          <div className="grid gap-3 px-5 py-3 border-b" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Contract No.', 'Room', 'Start Date', 'End Date', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {MOCK_CONTRACTS.map((c, i) => (
            <div
              key={c.id}
              className="grid gap-3 px-5 py-4 items-center"
              style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', borderBottom: i < MOCK_CONTRACTS.length - 1 ? '1px solid var(--hairline)' : 'none' }}
            >
              <div>
                <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{c.id}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{c.room.propertyName}</p>
              </div>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{c.room.roomNumber}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{c.room.roomType}</p>
              </div>
              <div className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(c.effectiveFrom)}</div>
              <div className="body-sm" style={{ color: 'var(--ink)' }}>{formatDate(c.effectiveTo)}</div>
              <StatusBadge status={c.status} />
              <Link to={`/tenant/contracts/${c.id}`} className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>View</Link>
            </div>
          ))}
        </div>
      </div>
    </TenantLayout>
  );
}

// ─── SCR-24: DETAIL ──────────────────────────────────────────────────────────
export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contract = MOCK_CONTRACTS.find(c => c.id === id) ?? MOCK_CONTRACTS[0];

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/tenant/contracts" style={{ color: 'var(--ash)', textDecoration: 'none' }}>My Contracts</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>{contract.id}</span>
        </nav>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Contract {contract.id}</h1>
            <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
              {formatDate(contract.effectiveFrom)} → {formatDate(contract.effectiveTo)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={contract.status} />
            <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}>
              📄 Download PDF
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Contract Information */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Contract Information</h3>
            {[
              { label: 'Contract ID',   value: contract.id, mono: true },
              { label: 'Monthly Rent',  value: formatPrice(contract.monthlyRent), bold: true },
              { label: 'Deposit',       value: formatPrice(contract.depositAmount) },
              { label: 'Effective From', value: formatDate(contract.effectiveFrom) },
              { label: 'Effective To',  value: formatDate(contract.effectiveTo) },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2.5 border-b" style={{ borderColor: 'var(--hairline)' }}>
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{row.label}</span>
                <span className={row.mono ? 'code-md' : 'body-sm'} style={{ color: row.bold ? 'var(--primary)' : 'var(--ink)', fontWeight: row.bold ? 700 : 600 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Room + Tenant info */}
          <div className="flex flex-col gap-4">
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Room</h3>
              {[
                { label: 'Room No.',   value: contract.room.roomNumber },
                { label: 'Type',       value: contract.room.roomType },
                { label: 'Block',      value: contract.room.blockName },
                { label: 'Property',   value: contract.room.propertyName },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--hairline)' }}>
                  <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{row.label}</span>
                  <span className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Tenant</h3>
              {[
                { label: 'Name',  value: contract.tenant.name },
                { label: 'Email', value: contract.tenant.email },
                { label: 'Phone', value: contract.tenant.phone },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--hairline)' }}>
                  <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{row.label}</span>
                  <span className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="card mb-5" style={{ padding: 24 }}>
          <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Terms & Conditions</h3>
          <p className="body-md" style={{ color: 'var(--body)', lineHeight: 1.7 }}>{contract.terms}</p>
        </div>

        {/* Signatures */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Digital Signatures (Contract.signedBy)</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { party: 'Tenant', signed: contract.signedBy.tenant, name: contract.tenant.name },
              { party: 'Landlord', signed: contract.signedBy.landlord, name: 'Le Quoc Hung' },
            ].map(sig => (
              <div key={sig.party} className="rounded-lg p-4 text-center" style={{ background: 'var(--surface-bone)', border: '1px dashed var(--hairline)' }}>
                <p className="caption mb-2" style={{ color: 'var(--ash)' }}>{sig.party.toUpperCase()}</p>
                {sig.signed ? (
                  <>
                    <div className="text-2xl mb-1">✅</div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--success)' }}>Signed</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{formatDateTime(sig.signed)}</p>
                    <p className="body-sm mt-1" style={{ color: 'var(--ink)' }}>{sig.name}</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl mb-1">⏳</div>
                    <p className="body-sm" style={{ color: 'var(--warning)' }}>Awaiting signature</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
