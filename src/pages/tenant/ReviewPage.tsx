import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-33 — Review & Rating
// Entity: Review
// Fields: Review.tenant · Review.room · Review.rating (1-5) · Review.comment · Review.moderationStatus · Review.createdAt

const EXISTING_REVIEWS = [
  { id: 'rev-001', rating: 5, comment: 'Excellent room! Very clean and the landlord is very responsive. The AC works perfectly and WiFi speed is great.', createdAt: '2025-04-12', moderationStatus: 'VISIBLE', room: 'A-301' },
];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform"
          style={{ fontSize: 36, background: 'none', border: 'none', cursor: 'pointer', transform: (hovered || value) >= star ? 'scale(1.15)' : 'scale(1)' }}
        >
          <span style={{ color: (hovered || value) >= star ? '#ea2804' : 'var(--stone)' }}>★</span>
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

export default function ReviewPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Demo: room from active contract
  const room = { id: 'r-001', roomNumber: 'A-301', roomType: 'Studio', propertyName: 'Sunset Apartments' };

  function validate() {
    const e: Record<string, string> = {};
    if (rating === 0) e.rating = 'Please select a rating.';
    if (!comment.trim()) e.comment = 'Please write a comment.';
    if (comment.length > 0 && comment.length < 10) e.comment = 'Comment must be at least 10 characters.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    // POST Review.moderationStatus = VISIBLE (or pending moderation)
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        <h1 className="heading-lg mb-5" style={{ color: 'var(--ink)' }}>Reviews</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Existing reviews */}
          <div>
            <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>My Reviews</h2>
            {EXISTING_REVIEWS.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-2">⭐</div>
                <p className="body-md" style={{ color: 'var(--charcoal)' }}>You haven't left any reviews yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {EXISTING_REVIEWS.map(rev => (
                  <div key={rev.id} className="card" style={{ padding: 20 }}>
                    <div className="flex items-center gap-2 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ color: s <= rev.rating ? '#ea2804' : 'var(--stone)', fontSize: 16 }}>★</span>
                      ))}
                      <span className="body-sm font-semibold ml-1" style={{ color: 'var(--ink)' }}>{rev.rating}/5</span>
                    </div>
                    <p className="body-sm" style={{ color: 'var(--body)' }}>{rev.comment}</p>
                    <div className="flex justify-between mt-3">
                      <p className="caption" style={{ color: 'var(--ash)' }}>Room {rev.room} · {rev.createdAt}</p>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>{rev.moderationStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write new review */}
          <div>
            <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>
              {submitted ? 'Thank You!' : 'Write a Review'}
            </h2>

            {submitted ? (
              <div className="card p-8 text-center animate-fade-in">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>Review Submitted!</h3>
                <p className="body-md mb-5" style={{ color: 'var(--charcoal)' }}>
                  Your review will be visible after moderation. Thank you for your feedback!
                </p>
                <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--surface-bone)', textAlign: 'left' }}>
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= rating ? '#ea2804' : 'var(--stone)', fontSize: 18 }}>★</span>)}
                  </div>
                  <p className="body-sm" style={{ color: 'var(--body)' }}>{comment}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setSubmitted(false); setRating(0); setComment(''); }} className="btn-outline" style={{ height: 40, padding: '0 20px' }}>
                    Write Another
                  </button>
                  <Link to="/tenant/dashboard" className="btn-primary" style={{ height: 40, padding: '0 20px', textDecoration: 'none' }}>
                    Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: 24 }}>
                  {/* Room info */}
                  <div className="rounded-lg p-3 mb-5" style={{ background: 'var(--surface-bone)' }}>
                    <p className="caption mb-1" style={{ color: 'var(--ash)' }}>Reviewing</p>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {room.roomNumber} — {room.roomType}
                    </p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{room.propertyName}</p>
                  </div>

                  {/* Review.rating (1-5) */}
                  <div className="mb-5">
                    <label className="label-sm block mb-3" style={{ color: 'var(--ink)' }}>
                      Rating <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <StarInput value={rating} onChange={setRating} />
                    {rating > 0 && (
                      <p className="body-sm mt-2 font-semibold" style={{ color: 'var(--primary)' }}>
                        {RATING_LABELS[rating]}
                      </p>
                    )}
                    {errors.rating && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.rating}</p>}
                  </div>

                  {/* Review.comment */}
                  <div className="mb-5">
                    <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                      Your Review <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <textarea
                      id="review-comment"
                      className="textarea-field"
                      rows={5}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      maxLength={1000}
                      placeholder="Share your experience — room condition, landlord responsiveness, facilities, value for money…"
                    />
                    <div className="flex justify-between mt-1">
                      {errors.comment
                        ? <p className="caption" style={{ color: 'var(--error)' }}>{errors.comment}</p>
                        : <span />
                      }
                      <p className="caption" style={{ color: 'var(--ash)' }}>{comment.length}/1000</p>
                    </div>
                  </div>

                  <div className="alert alert-info mb-5">
                    Reviews with <strong>moderationStatus = VISIBLE</strong> will appear on the room's public page.
                  </div>

                  <button
                    id="review-submit"
                    type="submit"
                    className="btn-primary w-full"
                    style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
                    disabled={loading || rating === 0}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        Submitting…
                      </span>
                    ) : '⭐ Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
