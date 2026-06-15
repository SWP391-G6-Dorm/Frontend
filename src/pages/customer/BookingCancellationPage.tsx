import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const BOOKINGS_MOCK = [
  { id: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', totalAmount: 7500000, status: 'CONFIRMED' },
  { id: 'B002', roomNumber: 'Deluxe 05', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', totalAmount: 2400000, status: 'PENDING_DEPOSIT' },
];

export default function BookingCancellationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const booking = BOOKINGS_MOCK.find(b => b.id === id) || BOOKINGS_MOCK[0];
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const depositAmount = Math.round(booking.totalAmount * 0.4);
  const depositPaid   = booking.status !== 'PENDING_DEPOSIT';

  async function handleCancel() {
    setLoading(true);
    try {
      // TODO: await bookingApi.cancel(booking.id);
      await new Promise(r => setTimeout(r, 800));
      navigate('/customer/bookings');
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={`/customer/bookings/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>Booking #{id}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Cancel Booking</span>
        </div>

        <div className="card-lg" style={{ padding: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>

          <h1 className="heading-md" style={{ marginBottom: 8 }}>Cancel Booking</h1>
          <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
            You are about to cancel your booking for <strong>{booking.roomNumber}</strong> at {booking.propertyName}.
          </p>

          <div style={{ background: 'var(--surface-bone)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">Check-in / Check-out</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{booking.checkInDate} → {booking.checkOutDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="body-sm text-charcoal">Total amount</span>
              <span style={{ fontWeight: 600 }}>₫{booking.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {depositPaid && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <p style={{ fontWeight: 700, marginBottom: 2 }}>Deposit is non-refundable</p>
                <p>Your deposit of ₫{depositAmount.toLocaleString()} will NOT be refunded per our cancellation policy.</p>
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--error)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
            <span className="body-sm">I understand that this action is irreversible{depositPaid ? ' and my deposit will not be refunded' : ''}.</span>
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-danger" style={{ flex: 1 }} onClick={handleCancel} disabled={!confirmed || loading}>
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
            <Link to={`/customer/bookings/${id}`} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Keep Booking</Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
