// ─── BookingPages.tsx — SCR-17, 18, 19, 20 ──────────────────────────────────
// Exports: BookingFormPage, BookingListPage, BookingDetailPage, BookingCancellationPage

import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const ROOM_MOCK = { id: '1', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop' };

const BOOKINGS_MOCK = [
  { id: 'B001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout if possible', createdAt: '2026-06-01' },
  { id: 'B002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '', createdAt: '2026-06-10' },
  { id: 'B003', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT', specialRequests: '', createdAt: '2026-03-20' },
  { id: 'B004', roomNumber: 'Standard 12', roomType: 'Standard', propertyName: 'Phú Quốc Beach House', checkInDate: '2026-03-15', checkOutDate: '2026-03-17', guestCount: 1, totalAmount: 1500000, status: 'CANCELLED', specialRequests: '', createdAt: '2026-03-01' },
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
  const [form, setForm] = useState({
    checkInDate:  params.get('checkIn')  || '',
    checkOutDate: params.get('checkOut') || '',
    guestCount:   Number(params.get('guests')) || 1,
    specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nights = form.checkInDate && form.checkOutDate
    ? Math.max(0, Math.ceil((new Date(form.checkOutDate).getTime() - new Date(form.checkInDate).getTime()) / 86400000))
    : 0;
  const totalAmount  = nights * ROOM_MOCK.pricePerNight;
  const depositAmount = Math.round(totalAmount * 0.4);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.checkInDate)  e.checkInDate  = 'Check-in date is required';
    if (!form.checkOutDate) e.checkOutDate = 'Check-out date is required';
    if (form.checkInDate && form.checkOutDate && form.checkOutDate <= form.checkInDate)
      e.checkOutDate = 'Check-out must be after check-in';
    if (form.guestCount < 1) e.guestCount = 'At least 1 guest';
    if (form.guestCount > ROOM_MOCK.capacity) e.guestCount = `Max capacity is ${ROOM_MOCK.capacity}`;
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // TODO: const res = await bookingApi.create({ roomId, ...form });
      await new Promise(r => setTimeout(r, 800));
      navigate('/customer/bookings/B001');
    } catch {
      setErrors({ _: 'Failed to create booking. Please try again.' });
    } finally {
      setLoading(false);
    }
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
                <label className="form-label form-label-required">Number of Guests</label>
                <input type="number" min={1} max={ROOM_MOCK.capacity} className={`input ${errors.guestCount ? 'input-error' : ''}`}
                  value={form.guestCount} onChange={e => setForm(p => ({ ...p, guestCount: +e.target.value }))} />
                {errors.guestCount && <p className="form-error">{errors.guestCount}</p>}
                <p className="form-hint">Max capacity: {ROOM_MOCK.capacity} guests</p>
              </div>
              <div>
                <label className="form-label">Special Requests (optional)</label>
                <textarea className="textarea" rows={3} placeholder="Any special requests or notes..."
                  value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} />
              </div>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>How booking works</p>
                <p className="body-sm">Submit your booking request, then pay a 40% deposit to confirm. Your contract will be emailed automatically.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={loading || nights === 0}>
                {loading ? 'Submitting...' : 'Submit Booking Request'}
              </button>
              <Link to={`/rooms/${roomId}`} className="btn-ghost">Cancel</Link>
            </div>
          </div>

          {/* Room Summary */}
          <div className="card-lg" style={{ padding: 22 }}>
            <img src={ROOM_MOCK.primaryImageUrl} alt={ROOM_MOCK.roomNumber} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} />
            <p className="body-sm text-charcoal">{ROOM_MOCK.propertyName}</p>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '4px 0 8px' }}>{ROOM_MOCK.roomNumber} — {ROOM_MOCK.roomType}</h3>
            <div className="flex gap-3 body-sm text-charcoal" style={{ marginBottom: 16 }}>
              <span>👥 {ROOM_MOCK.capacity} max</span>
              <span>📐 {ROOM_MOCK.area}m²</span>
            </div>
            <div className="divider" style={{ marginBottom: 14 }} />
            {nights > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="body-sm text-charcoal">₫{ROOM_MOCK.pricePerNight.toLocaleString()} × {nights} nights</span>
                  <span style={{ fontWeight: 600 }}>₫{totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--ink)' }}>₫{totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ background: '#fff1ee', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>Deposit required (40%)</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₫{depositAmount.toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="body-sm text-charcoal" style={{ textAlign: 'center' }}>Select dates to see pricing</p>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-18: Booking List ────────────────────────────────────────────────────
export function BookingListPage() {
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

      {/* Tabs */}
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
                    {b.status === 'PENDING_DEPOSIT' && (
                      <Link to={`/customer/payments/${b.id}/pay`} className="btn-primary btn-sm">Pay Deposit</Link>
                    )}
                    {b.status === 'CHECKED_OUT' && (
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
  const booking = BOOKINGS_MOCK.find(b => b.id === id) || BOOKINGS_MOCK[0];

  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000);
  const depositPaid = booking.status !== 'PENDING_DEPOSIT';
  const depositAmount = Math.round(booking.totalAmount * 0.4);
  const remainingAmount = booking.totalAmount - depositAmount;

  return (
    <CustomerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>My Bookings</Link>
        <span>›</span>
        <span className="text-ink" style={{ fontWeight: 600 }}>Booking {booking.id}</span>
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

          {/* Payment Timeline */}
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

// ── SCR-20: Booking Cancellation ─────────────────────────────────────────────
export function BookingCancellationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const booking = BOOKINGS_MOCK.find(b => b.id === id) || BOOKINGS_MOCK[0];
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      // TODO: await bookingApi.cancel(booking.id);
      await new Promise(r => setTimeout(r, 800));
      navigate('/customer/bookings');
    } catch {
      setLoading(false);
    }
  }

  const depositAmount = Math.round(booking.totalAmount * 0.4);
  const depositPaid   = booking.status !== 'PENDING_DEPOSIT';

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={`/customer/bookings/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>Booking #{id}</Link>
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
