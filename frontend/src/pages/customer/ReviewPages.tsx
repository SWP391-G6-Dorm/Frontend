// ─── ReviewPages.tsx — SCR-30, 31 ────────────────────────────────────────────
// Exports: ReviewRatingPage, MyReviewsPage

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { bookingApi, BookingDetailResponse } from '../../api/bookingApi';
import { reviewApi, Review } from '../../api/reviewApi';
import Modal from '../../components/ui/Modal';

export const formatBookingId = (uuid: string): string => {
  if (!uuid) return '';
  if (uuid.startsWith('b00') && uuid.length === 36) {
    const match = uuid.match(/^b00([0-9])0000-/);
    if (match) return `B00${match[1]}`;
  }
  const parts = uuid.split('-');
  return parts[0].toUpperCase();
};

// ── SCR-30: Review & Rating Form ─────────────────────────────────────────────
const BOOKINGS_MOCK = [
  { id: 'b0010000-0000-0000-0000-000000000001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout if possible', createdAt: '2026-06-01', isReviewed: false },
  { id: 'b0020000-0000-0000-0000-000000000002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '', createdAt: '2026-06-10', isReviewed: false },
  { id: 'b0030000-0000-0000-0000-000000000003', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT', specialRequests: '', createdAt: '2026-03-20', isReviewed: false },
  { id: 'b0040000-0000-0000-0000-000000000004', roomNumber: 'Standard 12', roomType: 'Standard', propertyName: 'Phú Quốc Beach House', checkInDate: '2026-03-15', checkOutDate: '2026-03-17', guestCount: 1, totalAmount: 1500000, status: 'CANCELLED', specialRequests: '', createdAt: '2026-03-01', isReviewed: false },
];

export function ReviewRatingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');

  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const isUuid = (str: string | null): boolean => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  useEffect(() => {
    if (!bookingId) {
      setApiError('Booking ID is missing');
      setLoadingBooking(false);
      return;
    }

    if (!isUuid(bookingId)) {
      // Mock Fallback
      const mockBooking = BOOKINGS_MOCK.find(b => b.id === bookingId);
      if (mockBooking) {
        const reviewedBookingsStr = localStorage.getItem('reviewed_mock_bookings') || '[]';
        const reviewedBookings = JSON.parse(reviewedBookingsStr);
        const isReviewed = reviewedBookings.includes(mockBooking.id);

        setBooking({
          id: mockBooking.id,
          customerId: 'dev-customer-id',
          customerName: 'Dev Customer',
          customerEmail: 'customer@dev.local',
          customerPhone: '0987654321',
          roomNumber: mockBooking.roomNumber,
          roomType: mockBooking.roomType,
          propertyName: mockBooking.propertyName,
          checkInDate: mockBooking.checkInDate,
          checkOutDate: mockBooking.checkOutDate,
          guestCount: mockBooking.guestCount,
          totalAmount: mockBooking.totalAmount,
          depositAmount: Math.round(mockBooking.totalAmount * 0.4),
          remainingAmount: Math.round(mockBooking.totalAmount * 0.6),
          status: mockBooking.status,
          specialRequests: mockBooking.specialRequests,
          createdAt: mockBooking.createdAt,
          isReviewed: isReviewed
        });
      } else {
        setApiError('Booking details not found in mock data');
      }
      setLoadingBooking(false);
    } else {
      // Real API Call
      bookingApi.getBookingDetail(bookingId)
        .then(res => {
          if (res.success && res.data) {
            setBooking(res.data);
          } else {
            setApiError('Failed to load booking details');
          }
        })
        .catch(() => {
          setApiError('Failed to load booking details');
        })
        .finally(() => {
          setLoadingBooking(false);
        });
    }
  }, [bookingId]);

  function validate() {
    const e: Record<string, string> = {};
    if (rating === 0) e.rating = 'Please select a rating';
    if (!comment.trim()) {
      e.comment = 'Please share your experience';
    } else if (comment.length < 20) {
      e.comment = 'Review must be at least 20 characters';
    } else if (comment.length > 200) {
      e.comment = 'Review must not exceed 200 characters';
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId) return;

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setApiError(null);
    setLoadingSubmit(true);

    if (!isUuid(bookingId)) {
      // Mock submit simulation in development
      try {
        await new Promise(r => setTimeout(r, 800));

        // Save mock review to localStorage
        const mockReviewsStr = localStorage.getItem('mock_reviews') || '[]';
        const mockReviews = JSON.parse(mockReviewsStr);
        const newMockReview = {
          id: `mock-review-${Date.now()}`,
          bookingId: bookingId,
          roomNumber: booking?.roomNumber || 'Suite 03',
          propertyName: booking?.propertyName || 'Hội An Garden Villa',
          rating: rating,
          comment: comment,
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          roomImageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=80&h=80&fit=crop'
        };
        mockReviews.unshift(newMockReview);
        localStorage.setItem('mock_reviews', JSON.stringify(mockReviews));

        // Save reviewed bookingId state
        const reviewedBookingsStr = localStorage.getItem('reviewed_mock_bookings') || '[]';
        const reviewedBookings = JSON.parse(reviewedBookingsStr);
        if (!reviewedBookings.includes(bookingId)) {
          reviewedBookings.push(bookingId);
          localStorage.setItem('reviewed_mock_bookings', JSON.stringify(reviewedBookings));
        }

        alert('Review submitted successfully (Simulation mode for mock booking ' + bookingId + ' - Saved to localStorage)');
        navigate('/customer/reviews');
      } catch (err) {
        setApiError('Failed to submit review simulation');
        setLoadingSubmit(false);
      }
    } else {
      // Real submit
      try {
        const res = await reviewApi.createReview({
          bookingId,
          rating,
          comment
        });
        if (res.success) {
          navigate('/customer/reviews');
        } else {
          setApiError(res.message || 'Failed to submit review');
          setLoadingSubmit(false);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to submit review';
        setApiError(msg);
        setLoadingSubmit(false);
      }
    }
  }

  if (loadingBooking) {
    return (
      <CustomerLayout>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p className="body-md text-charcoal">Loading booking details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (apiError && !booking) {
    return (
      <CustomerLayout>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 0' }}>
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {apiError}
          </div>
          <Link to="/customer/bookings" className="btn-primary">Back to Bookings</Link>
        </div>
      </CustomerLayout>
    );
  }

  if (booking && booking.isReviewed) {
    return (
      <CustomerLayout>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 0' }}>
          <div className="alert alert-info" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            This booking has already been reviewed. You can view or edit your review on the My Reviews page.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/customer/reviews" className="btn-primary" style={{ textDecoration: 'none' }}>Go to My Reviews</Link>
            <Link to="/customer/bookings" className="btn-ghost" style={{ textDecoration: 'none' }}>Back to Bookings</Link>
          </div>
        </div>
      </CustomerLayout>
    );
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

        {apiError && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {apiError}
          </div>
        )}

        {/* Booking info */}
        {booking && (
          <div className="card" style={{ padding: 18, marginBottom: 20 }}>
            <div className="flex items-center gap-12">
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>{booking.roomNumber} — {booking.roomType}</p>
                <p className="body-sm text-charcoal">{booking.propertyName}</p>
                <p className="body-sm text-charcoal">{booking.checkInDate} → {booking.checkOutDate}</p>
              </div>
              <span className="badge badge-success">Checked Out</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          {/* Star rating */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 16 }}>Overall Rating *</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', transform: (hovered || rating) >= star ? 'scale(1.15)' : 'scale(1)' }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={(hovered || rating) >= star ? 'var(--primary)' : '#e5e7eb'} style={{ transition: 'fill 0.15s' }}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{RATING_LABELS[hovered || rating]}</p>
            )}
            {errors.rating && <p className="form-error">{errors.rating}</p>}
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label form-label-required" htmlFor="comment">Your Review (20 - 200 characters)</label>
            <textarea id="comment" className={`textarea ${errors.comment ? 'input-error' : ''}`}
              rows={5} placeholder="Share your experience. What did you love? What could be improved?"
              value={comment} onChange={e => setComment(e.target.value)} maxLength={250} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.comment ? <p className="form-error">{errors.comment}</p> : <span />}
              <span className="form-hint" style={{ color: comment.length < 20 || comment.length > 200 ? 'var(--error)' : 'var(--charcoal)' }}>
                {comment.length} / 200 chars (Min 20)
              </span>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Reviews are tied to your booking and can only be submitted once.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loadingSubmit}>
              {loadingSubmit ? 'Submitting...' : 'Submit Review'}
            </button>
            <Link to="/customer/bookings" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-31: My Reviews List & CRUD ─────────────────────────────────────────────
export function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHovered, setEditHovered] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const fetchReviews = () => {
    setLoading(true);
    setApiError(null);

    // 1. Load mock reviews from localStorage
    const mockReviewsStr = localStorage.getItem('mock_reviews') || '[]';
    const localMockReviews: Review[] = JSON.parse(mockReviewsStr);

    // 2. Fetch real reviews from API
    reviewApi.getMyReviews({ page, size: 5 })
      .then(res => {
        if (res.success && res.data) {
          const apiContent = res.data.content;
          const combinedContent = page === 0 ? [...localMockReviews, ...apiContent] : apiContent;
          setReviews(combinedContent);
          setTotalPages(res.data.totalPages || (localMockReviews.length > 0 ? 1 : 0));
        } else {
          if (page === 0) {
            setReviews(localMockReviews);
            setTotalPages(localMockReviews.length > 0 ? 1 : 0);
          } else {
            setApiError(res.message || 'Failed to fetch reviews');
          }
        }
      })
      .catch(err => {
        if (page === 0) {
          setReviews(localMockReviews);
          setTotalPages(localMockReviews.length > 0 ? 1 : 0);
        } else {
          setApiError(err.response?.data?.message || 'Failed to fetch reviews');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

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

  // CRUD Actions
  const handleStartEdit = (r: Review) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (editRating === 0) {
      setEditError('Please select a rating');
      return;
    }
    if (!editComment.trim()) {
      setEditError('Please share your experience');
      return;
    }
    if (editComment.length < 20 || editComment.length > 200) {
      setEditError('Review must be between 20 and 200 characters');
      return;
    }

    setEditError(null);
    setSubmittingEdit(true);

    if (id.startsWith('mock-')) {
      try {
        await new Promise(r => setTimeout(r, 500));
        const mockReviewsStr = localStorage.getItem('mock_reviews') || '[]';
        const mockReviews: Review[] = JSON.parse(mockReviewsStr);
        const updated = mockReviews.map(r => r.id === id ? { ...r, rating: editRating, comment: editComment } : r);
        localStorage.setItem('mock_reviews', JSON.stringify(updated));
        setEditingId(null);
        fetchReviews();
      } catch (err) {
        setEditError('Failed to update mock review');
      } finally {
        setSubmittingEdit(false);
      }
    } else {
      try {
        const res = await reviewApi.updateReview(id, {
          rating: editRating,
          comment: editComment
        });
        if (res.success) {
          setEditingId(null);
          fetchReviews();
        } else {
          setEditError(res.message || 'Failed to update review');
        }
      } catch (err: any) {
        setEditError(err.response?.data?.message || 'Failed to update review');
      } finally {
        setSubmittingEdit(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id: string) => {
    setDeleteConfirmId(null);
    if (id.startsWith('mock-')) {
      const mockReviewsStr = localStorage.getItem('mock_reviews') || '[]';
      const mockReviews: Review[] = JSON.parse(mockReviewsStr);
      const targetReview = mockReviews.find(r => r.id === id);
      const filtered = mockReviews.filter(r => r.id !== id);
      localStorage.setItem('mock_reviews', JSON.stringify(filtered));

      if (targetReview) {
        const reviewedBookingsStr = localStorage.getItem('reviewed_mock_bookings') || '[]';
        const reviewedBookings = JSON.parse(reviewedBookingsStr);
        const updatedBookings = reviewedBookings.filter((bId: string) => bId !== targetReview.bookingId);
        localStorage.setItem('reviewed_mock_bookings', JSON.stringify(updatedBookings));
      }

      fetchReviews();
    } else {
      try {
        const res = await reviewApi.deleteReview(id);
        if (res.success) {
          // If it is the last item on page and page > 0, go back a page
          if (reviews.length === 1 && page > 0) {
            setPage(page - 1);
          } else {
            fetchReviews();
          }
        } else {
          alert(res.message || 'Failed to delete review');
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete review');
      }
    }
  };

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">My Reviews</h1>
      </div>

      {apiError && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {apiError}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p className="body-md text-charcoal">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No reviews yet</h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 20 }}>You can review a room after your stay (Checked Out status).</p>
          <Link to="/customer/bookings" className="btn-primary">View My Bookings</Link>
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
                  {editingId === r.id ? (
                    /* Inline Editing Mode */
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Editing review for {r.roomNumber} — {r.propertyName}</p>
                      
                      {editError && (
                        <div className="form-error" style={{ marginBottom: 12 }}>{editError}</div>
                      )}

                      {/* Edit Star Rating */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            onMouseEnter={() => setEditHovered(star)}
                            onMouseLeave={() => setEditHovered(0)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={(editHovered || editRating) >= star ? 'var(--primary)' : '#e5e7eb'} style={{ transition: 'fill 0.15s' }}>
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                            </svg>
                          </button>
                        ))}
                        {(editHovered || editRating) > 0 && (
                          <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13, marginLeft: 6 }}>
                            {RATING_LABELS[editHovered || editRating]}
                          </span>
                        )}
                      </div>

                      {/* Edit Comment Textarea */}
                      <textarea
                        className="textarea"
                        rows={3}
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                        placeholder="Write your review here (20 - 200 characters)..."
                        maxLength={250}
                        style={{ width: '100%', marginBottom: 8 }}
                      />
                      <p className="form-hint" style={{ textAlign: 'right', marginBottom: 12, color: editComment.length < 20 || editComment.length > 200 ? 'var(--error)' : 'var(--charcoal)' }}>
                        {editComment.length} / 200 chars (Min 20)
                      </p>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary btn-sm" disabled={submittingEdit} onClick={() => handleSaveEdit(r.id)}>
                          {submittingEdit ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn-ghost btn-sm" disabled={submittingEdit} onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div>
                      <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{r.roomNumber} — {r.propertyName}</p>
                          <StarDisplay rating={r.rating} />
                        </div>
                        <p className="body-sm text-charcoal">{new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <p className="body-md text-body" style={{ lineHeight: 1.65, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{r.comment}</p>
                      <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                        <p className="body-sm text-charcoal" style={{ margin: 0 }}>
                          Booking: <Link to={`/customer/bookings/${r.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>#{formatBookingId(r.bookingId)}</Link>
                        </p>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button className="btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: '4px 8px' }} onClick={() => handleStartEdit(r)}>
                            Edit
                          </button>
                          <button className="btn-ghost btn-sm" style={{ color: 'var(--error)', padding: '4px 8px' }} onClick={() => handleDelete(r.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-12" style={{ marginTop: 24 }}>
          <button
            className="btn-outline btn-sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="body-sm text-charcoal">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn-outline btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Review"
        size="sm"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setDeleteConfirmId(null),
            variant: 'secondary',
          },
          {
            label: 'Delete',
            onClick: () => deleteConfirmId && executeDelete(deleteConfirmId),
            variant: 'primary',
          },
        ]}
      >
        <p className="body-md text-charcoal" style={{ margin: 0 }}>
          Are you sure you want to delete this review? This action cannot be undone.
        </p>
      </Modal>
    </CustomerLayout>
  );
}
