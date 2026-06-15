import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const PAYMENT_HISTORY = [
  { id: 'P001', bookingId: 'B001', type: 'DEPOSIT', amount: 3000000, method: 'BANK_TRANSFER', status: 'PAID', paidAt: '2026-06-14T10:00:00', createdAt: '2026-06-10T09:00:00' },
  { id: 'P002', bookingId: 'B001', type: 'REMAINING_BALANCE', amount: 4500000, method: 'BANK_TRANSFER', status: 'PENDING', paidAt: null, createdAt: '2026-06-14T10:30:00' },
  { id: 'P003', bookingId: 'B003', type: 'DEPOSIT', amount: 2160000, method: 'CASH', status: 'PAID', paidAt: '2026-03-22T11:00:00', createdAt: '2026-03-20T08:00:00' },
];

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    PAID:    { cls: 'badge-success', l: 'Paid' },
    PENDING: { cls: 'badge-warning', l: 'Pending' },
    FAILED:  { cls: 'badge-error',   l: 'Failed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function PaymentHistoryPage() {
  return (
    <CustomerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Payment History</h1>
      {PAYMENT_HISTORY.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No payments yet</h3>
          <p className="body-md text-charcoal">Your payment history will appear here once you make a payment.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENT_HISTORY.map(p => (
                <tr key={p.id}>
                  <td><span className="code-md">{p.id}</span></td>
                  <td><Link to={`/customer/bookings/${p.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>{p.bookingId}</Link></td>
                  <td><span className="badge badge-tag">{p.type === 'DEPOSIT' ? 'Deposit (40%)' : 'Remaining (60%)'}</span></td>
                  <td className="text-charcoal">{p.method.replace('_', ' ')}</td>
                  <td style={{ fontWeight: 700 }}>₫{p.amount.toLocaleString()}</td>
                  <td><StatusBadge s={p.status} /></td>
                  <td className="text-charcoal">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CustomerLayout>
  );
}
