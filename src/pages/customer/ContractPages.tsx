// ─── ContractPages.tsx — SCR-25, 26 ──────────────────────────────────────────
// Exports: ContractListPage, ContractDetailPage

import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const CONTRACTS = [
  { id: 'C001', bookingId: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', totalAmount: 7500000, generatedAt: '2026-06-14T10:35:00', status: 'ACTIVE', fileUrl: '#' },
  { id: 'C002', bookingId: 'B003', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', totalAmount: 5400000, generatedAt: '2026-03-22T11:00:00', status: 'COMPLETED', fileUrl: '#' },
];

// ── SCR-25: Contract List ─────────────────────────────────────────────────────
export function ContractListPage() {
  return (
    <CustomerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>My Contracts</h1>

      {CONTRACTS.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No contracts yet</h3>
          <p className="body-md text-charcoal">Contracts are generated automatically after deposit payment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CONTRACTS.map(c => (
            <div key={c.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, background: 'var(--surface-bone)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Contract #{c.id}</span>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>{c.status}</span>
                  </div>
                  <p className="body-sm text-charcoal">{c.roomNumber} · {c.propertyName}</p>
                  <p className="body-sm text-charcoal">📅 {c.checkInDate} → {c.checkOutDate}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>₫{c.totalAmount.toLocaleString()}</p>
                  <p className="body-sm text-charcoal">Generated {new Date(c.generatedAt).toLocaleDateString('en-US')}</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                    <Link to={`/customer/contracts/${c.id}`} className="btn-outline btn-sm">View</Link>
                    <a href={c.fileUrl} download className="btn-ghost btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}

// ── SCR-26: Contract Detail ───────────────────────────────────────────────────
export function ContractDetailPage() {
  const { id } = useParams();
  const c = CONTRACTS.find(x => x.id === id) || CONTRACTS[0];

  const CUSTOMER = { fullName: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901 234 567' };

  const nights = Math.ceil((new Date(c.checkOutDate).getTime() - new Date(c.checkInDate).getTime()) / 86400000);
  const pricePerNight = Math.round(c.totalAmount / nights);

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/contracts" className="text-primary" style={{ textDecoration: 'none' }}>Contracts</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Contract #{c.id}</span>
        </div>

        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <h1 className="heading-md">Accommodation Contract</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={c.fileUrl} download className="btn-outline btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF
            </a>
            <button onClick={() => window.print()} className="btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6,18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
          </div>
        </div>

        {/* Contract Document */}
        <div className="card-lg" style={{ padding: 40 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--ink)', paddingBottom: 24, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95"/></svg>
            </div>
            <h2 className="display-md" style={{ marginBottom: 4 }}>ACCOMMODATION CONTRACT</h2>
            <p className="body-sm text-charcoal">Contract #: <span className="code-md">{c.id}</span> · Booking #: <span className="code-md">{c.bookingId}</span></p>
            <p className="body-sm text-charcoal">Generated: {new Date(c.generatedAt).toLocaleString('en-US')}</p>
          </div>

          {/* Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <p className="label-sm" style={{ marginBottom: 8, color: 'var(--charcoal)' }}>Provider</p>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Homestay & Resort Management</p>
              <p className="body-sm text-charcoal">{c.propertyName}</p>
            </div>
            <div>
              <p className="label-sm" style={{ marginBottom: 8, color: 'var(--charcoal)' }}>Customer</p>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{CUSTOMER.fullName}</p>
              <p className="body-sm text-charcoal">{CUSTOMER.email}</p>
              <p className="body-sm text-charcoal">{CUSTOMER.phone}</p>
            </div>
          </div>

          {/* Room details */}
          <div style={{ background: 'var(--surface-bone)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <p className="label-sm" style={{ marginBottom: 14, color: 'var(--charcoal)' }}>Accommodation Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { l: 'Room', v: c.roomNumber },
                { l: 'Property', v: c.propertyName },
                { l: 'Check-in Date', v: c.checkInDate },
                { l: 'Check-out Date', v: c.checkOutDate },
                { l: 'Duration', v: `${nights} nights` },
                { l: 'Rate per Night', v: `₫${pricePerNight.toLocaleString()}` },
              ].map(row => (
                <div key={row.l}>
                  <p className="body-sm text-charcoal">{row.l}</p>
                  <p style={{ fontWeight: 600 }}>{row.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Terms */}
          <div style={{ marginBottom: 24 }}>
            <p className="label-sm" style={{ marginBottom: 12, color: 'var(--charcoal)' }}>Payment Terms</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span className="body-md">Deposit (40%)</span>
              <span style={{ fontWeight: 700 }}>₫{Math.round(c.totalAmount * 0.4).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span className="body-md">Remaining Balance (60%)</span>
              <span style={{ fontWeight: 700 }}>₫{Math.round(c.totalAmount * 0.6).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', background: '#fff', borderRadius: 8, marginTop: 4, fontWeight: 800, fontSize: 17 }}>
              <span>Total Amount</span>
              <span className="text-primary">₫{c.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Terms */}
          <div style={{ fontSize: 12, color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: 24 }}>
            <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Terms & Conditions</p>
            <p>1. The deposit is non-refundable upon cancellation after payment.</p>
            <p>2. The remaining balance must be paid before or at check-in.</p>
            <p>3. Check-in time: 14:00. Check-out time: 12:00.</p>
            <p>4. Guests are responsible for any damages to the accommodation.</p>
            <p>5. This contract is legally binding upon signing by both parties.</p>
          </div>

          {/* Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, paddingTop: 24, borderTop: '1px solid var(--hairline)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 50, borderBottom: '1px solid var(--hairline)', marginBottom: 8 }} />
              <p className="body-sm text-charcoal">Provider Signature</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 50, borderBottom: '1px solid var(--hairline)', marginBottom: 8 }} />
              <p className="body-sm text-charcoal">Customer Signature</p>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
