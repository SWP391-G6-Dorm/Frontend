// ─── BookingPages.tsx — SCR-17, 18, 19, 20 ──────────────────────────────────
// Exports: BookingFormPage, BookingListPage, BookingDetailPage, BookingCancellationPage

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { bookingApi, BookingDetailResponse, BookingSummaryResponse } from '../../api/bookingApi';
import { fetchRoomById, RoomDetail } from '../../api/roomsApi';

export const formatBookingId = (uuid: string): string => {
  if (!uuid) return '';
  if (uuid.startsWith('b00') && uuid.length === 36) {
    const match = uuid.match(/^b00([0-9])0000-/);
    if (match) return `B00${match[1]}`;
  }
  const parts = uuid.split('-');
  return parts[0].toUpperCase();
};

const ROOM_MOCK = { id: '1', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop' };

const BOOKINGS_MOCK = [
  { id: 'b0010000-0000-0000-0000-000000000001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout if possible', createdAt: '2026-06-01', isReviewed: false },
  { id: 'b0020000-0000-0000-0000-000000000002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '', createdAt: '2026-06-10', isReviewed: false },
  { id: 'b0030000-0000-0000-0000-000000000003', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT', specialRequests: '', createdAt: '2026-03-20', isReviewed: false },
  { id: 'b0040000-0000-0000-0000-000000000004', roomNumber: 'Standard 12', roomType: 'Standard', propertyName: 'Phú Quốc Beach House', checkInDate: '2026-03-15', checkOutDate: '2026-03-17', guestCount: 1, totalAmount: 1500000, status: 'CANCELLED', specialRequests: '', createdAt: '2026-03-01', isReviewed: false },
];

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending Deposit' },
    CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
    CHECKED_IN:      { cls: 'badge-info',    l: 'Checked In' },
    CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
    CANCELLED:       { cls: 'badge-error',   l: 'Cancelled' },
  };
  const s = m[status] || { cls: 'badge-neutral', l: status };
  return <span className={`badge ${s.cls}`}>{s.l}</span>;
}

// ── SCR-17: Booking Form ────────────────────────────────────────────────────
export function BookingFormPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const [room, setRoom] = useState<RoomDetail | null>(null);

  const [form, setForm] = useState({
    checkInDate:  params.get('checkIn')  || '',
    checkOutDate: params.get('checkOut') || '',
    guestCount:   Number(params.get('guests')) || 1,
    specialRequests: '',
  });
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roomId) {
      fetchRoomById(roomId)
        .then(res => {
          setRoom(res);
          setForm(p => ({
            ...p,
            guestCount: Math.min(p.guestCount, res.capacity)
          }));
        })
        .catch(() => {
          console.error('Failed to load room details');
        })
        .finally(() => {
          setLoadingRoom(false);
        });
    } else {
      setLoadingRoom(false);
    }
  }, [roomId]);

  const pricePerNight = room ? room.pricePerNight : ROOM_MOCK.pricePerNight;
  const capacity = room ? room.capacity : ROOM_MOCK.capacity;
  const roomNumber = room ? room.roomNumber : ROOM_MOCK.roomNumber;
  const roomType = room ? room.roomType : ROOM_MOCK.roomType;
  const propertyName = room ? room.propertyName : ROOM_MOCK.propertyName;

  const nights = form.checkInDate && form.checkOutDate
    ? Math.max(0, Math.ceil((new Date(form.checkOutDate).getTime() - new Date(form.checkInDate).getTime()) / 86400000))
    : 0;
  const totalAmount  = nights * pricePerNight;
  const depositAmount = Math.round(totalAmount * 0.4);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.checkInDate)  e.checkInDate  = 'Check-in date is required';
    if (!form.checkOutDate) e.checkOutDate = 'Check-out date is required';
    if (form.checkInDate && form.checkOutDate && form.checkOutDate <= form.checkInDate)
      e.checkOutDate = 'Check-out must be after check-in';
    if (form.guestCount < 1) e.guestCount = 'At least 1 guest';
    if (form.guestCount > capacity) e.guestCount = `Max capacity is ${capacity}`;
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoadingSubmit(true);

    try {
      if (roomId) {
        const res = await bookingApi.createBooking({
          roomId,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          guestCount: form.guestCount,
          specialRequests: form.specialRequests
        });
        if (res.success && res.data) {
          navigate(`/customer/bookings/${res.data.id}`);
        } else {
          setErrors({ _: res.message || 'Failed to create booking' });
        }
      } else {
        throw new Error('Room ID is missing');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create booking. Please try again.';
      setErrors({ _: msg });
    } finally {
      setLoadingSubmit(false);
    }
  }

  if (loadingRoom) {
    return (
      <CustomerLayout>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p className="body-md text-charcoal">Loading room details...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>My Bookings</Link>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>New Booking</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 24 }}>Book a Room</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
          {/* Form */}
          <div>
            {errors._ && <div className="alert alert-error" style={{ marginBottom: 16 }}>{errors._}</div>}

            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h2 className="heading-sm" style={{ marginBottom: 16 }}>Booking Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="form-label form-label-required">Check-in Date</label>
                  <input type="date" className={`input ${errors.checkInDate ? 'input-error' : ''}`}
                    value={form.checkInDate} onChange={e => setForm(p => ({ ...p, checkInDate: e.target.value }))} />
                  {errors.checkInDate && <p className="form-error">{errors.checkInDate}</p>}
                </div>
                <div>
                  <label className="form-label form-label-required">Check-out Date</label>
                  <input type="date" className={`input ${errors.checkOutDate ? 'input-error' : ''}`}
                    value={form.checkOutDate} onChange={e => setForm(p => ({ ...p, checkOutDate: e.target.value }))} />
                  {errors.checkOutDate && <p className="form-error">{errors.checkOutDate}</p>}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label form-label-required">Guests</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" className="btn-outline" style={{ width: 36, height: 36, padding: 0 }}
                    onClick={() => setForm(p => ({ ...p, guestCount: Math.max(1, p.guestCount - 1) }))} disabled={form.guestCount <= 1}>−</button>
                  <input type="number" readOnly className="input" style={{ width: 60, textAlign: 'center', height: 36 }} value={form.guestCount} />
                  <button type="button" className="btn-outline" style={{ width: 36, height: 36, padding: 0 }}
                    onClick={() => setForm(p => ({ ...p, guestCount: Math.min(capacity, p.guestCount + 1) }))} disabled={form.guestCount >= capacity}>+</button>
                </div>
                <p className="body-sm text-charcoal" style={{ marginTop: 4 }}>Max capacity: {capacity} guests</p>
              </div>
              <div>
                <label className="form-label">Special Requests</label>
                <textarea className="textarea" rows={4} placeholder="E.g., early check-in, dynamic beds..."
                  value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Pricing Panel */}
          <div>
            <div className="card-lg" style={{ padding: 24, marginBottom: 16 }}>
              <h3 className="heading-sm" style={{ marginBottom: 16 }}>Room Details</h3>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{roomNumber} — {roomType}</p>
              <p className="body-sm text-charcoal" style={{ marginBottom: 12 }}>{propertyName}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="body-sm text-charcoal">Price per night</span>
                <span style={{ fontWeight: 600 }}>₫{pricePerNight.toLocaleString()}</span>
              </div>
              {nights > 0 && (
                <>
                  <div className="divider" style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">₫{pricePerNight.toLocaleString()} × {nights} nights</span>
                    <span style={{ fontWeight: 600 }}>₫{totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">Total Amount</span>
                    <span style={{ fontWeight: 700 }}>₫{totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">Deposit Required (40%)</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₫{depositAmount.toLocaleString()}</span>
                  </div>
                </>
              )}
              <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={handleSubmit} disabled={loadingSubmit}>
                {loadingSubmit ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-18: Booking List ────────────────────────────────────────────────────
export function BookingListPage() {
  const [filter, setFilter] = useState('ALL');
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const TABS = ['ALL', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
  const LABELS: Record<string, string> = { ALL: 'All', PENDING_DEPOSIT: 'Pending', CONFIRMED: 'Confirmed', CHECKED_IN: 'Checked In', CHECKED_OUT: 'Checked Out', CANCELLED: 'Cancelled' };

  useEffect(() => {
    setLoading(true);
    setApiError(null);
    bookingApi.getAllBookings({ page: 0, size: 100, status: filter === 'ALL' ? undefined : filter })
      .then(res => {
        if (res.success && res.data) {
          setBookings(res.data.content);
        } else {
          setApiError('Failed to load bookings');
        }
      })
      .catch(err => {
        setApiError(err.response?.data?.message || 'Failed to load bookings');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filter]);

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">My Bookings</h1>
        <Link to="/rooms" className="btn-primary btn-sm">+ New Booking</Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
            {LABELS[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p className="body-md text-charcoal">Loading bookings...</p>
        </div>
      ) : apiError ? (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>{apiError}</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No bookings found</h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Ready to book your next stay?</p>
          <Link to="/rooms" className="btn-primary">Browse Rooms</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bookings.map(b => (
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
                    {b.status === 'PENDING_DEPOSIT' && (
                      <Link to={`/customer/payments/${b.id}/pay`} className="btn-primary btn-sm">Pay Deposit</Link>
                    )}
                    {b.status === 'CHECKED_OUT' && !b.isReviewed && (
                      <Link to={`/customer/reviews/create?bookingId=${b.id}`} className="btn-outline btn-sm">Write Review</Link>
                    )}
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

// ── SCR-19: Booking Detail ────────────────────────────────────────────────────
export function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      bookingApi.getBookingDetail(id)
        .then(res => {
          if (res.success && res.data) {
            setBooking(res.data);
          } else {
            setError('Failed to load booking details');
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load booking details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <CustomerLayout>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p className="body-md text-charcoal">Loading booking details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !booking) {
    return (
      <CustomerLayout>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 0' }}>
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {error || 'Booking details not found'}
          </div>
          <Link to="/customer/bookings" className="btn-primary">Back to Bookings</Link>
        </div>
      </CustomerLayout>
    );
  }

  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000);
  const depositPaid = booking.status !== 'PENDING_DEPOSIT';
  const depositAmount = Math.round(booking.totalAmount * 0.4);
  const remainingAmount = booking.totalAmount - depositAmount;

  return (
    <CustomerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>My Bookings</Link>
        <span>›</span>
        <span className="text-ink" style={{ fontWeight: 600 }}>Booking #{formatBookingId(booking.id)}</span>
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: 4 }}>Booking #{formatBookingId(booking.id)}</h1>
          <p className="body-sm text-charcoal">Created on {new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Room Info */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Room Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Room', value: `${booking.roomNumber} — ${booking.roomType}` },
                { label: 'Property', value: booking.propertyName },
                { label: 'Check-in', value: booking.checkInDate },
                { label: 'Check-out', value: booking.checkOutDate },
                { label: 'Duration', value: `${nights} nights` },
                { label: 'Guests', value: `${booking.guestCount} guest(s)` },
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

          {/* Payment Status */}
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

        {/* Actions Panel */}
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
              <Link to={`/customer/payments/${booking.id}/pay`} className="btn-outline" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 16 }}>
                Pay Remaining Balance
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

// ── SCR-20: Booking Cancellation ─────────────────────────────────────────────
export function BookingCancellationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      bookingApi.getBookingDetail(id)
        .then(res => {
          if (res.success && res.data) {
            setBooking(res.data);
          } else {
            setError('Failed to load booking details');
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load booking details');
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [id]);

  async function handleCancel() {
    if (!booking) return;
    setLoadingCancel(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      alert('Cancellation request submitted successfully (Development simulation)');
      navigate('/customer/bookings');
    } catch {
      setLoadingCancel(false);
    }
  }

  if (loadingDetail) {
    return (
      <CustomerLayout>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p className="body-md text-charcoal">Loading booking details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !booking) {
    return (
      <CustomerLayout>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 0' }}>
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {error || 'Booking details not found'}
          </div>
          <Link to="/customer/bookings" className="btn-primary">Back to Bookings</Link>
        </div>
      </CustomerLayout>
    );
  }

  const depositAmount = Math.round(booking.totalAmount * 0.4);
  const depositPaid   = booking.status !== 'PENDING_DEPOSIT';

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={`/customer/bookings/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>Booking #{formatBookingId(id || '')}</Link>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>Cancel Booking</span>
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
            <button className="btn-danger" style={{ flex: 1 }} onClick={handleCancel} disabled={!confirmed || loadingCancel}>
              {loadingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
            <Link to={`/customer/bookings/${id}`} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Keep Booking</Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
