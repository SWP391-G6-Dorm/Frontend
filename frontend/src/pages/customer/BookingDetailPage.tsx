import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const BOOKINGS_MOCK = [
  { id: 'b0010000-0000-0000-0000-000000000001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout if possible', createdAt: '2026-06-01' },
  { id: 'b0020000-0000-0000-0000-000000000002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '', createdAt: '2026-06-10', holdExpiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString() },
  { id: 'b0030000-0000-0000-0000-000000000003', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT', specialRequests: '', createdAt: '2026-03-20' },
];

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending Deposit' },
  CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
  CHECKED_IN:      { cls: 'badge-info',    l: 'Checked In' },
  CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
  CANCELLED:       { cls: 'badge-error',   l: 'Cancelled' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { cls: 'badge-neutral', l: status };
  return <span className={`badge ${s.cls}`}>{s.l}</span>;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const booking = BOOKINGS_MOCK.find(b => b.id === id) || BOOKINGS_MOCK[0];

  const nights        = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000);
  const depositPaid   = booking.status !== 'PENDING_DEPOSIT';
  const depositAmount = Math.round(booking.totalAmount * 0.4);
  const remainingAmount = booking.totalAmount - depositAmount;

  return (
    <CustomerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>My Bookings</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Booking {booking.id}</span>
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: 4 }}>Booking #{booking.id}</h1>
          <p className="body-sm text-charcoal">Created on {new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Room Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Room',     value: `${booking.roomNumber} — ${booking.roomType}` },
                { label: 'Property', value: booking.propertyName },
                { label: 'Check-in', value: booking.checkInDate },
                { label: 'Check-out',value: booking.checkOutDate },
                { label: 'Duration', value: `${nights} nights` },
                { label: 'Guests',   value: `${booking.guestCount} guest(s)` },
              ].map(item => (
                <div key={item.label}>
                  <p className="body-sm text-charcoal">{item.label}</p>
                  <p style={{ fontWeight: 600, marginTop: 2 }}>{item.value}</p>
                </div>
              ))}
            </div>
            {booking.specialRequests && (
              <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p className="body-sm text-charcoal">Special Requests</p>
                <p className="body-md" style={{ marginTop: 2 }}>{booking.specialRequests}</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Payment Status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: depositPaid ? '#f0fdf4' : 'var(--surface-bone)', borderRadius: 10, border: `1px solid ${depositPaid ? '#bbf7d0' : 'var(--hairline)'}` }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: depositPaid ? '#2b9a66' : 'var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {depositPaid ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> : <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>1</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Deposit (40%)</p>
                  <p className="body-sm text-charcoal">₫{depositAmount.toLocaleString()}</p>
                </div>
                <span className={`badge ${depositPaid ? 'badge-success' : 'badge-warning'}`}>{depositPaid ? 'Paid' : 'Pending'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-bone)', borderRadius: 10, border: '1px solid var(--hairline)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>2</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Remaining Balance (60%)</p>
                  <p className="body-sm text-charcoal">₫{remainingAmount.toLocaleString()}</p>
                </div>
                <span className="badge badge-neutral">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card-lg" style={{ padding: 24, marginBottom: 16 }}>
            <h3 className="heading-sm" style={{ marginBottom: 16 }}>Price Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">Room rate × {nights} nights</span>
              <span style={{ fontWeight: 600 }}>₫{booking.totalAmount.toLocaleString()}</span>
            </div>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18 }}>₫{booking.totalAmount.toLocaleString()}</span>
            </div>
            {booking.status === 'PENDING_DEPOSIT' && (
              <Link to={`/customer/payments/${booking.id}/pay`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 16 }}>
                Pay Deposit (₫{depositAmount.toLocaleString()})
              </Link>
            )}
            {booking.status === 'CONFIRMED' && (
              <Link to={`/customer/payments/${booking.id}/remaining`} className="btn-outline" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 16 }}>
                Pay Remaining Balance
              </Link>
            )}
            {booking.status === 'CHECKED_OUT' && (
              <Link to={`/customer/reviews/create?bookingId=${booking.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 16 }}>
                ⭐ Write a Review
              </Link>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to={`/customer/contracts?bookingId=${booking.id}`} className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              View Contract
            </Link>
            {['PENDING_DEPOSIT', 'CONFIRMED'].includes(booking.status) && (
              <Link to={`/customer/bookings/${booking.id}/cancel`} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--error)', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Cancel Booking
              </Link>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
