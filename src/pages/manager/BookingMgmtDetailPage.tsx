import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const BOOKINGS = [
  { id: 'B001', customerId: 'U001', customer: 'Nguyễn Văn An', customerEmail: 'an.nguyen@email.com', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout' },
  { id: 'B002', customerId: 'U002', customer: 'Trần Thị Lan', customerEmail: 'lan.tran@email.com', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '' },
];

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending Deposit' },
  CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
  CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
};

function SBadge({ s }: { s: string }) {
  const v = STATUS_MAP[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function BookingMgmtDetailPage() {
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
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Customer</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><p className="body-sm text-charcoal">Name</p><p style={{ fontWeight: 600 }}>{b.customer}</p></div>
              <div><p className="body-sm text-charcoal">Email</p><p style={{ fontWeight: 600 }}>{b.customerEmail}</p></div>
            </div>
          </div>
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
