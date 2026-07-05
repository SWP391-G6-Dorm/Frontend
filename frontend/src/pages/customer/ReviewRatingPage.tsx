import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { reviewApi } from '../../api/reviewApi';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewRatingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId    = params.get('bookingId')     || '';
  const roomNumber   = params.get('roomNumber')    || 'Room';
  const roomType     = params.get('roomType')      || '';
  const propertyName = params.get('propertyName')  || '';
  const checkInDate  = params.get('checkIn')       || '';
  const checkOutDate = params.get('checkOut')      || '';

  const [rating, setRating]         = useState(0);
  const [hovered, setHovered]       = useState(0);
  const [comment, setComment]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (rating === 0) e.rating = 'Please select a rating';
    if (!comment.trim()) e.comment = 'Please share your experience';
    else if (comment.trim().length < 10) e.comment = 'Review must be at least 10 characters';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await reviewApi.createReview({ bookingId, rating, comment });
      if (!res.success) {
        setSubmitError(res.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
        return;
      }
      navigate('/customer/reviews');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/reviews" className="text-primary" style={{ textDecoration: 'none' }}>My Reviews</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Write Review</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Rate Your Stay</h1>

        {/* Booking summary */}
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div className="flex items-center gap-12">
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700 }}>{roomNumber}{roomType ? ` — ${roomType}` : ''}</p>
              {propertyName && <p className="body-sm text-charcoal">{propertyName}</p>}
              {checkInDate && checkOutDate && (
                <p className="body-sm text-charcoal">{checkInDate} → {checkOutDate}</p>
              )}
            </div>
            <span className="badge badge-purple">Checked Out</span>
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          {/* Star Rating — interactive hover */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 16 }}>Overall Rating *</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'transform 0.1s',
                    transform: (hovered || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                  }}>
                  <svg width="40" height="40" viewBox="0 0 24 24"
                    fill={(hovered || rating) >= star ? 'var(--primary)' : '#e5e7eb'}
                    style={{ transition: 'fill 0.15s' }}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>
                {RATING_LABELS[hovered || rating]}
              </p>
            )}
            {errors.rating && <p className="form-error">{errors.rating}</p>}
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label form-label-required" htmlFor="review-comment">Your Review</label>
            <textarea
              id="review-comment"
              className={`textarea ${errors.comment ? 'input-error' : ''}`}
              rows={5}
              placeholder="Share your experience. What did you love? What could be improved?"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.comment ? <p className="form-error">{errors.comment}</p> : <span />}
              <span className="form-hint">{comment.length} chars</span>
            </div>
          </div>

          {/* Info */}
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Reviews are tied to your booking and can only be submitted once.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
            <Link to="/customer/reviews" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
