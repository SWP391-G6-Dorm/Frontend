import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const ROOM_MOCK = { id: '1', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop' };

export default function BookingFormPage() {
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
  const totalAmount   = nights * ROOM_MOCK.pricePerNight;
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
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>My Bookings</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>New Booking</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Book a Room</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
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
                <div style={{ background: 'rgba(15,118,110,0.08)', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
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
