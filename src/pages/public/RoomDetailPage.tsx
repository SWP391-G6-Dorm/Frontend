import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// Mock data
const ROOM = {
  id: '1',
  roomNumber: 'Villa 01',
  roomType: 'Villa',
  pricePerNight: 2500000,
  capacity: 4,
  area: 80,
  description: 'A stunning beachfront villa with panoramic ocean views. Features a private pool, sundecks, and a fully equipped kitchen. Ideal for families or groups seeking a luxurious escape.',
  status: 'AVAILABLE',
  floorNumber: 2,
  propertyName: 'Sunset Resort Đà Nẵng',
  propertyAddress: '123 Nguyễn Tất Thành, Đà Nẵng',
  images: [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=400&h=280&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=280&fit=crop',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=280&fit=crop',
  ],
  reviews: [
    { id: '1', fullName: 'Nguyễn Thị Lan', rating: 5, comment: 'Absolutely stunning villa! The view was breathtaking and the pool was perfect. Will definitely come back.', createdAt: '2026-05-20', avatarUrl: '' },
    { id: '2', fullName: 'Trần Văn Bình', rating: 4, comment: 'Great location and facilities. The staff was very helpful. Highly recommend for couples.', createdAt: '2026-05-10', avatarUrl: '' },
    { id: '3', fullName: 'Lê Minh Hoàng', rating: 5, comment: 'One of the best stays we ever had. The beachfront access is incredible. Perfect for a family getaway.', createdAt: '2026-04-28', avatarUrl: '' },
  ],
  avgRating: 4.8,
  totalReviews: 124,
};

// Mock availability data (occupied date ranges)
const OCCUPIED_DATES = new Set(['2026-06-20', '2026-06-21', '2026-06-22', '2026-06-28', '2026-06-29', '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07']);
const PENDING_DATES   = new Set(['2026-06-17', '2026-06-18']);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    AVAILABLE: { cls: 'badge-success', label: 'Available' },
    RESERVED:  { cls: 'badge-info',    label: 'Reserved' },
    OCCUPIED:  { cls: 'badge-neutral', label: 'Occupied' },
    MAINTENANCE: { cls: 'badge-neutral', label: 'Maintenance' },
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#ea2804' : '#e5e7eb'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );
}

function MiniCalendar({ year, month }: { year: number; month: number }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function getCellColor(day: number | null) {
    if (!day) return 'transparent';
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (OCCUPIED_DATES.has(key)) return '#fee2e2';
    if (PENDING_DATES.has(key))  return '#fef3c7';
    const d = new Date(key);
    if (d < new Date()) return 'transparent';
    return '#dcfce7';
  }
  function getTextColor(day: number | null) {
    if (!day) return 'transparent';
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (OCCUPIED_DATES.has(key)) return '#dc2626';
    if (PENDING_DATES.has(key))  return '#d97706';
    const d = new Date(key);
    if (d < new Date()) return 'var(--stone)';
    return '#2b9a66';
  }

  return (
    <div>
      <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{monthNames[month]} {year}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ash)', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 12, padding: '5px 2px', borderRadius: 6,
            background: getCellColor(day), color: getTextColor(day), fontWeight: day ? 500 : 400,
          }}>
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mainImg, setMainImg] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;
  const totalAmount = nights * ROOM.pricePerNight;
  const depositAmount = Math.round(totalAmount * 0.4);

  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();

  return (
    <PublicLayout>
      <div className="container-wide" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 24 }}>
          <Link to="/" className="text-primary" style={{ textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>{ROOM.propertyName}</span>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>{ROOM.roomNumber}</span>
        </div>

        {/* Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 36, borderRadius: 12, overflow: 'hidden' }}>
          <img src={ROOM.images[mainImg]} alt={ROOM.roomNumber} style={{ width: '100%', height: 420, objectFit: 'cover', cursor: 'pointer' }} />
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(3,1fr)', gap: 8 }}>
            {ROOM.images.slice(1).map((img, i) => (
              <img key={i} src={img} alt={`Room ${i+2}`} onClick={() => setMainImg(i + 1)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', opacity: mainImg === i + 1 ? 1 : 0.85, transition: 'opacity 0.15s' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div>
            {/* Title */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 className="display-md">{ROOM.roomNumber} — {ROOM.roomType}</h1>
              <StatusBadge status={ROOM.status} />
            </div>
            <p className="body-md text-charcoal" style={{ marginBottom: 4 }}>
              📍 {ROOM.propertyAddress}
            </p>
            <p className="body-sm text-charcoal" style={{ marginBottom: 16 }}>
              {ROOM.propertyName} · Floor {ROOM.floorNumber}
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)', marginBottom: 24 }}>
              {[
                { label: 'Capacity', value: `${ROOM.capacity} guests` },
                { label: 'Area', value: `${ROOM.area} m²` },
                { label: 'Floor', value: `Floor ${ROOM.floorNumber}` },
                { label: 'Room type', value: ROOM.roomType },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="body-sm text-charcoal">{stat.label}</p>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginTop: 2 }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <h2 className="heading-sm" style={{ marginBottom: 10 }}>About this room</h2>
            <p className="body-lg text-body" style={{ marginBottom: 32 }}>{ROOM.description}</p>

            {/* Availability Calendar */}
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Availability Calendar</h2>
            <div className="card" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <MiniCalendar year={thisYear} month={thisMonth} />
                <MiniCalendar year={thisYear} month={(thisMonth + 1) % 12} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                {[
                  { color: '#dcfce7', text: 'Available' },
                  { color: '#fef3c7', text: 'Pending Deposit' },
                  { color: '#fee2e2', text: 'Occupied / Reserved' },
                  { color: 'var(--surface-bone)', text: 'Past' },
                ].map(l => (
                  <div key={l.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: '1px solid var(--hairline)' }} />
                    <span className="body-sm text-charcoal">{l.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to={`/rooms/${ROOM.id}/calendar`} className="btn-ghost btn-sm" style={{ marginBottom: 32 }}>View full calendar →</Link>

            {/* Reviews */}
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Guest Reviews</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <span className="display-md text-primary">{ROOM.avgRating}</span>
              <div>
                <StarRating rating={ROOM.avgRating} size={18} />
                <p className="body-sm text-charcoal">{ROOM.totalReviews} reviews</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ROOM.reviews.map(r => (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {r.fullName[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{r.fullName}</p>
                      <p className="body-sm text-charcoal">{new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}><StarRating rating={r.rating} /></div>
                  </div>
                  <p className="body-md text-body">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Booking Panel (sticky) */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card-lg" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                <span className="display-md text-primary">₫{ROOM.pricePerNight.toLocaleString()}</span>
                <span className="body-md text-charcoal">/night</span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Check-in</label>
                  <input type="date" className="input" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={{ borderRadius: 10, height: 40, fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Check-out</label>
                  <input type="date" className="input" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={{ borderRadius: 10, height: 40, fontSize: 14 }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Guests</label>
                <input type="number" min={1} max={ROOM.capacity} className="input" value={guests} onChange={e => setGuests(+e.target.value)} style={{ borderRadius: 10, height: 40, fontSize: 14 }} />
              </div>

              {nights > 0 && (
                <div style={{ background: 'var(--surface-bone)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">₫{ROOM.pricePerNight.toLocaleString()} × {nights} nights</span>
                    <span className="body-sm" style={{ fontWeight: 600 }}>₫{totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
                    <span className="body-sm" style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>₫{totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="body-sm text-charcoal">Deposit required (40%)</span>
                    <span className="body-sm text-primary" style={{ fontWeight: 600 }}>₫{depositAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {ROOM.status !== 'AVAILABLE' ? (
                <div className="alert alert-warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  This room is currently unavailable for booking.
                </div>
              ) : (
                <button className="btn-primary" style={{ width: '100%' }}
                  onClick={() => navigate(`/request-booking/${ROOM.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}>
                  Book Now
                </button>
              )}

              <p className="body-sm text-charcoal" style={{ textAlign: 'center', marginTop: 12 }}>
                40% deposit required to confirm your booking
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
