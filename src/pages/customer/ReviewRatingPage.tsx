import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewRatingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || 'b0030000-0000-0000-0000-000000000003';
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const BOOKING = { id: bookingId, roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08' };

  function validate() {
    const e: Record<string, string> = {};
    if (rating === 0) e.rating = 'Please select a rating';
    if (!comment.trim()) e.comment = 'Please share your experience';
    if (comment.length < 10) e.comment = 'Review must be at least 10 characters';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // TODO: await reviewApi.create({ bookingId, rating, comment });
      await new Promise(r => setTimeout(r, 800));
      navigate('/customer/reviews');
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/reviews" className="text-primary" style={{ textDecoration: 'none' }}>My Reviews</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Write Review</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Rate Your Stay</h1>

        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div className="flex items-center gap-12">
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700 }}>{BOOKING.roomNumber} — {BOOKING.roomType}</p>
              <p className="body-sm text-charcoal">{BOOKING.propertyName}</p>
              <p className="body-sm text-charcoal">{BOOKING.checkInDate} → {BOOKING.checkOutDate}</p>
            </div>
            <span className="badge badge-purple">Checked Out</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 16 }}>Overall Rating *</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', transform: (hovered || rating) >= star ? 'scale(1.15)' : 'scale(1)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={(hovered || rating) >= star ? '#ea2804' : '#e5e7eb'} style={{ transition: 'fill 0.15s' }}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{RATING_LABELS[hovered || rating]}</p>}
            {errors.rating && <p className="form-error">{errors.rating}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label form-label-required" htmlFor="comment">Your Review</label>
            <textarea id="comment" className={`textarea ${errors.comment ? 'input-error' : ''}`}
              rows={5} placeholder="Share your experience. What did you love? What could be improved?"
              value={comment} onChange={e => setComment(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.comment ? <p className="form-error">{errors.comment}</p> : <span />}
              <span className="form-hint">{comment.length} chars</span>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Reviews are tied to your booking and can only be submitted once.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Review'}</button>
            <Link to="/customer/reviews" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
