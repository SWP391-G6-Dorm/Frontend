import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { reviewApi, type Review } from '../../api/reviewApi';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= rating ? 'var(--primary)' : '#e5e7eb'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
      <span className="body-sm text-charcoal" style={{ marginLeft: 4 }}>{rating}/5</span>
    </div>
  );
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await reviewApi.getMyReviews({ page: 0, size: 20 });
        if (!cancelled) {
          setReviews(res.success && res.data?.content ? res.data.content : []);
        }
      } catch {
        if (!cancelled) setError('Không tải được danh sách đánh giá. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">My Reviews</h1>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 24, height: 120, background: 'var(--surface-bone)' }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No reviews yet</h3>
          <p className="body-md text-charcoal">You can review a room after your stay (Checked Out status).</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
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
                    <p className="body-sm text-charcoal">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <p className="body-md text-body" style={{ lineHeight: 1.65 }}>{r.comment}</p>
                  <p className="body-sm text-charcoal" style={{ marginTop: 8 }}>
                    Booking:{' '}
                    <Link to={`/customer/bookings/${r.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
                      {r.bookingId.slice(0, 8).toUpperCase()}
                    </Link>
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
