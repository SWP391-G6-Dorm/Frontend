import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const MY_REVIEWS = [
  { id: 'R001', bookingId: 'B003', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', rating: 5, comment: 'Absolutely stunning villa! The garden view was breathtaking and the staff was incredibly welcoming.', createdAt: '2026-04-10T09:00:00', roomImageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=80&h=80&fit=crop' },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= rating ? '#ea2804' : '#e5e7eb'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
      <span className="body-sm text-charcoal" style={{ marginLeft: 4 }}>{rating}/5</span>
    </div>
  );
}

export default function MyReviewsPage() {
  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">My Reviews</h1>
      </div>

      {MY_REVIEWS.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No reviews yet</h3>
          <p className="body-md text-charcoal">You can review a room after your stay (Checked Out status).</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MY_REVIEWS.map(r => (
            <div key={r.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {r.roomImageUrl && (
                  <img src={r.roomImageUrl} alt={r.roomNumber} style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{r.roomNumber} — {r.propertyName}</p>
                      <StarDisplay rating={r.rating} />
                    </div>
                    <p className="body-sm text-charcoal">{new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <p className="body-md text-body" style={{ lineHeight: 1.65 }}>{r.comment}</p>
                  <p className="body-sm text-charcoal" style={{ marginTop: 8 }}>
                    Booking: <Link to={`/customer/bookings/${r.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>{r.bookingId}</Link>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}
