// ─── BookingMgmtPages.tsx + ContractMgmtPages.tsx + PaymentMgmtPages.tsx ─────
// SCR-45 through SCR-52
// Exports: BookingMgmtListPage, BookingMgmtDetailPage, PaymentListPage,
//          PaymentVerificationPage, PaymentDetailPage, ContractMgmtListPage,
//          ContractMgmtDetailPage, ResendContractPage

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

// ─── Shared mock data ─────────────────────────────────────────────────────────
const BOOKINGS = [
  { id: 'B001', customerId: 'U001', customer: 'Nguyễn Văn An', customerEmail: 'an.nguyen@email.com', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout', createdAt: '2026-06-01' },
  { id: 'B002', customerId: 'U002', customer: 'Trần Thị Lan', customerEmail: 'lan.tran@email.com', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '', createdAt: '2026-06-10' },
  { id: 'B003', customerId: 'U003', customer: 'Lê Minh Hoàng', customerEmail: 'hoang.le@email.com', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT', specialRequests: '', createdAt: '2026-03-20' },
];

const PAYMENTS = [
  { id: 'P001', bookingId: 'B001', customer: 'Nguyễn Văn An', type: 'DEPOSIT', method: 'BANK_TRANSFER', amount: 3000000, status: 'PENDING', receiptUrl: 'https://placehold.co/400x300', paidAt: null, createdAt: '2026-06-14T09:00:00', verifiedAt: null, notes: '' },
  { id: 'P002', bookingId: 'B002', customer: 'Trần Thị Lan', type: 'DEPOSIT', method: 'E_WALLET', amount: 960000, status: 'PENDING', receiptUrl: 'https://placehold.co/400x300', paidAt: null, createdAt: '2026-06-13T14:30:00', verifiedAt: null, notes: '' },
  { id: 'P003', bookingId: 'B003', customer: 'Lê Minh Hoàng', type: 'REMAINING_BALANCE', method: 'CASH', amount: 3240000, status: 'PAID', receiptUrl: null, paidAt: '2026-04-05T12:00:00', createdAt: '2026-04-04T10:00:00', verifiedAt: '2026-04-05T13:00:00', notes: 'Paid in cash at check-in' },
];

const CONTRACTS = [
  { id: 'C001', bookingId: 'B001', customer: 'Nguyễn Văn An', customerEmail: 'an.nguyen@email.com', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', totalAmount: 7500000, generatedAt: '2026-06-14T10:35:00', status: 'ACTIVE' },
  { id: 'C002', bookingId: 'B003', customer: 'Lê Minh Hoàng', customerEmail: 'hoang.le@email.com', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', totalAmount: 5400000, generatedAt: '2026-03-22T11:00:00', status: 'COMPLETED' },
];

function SBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending Deposit' },
    CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
    CHECKED_IN:      { cls: 'badge-info',    l: 'Checked In' },
    CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
    CANCELLED:       { cls: 'badge-error',   l: 'Cancelled' },
    PENDING:         { cls: 'badge-warning', l: 'Pending Verification' },
    PAID:            { cls: 'badge-success', l: 'Paid' },
    FAILED:          { cls: 'badge-error',   l: 'Failed' },
    ACTIVE:          { cls: 'badge-success', l: 'Active' },
    COMPLETED:       { cls: 'badge-neutral', l: 'Completed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-45: Booking Management List
// ═══════════════════════════════════════════════════════════════════════════════
export function BookingMgmtListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const TABS = ['ALL','PENDING_DEPOSIT','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED'];

  const list = BOOKINGS.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return b.customer.toLowerCase().includes(search.toLowerCase()) || b.roomNumber.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Booking Management</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search booking, customer..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-pill ${statusFilter === tab ? 'active' : ''}`} onClick={() => setStatusFilter(tab)} style={{ fontSize: 12 }}>
            {tab === 'ALL' ? 'All' : tab.replace('_',' ')}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(b => (
              <tr key={b.id}>
                <td><span className="code-sm">{b.id}</span></td>
                <td>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{b.customer}</p>
                  <p style={{ fontSize: 11, color: 'var(--ash)' }}>{b.customerEmail}</p>
                </td>
                <td>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{b.roomNumber}</p>
                  <p style={{ fontSize: 11, color: 'var(--ash)' }}>{b.propertyName}</p>
                </td>
                <td className="text-charcoal">{b.checkInDate}</td>
                <td className="text-charcoal">{b.checkOutDate}</td>
                <td style={{ fontWeight: 700 }}>₫{b.totalAmount.toLocaleString()}</td>
                <td><SBadge s={b.status} /></td>
                <td><Link to={`/manager/bookings/${b.id}`} className="btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-46: Booking Management Detail
// ═══════════════════════════════════════════════════════════════════════════════
export function BookingMgmtDetailPage() {
  const { id } = useParams();
  const b = BOOKINGS.find(x => x.id === id) || BOOKINGS[0];
  const nights = Math.ceil((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000);

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{b.id}</span>
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Booking #{b.id}</h1>
        <SBadge s={b.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Customer */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Customer</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><p className="body-sm text-charcoal">Name</p><p style={{ fontWeight: 600 }}>{b.customer}</p></div>
              <div><p className="body-sm text-charcoal">Email</p><p style={{ fontWeight: 600 }}>{b.customerEmail}</p></div>
            </div>
          </div>
          {/* Room Details */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Booking Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { l: 'Room', v: b.roomNumber },
                { l: 'Type', v: b.roomType },
                { l: 'Property', v: b.propertyName },
                { l: 'Guests', v: `${b.guestCount}` },
                { l: 'Check-in', v: b.checkInDate },
                { l: 'Check-out', v: b.checkOutDate },
                { l: 'Duration', v: `${nights} nights` },
                { l: 'Total', v: `₫${b.totalAmount.toLocaleString()}` },
              ].map(r => (
                <div key={r.l}><p className="body-sm text-charcoal">{r.l}</p><p style={{ fontWeight: 600, marginTop: 2 }}>{r.v}</p></div>
              ))}
            </div>
            {b.specialRequests && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p className="body-sm text-charcoal">Special Requests</p>
                <p className="body-md" style={{ marginTop: 2 }}>{b.specialRequests}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div>
          <div className="card-lg" style={{ padding: 20 }}>
            <h3 className="heading-sm" style={{ marginBottom: 14 }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to={`/manager/payments?bookingId=${b.id}`} className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                View Payments
              </Link>
              <Link to={`/manager/contracts?bookingId=${b.id}`} className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                View Contract
              </Link>
              <Link to={`/manager/customers/${b.customerId}`} className="btn-ghost" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Customer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-47: Payment List
// ═══════════════════════════════════════════════════════════════════════════════
export function PaymentListPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const TABS = ['ALL','PENDING','PAID','FAILED'];
  const list = statusFilter === 'ALL' ? PAYMENTS : PAYMENTS.filter(p => p.status === statusFilter);

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Payments</h1>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-pill ${statusFilter === tab ? 'active' : ''}`} onClick={() => setStatusFilter(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Booking</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td><span className="code-sm">{p.id}</span></td>
                <td><Link to={`/manager/bookings/${p.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>{p.bookingId}</Link></td>
                <td>{p.customer}</td>
                <td><span className="badge badge-tag" style={{ fontSize: 11 }}>{p.type === 'DEPOSIT' ? 'Deposit' : 'Balance'}</span></td>
                <td className="text-charcoal">{p.method.replace('_',' ')}</td>
                <td style={{ fontWeight: 700 }}>₫{p.amount.toLocaleString()}</td>
                <td><SBadge s={p.status} /></td>
                <td className="text-charcoal">{new Date(p.createdAt).toLocaleDateString('en-US')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {p.status === 'PENDING' && <Link to={`/manager/payments/${p.id}/verify`} className="btn-primary btn-sm">Verify</Link>}
                    <Link to={`/manager/payments/${p.id}`} className="btn-ghost btn-sm">View</Link>
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

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-48: Payment Verification
// ═══════════════════════════════════════════════════════════════════════════════
export function PaymentVerificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = PAYMENTS.find(x => x.id === id) || PAYMENTS[0];
  const b = BOOKINGS.find(x => x.id === p.bookingId) || BOOKINGS[0];
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action);
    await new Promise(r => setTimeout(r, 800));
    navigate('/manager/payments');
  }

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/payments" className="text-primary" style={{ textDecoration: 'none' }}>Payments</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Verify #{p.id}</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Payment Verification</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Receipt */}
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 className="heading-sm" style={{ marginBottom: 14 }}>Payment Receipt</h2>
            {p.receiptUrl ? (
              <img src={p.receiptUrl} alt="Receipt" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--surface-bone)' }} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p className="text-charcoal">No receipt uploaded</p>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 14 }}>Booking Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Customer', v: b.customer },
                { l: 'Room', v: b.roomNumber },
                { l: 'Check-in', v: b.checkInDate },
                { l: 'Check-out', v: b.checkOutDate },
              ].map(row => (
                <div key={row.l}><p className="body-sm text-charcoal">{row.l}</p><p style={{ fontWeight: 600 }}>{row.v}</p></div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Panel */}
        <div>
          <div className="card-lg" style={{ padding: 24, marginBottom: 16 }}>
            <h3 className="heading-sm" style={{ marginBottom: 14 }}>Payment Info</h3>
            {[
              { l: 'Payment ID', v: p.id },
              { l: 'Type', v: p.type === 'DEPOSIT' ? 'Deposit (40%)' : 'Remaining Balance (60%)' },
              { l: 'Method', v: p.method.replace('_',' ') },
              { l: 'Amount', v: `₫${p.amount.toLocaleString()}` },
              { l: 'Submitted', v: new Date(p.createdAt).toLocaleString('en-US') },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="body-sm text-charcoal">{row.l}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{row.v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="body-sm text-charcoal">Amount to verify</span>
                <span className="text-primary" style={{ fontWeight: 800, fontSize: 18 }}>₫{p.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card-lg" style={{ padding: 24 }}>
            <h3 className="heading-sm" style={{ marginBottom: 14 }}>Verification Action</h3>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Internal Notes (optional)</label>
              <textarea className="textarea" rows={3} placeholder="Add notes about this payment..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" style={{ width: '100%', background: 'var(--success)', boxShadow: 'none' }}
                disabled={loading !== null} onClick={() => handleAction('approve')}>
                {loading === 'approve' ? 'Approving...' : '✓ Approve Payment'}
              </button>
              <button className="btn-danger" style={{ width: '100%' }}
                disabled={loading !== null} onClick={() => handleAction('reject')}>
                {loading === 'reject' ? 'Rejecting...' : '✗ Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-49: Payment Detail
// ═══════════════════════════════════════════════════════════════════════════════
export function PaymentDetailPage() {
  const { id } = useParams();
  const p = PAYMENTS.find(x => x.id === id) || PAYMENTS[0];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/payments" className="text-primary" style={{ textDecoration: 'none' }}>Payments</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{p.id}</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Payment Detail #{p.id}</h1>
      <div style={{ maxWidth: 640 }}>
        <div className="card-lg" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { l: 'Payment ID', v: p.id },
              { l: 'Booking ID', v: p.bookingId },
              { l: 'Customer', v: p.customer },
              { l: 'Type', v: p.type === 'DEPOSIT' ? 'Deposit (40%)' : 'Remaining (60%)' },
              { l: 'Method', v: p.method.replace('_',' ') },
              { l: 'Amount', v: `₫${p.amount.toLocaleString()}` },
              { l: 'Status', v: null },
              { l: 'Created', v: new Date(p.createdAt).toLocaleString('en-US') },
              { l: 'Verified At', v: p.verifiedAt ? new Date(p.verifiedAt).toLocaleString('en-US') : '—' },
              { l: 'Notes', v: p.notes || '—' },
            ].map(row => (
              <div key={row.l}>
                <p className="body-sm text-charcoal">{row.l}</p>
                {row.v === null ? <SBadge s={p.status} /> : <p style={{ fontWeight: 600, marginTop: 4 }}>{row.v}</p>}
              </div>
            ))}
          </div>
          {p.status === 'PENDING' && (
            <Link to={`/manager/payments/${p.id}/verify`} className="btn-primary">Verify This Payment</Link>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-50: Contract Management List
// ═══════════════════════════════════════════════════════════════════════════════
export function ContractMgmtListPage() {
  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Contract Management</h1>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Booking</th>
              <th>Customer</th>
              <th>Room</th>
              <th>Total</th>
              <th>Generated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACTS.map(c => (
              <tr key={c.id}>
                <td><span className="code-sm">{c.id}</span></td>
                <td><Link to={`/manager/bookings/${c.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>{c.bookingId}</Link></td>
                <td>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{c.customer}</p>
                  <p style={{ fontSize: 11, color: 'var(--ash)' }}>{c.customerEmail}</p>
                </td>
                <td>{c.roomNumber}</td>
                <td style={{ fontWeight: 700 }}>₫{c.totalAmount.toLocaleString()}</td>
                <td className="text-charcoal">{new Date(c.generatedAt).toLocaleDateString('en-US')}</td>
                <td><SBadge s={c.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link to={`/manager/contracts/${c.id}`} className="btn-ghost btn-sm">View</Link>
                    <Link to={`/manager/contracts/${c.id}/resend`} className="btn-outline btn-sm">Resend</Link>
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

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-51: Contract Management Detail
// ═══════════════════════════════════════════════════════════════════════════════
export function ContractMgmtDetailPage() {
  const { id } = useParams();
  const c = CONTRACTS.find(x => x.id === id) || CONTRACTS[0];
  const nights = Math.ceil((new Date(c.checkOutDate).getTime() - new Date(c.checkInDate).getTime()) / 86400000);

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/contracts" className="text-primary" style={{ textDecoration: 'none' }}>Contracts</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{c.id}</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Contract #{c.id}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <SBadge s={c.status} />
          <a href="#" className="btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </a>
          <Link to={`/manager/contracts/${c.id}/resend`} className="btn-primary btn-sm">Resend Email</Link>
        </div>
      </div>

      <div className="card-lg" style={{ padding: 32, maxWidth: 700 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { l: 'Customer', v: c.customer },
            { l: 'Email', v: c.customerEmail },
            { l: 'Booking ID', v: c.bookingId },
            { l: 'Property', v: c.propertyName },
            { l: 'Room', v: c.roomNumber },
            { l: 'Check-in', v: c.checkInDate },
            { l: 'Check-out', v: c.checkOutDate },
            { l: 'Duration', v: `${nights} nights` },
            { l: 'Total Amount', v: `₫${c.totalAmount.toLocaleString()}` },
            { l: 'Generated At', v: new Date(c.generatedAt).toLocaleString('en-US') },
          ].map(row => (
            <div key={row.l}><p className="body-sm text-charcoal">{row.l}</p><p style={{ fontWeight: 600, marginTop: 4 }}>{row.v}</p></div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCR-52: Resend Contract
// ═══════════════════════════════════════════════════════════════════════════════
export function ResendContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = CONTRACTS.find(x => x.id === id) || CONTRACTS[0];
  const [email, setEmail] = useState(c.customerEmail);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setDone(true);
    setLoading(false);
  }

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to={`/manager/contracts/${c.id}`} className="text-primary" style={{ textDecoration: 'none' }}>Contract #{c.id}</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Resend</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Resend Contract Email</h1>
      <div style={{ maxWidth: 480 }}>
        {done ? (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
            Contract successfully resent to {email}
          </div>
        ) : (
          <form onSubmit={handleResend} className="card-lg" style={{ padding: 28 }}>
            <div style={{ padding: 16, background: 'var(--surface-bone)', borderRadius: 10, marginBottom: 20 }}>
              <p className="body-sm text-charcoal">Contract</p>
              <p style={{ fontWeight: 700 }}>#{c.id} · {c.roomNumber} · {c.customer}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label form-label-required" htmlFor="resendEmail">Send to Email</label>
              <input id="resendEmail" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
              <p className="form-hint">Default is the customer's registered email</p>
            </div>
            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              The contract PDF will be attached and sent immediately.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send Contract'}</button>
              <Link to={`/manager/contracts/${c.id}`} className="btn-ghost">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </ManagerLayout>
  );
}
