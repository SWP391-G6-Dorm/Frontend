import { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const BOOKINGS_MOCK = [
  { id: 'b0010000-0000-0000-0000-000000000001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED' },
  { id: 'b0020000-0000-0000-0000-000000000002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT' },
  { id: 'b0030000-0000-0000-0000-000000000003', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT' },
  { id: 'b0040000-0000-0000-0000-000000000004', roomNumber: 'Standard 12', roomType: 'Standard', propertyName: 'Phú Quốc Beach House', checkInDate: '2026-03-15', checkOutDate: '2026-03-17', guestCount: 1, totalAmount: 1500000, status: 'CANCELLED' },
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

export default function BookingListPage() {
  const [filter, setFilter] = useState('ALL');
  const TABS = ['ALL', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
  const LABELS: Record<string, string> = { ALL: 'All', PENDING_DEPOSIT: 'Pending', CONFIRMED: 'Confirmed', CHECKED_IN: 'Checked In', CHECKED_OUT: 'Checked Out', CANCELLED: 'Cancelled' };
  const list = filter === 'ALL' ? BOOKINGS_MOCK : BOOKINGS_MOCK.filter(b => b.status === filter);

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">My Bookings</h1>
        <Link to="/rooms" className="btn-primary btn-sm">+ New Booking</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
            {LABELS[tab]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No bookings found</h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Ready to book your next stay?</p>
          <Link to="/rooms" className="btn-primary">Browse Rooms</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(b => (
            <div key={b.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{b.roomNumber} — {b.roomType}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 3 }}>📍 {b.propertyName}</p>
                  <p className="body-sm text-charcoal">📅 {b.checkInDate} → {b.checkOutDate} · {b.guestCount} guests</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>₫{b.totalAmount.toLocaleString()}</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {b.status === 'PENDING_DEPOSIT' && <Link to={`/customer/payments/${b.id}/pay`} className="btn-primary btn-sm">Pay Deposit</Link>}
                    {b.status === 'CHECKED_OUT' && <Link to={`/customer/reviews/create?bookingId=${b.id}`} className="btn-outline btn-sm">Write Review</Link>}
                    <Link to={`/customer/bookings/${b.id}`} className="btn-outline btn-sm">View</Link>
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
