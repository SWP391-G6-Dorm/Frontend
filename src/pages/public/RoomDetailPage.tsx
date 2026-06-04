import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// SCR-08 — Room Detail
// Entity: Room · Property · BlockFloor · RoomImage · Review · UtilityPrice

const MOCK_ROOM = {
  id: '1',
  roomNumber: 'A-301',
  roomType: 'Studio',
  code: 'SS-A301',
  pricePerMonth: 3500000,
  capacity: 2,
  area: 25,
  genderType: 'Mixed',
  status: 'AVAILABLE',
  description: 'A bright and modern studio apartment on the 3rd floor with great cross-ventilation. Fully furnished with built-in wardrobe, air conditioning, and a kitchenette. The room receives abundant natural light in the morning and offers a pleasant view of the courtyard. Utilities are separately metered and billed monthly based on actual usage.',
  amenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Parking', 'Security', 'Laundry', 'Balcony'],
  propertyName: 'Sunset Apartments',
  address: '125 Nguyen Hue, Ben Nghe Ward, District 1, Ho Chi Minh City',
  blockName: 'Block A',
  floorNumber: 3,
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    'https://images.unsplash.com/photo-1556912173-3bb406ef7e97?w=800&q=80',
  ],
};

const UTILITY_PRICES = [
  { utilityType: 'ELECTRICITY', unitPrice: 3500, unitLabel: 'kWh' },
  { utilityType: 'WATER',       unitPrice: 10000, unitLabel: 'm³' },
];

const REVIEWS = [
  { id: '1', rating: 5, comment: 'Excellent room! Very clean and the landlord is very responsive. The AC works perfectly and WiFi speed is great. Highly recommended.', createdAt: '2025-04-12', tenantName: 'Nguyen Thi B', avatarUrl: 'https://i.pravatar.cc/40?img=1' },
  { id: '2', rating: 4, comment: 'Good value for the location. The room is as described. The building has good security. Would suggest improving the hot water pressure.', createdAt: '2025-03-08', tenantName: 'Tran Van C', avatarUrl: 'https://i.pravatar.cc/40?img=2' },
  { id: '3', rating: 5, comment: 'Stayed here for 8 months. Very comfortable and the price is fair. Close to bus stops and convenience stores.', createdAt: '2025-01-20', tenantName: 'Le Thi D', avatarUrl: 'https://i.pravatar.cc/40?img=3' },
];

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? '#ea2804' : 'var(--stone)', fontSize: 14 }}>★</span>
      ))}
    </div>
  );
}

function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }

export default function RoomDetailPage() {
  const { id } = useParams();
  const room = MOCK_ROOM; // In real app: fetch by id
  const [mainImg, setMainImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [moveInDate, setMoveInDate] = useState('');
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const avgRating = REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length;

  return (
    <PublicLayout>
      <div className="container-wide" style={{ paddingTop: 32, paddingBottom: 80 }}>
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 mb-6 body-sm" style={{ color: 'var(--muted)' }}>
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/rooms" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Rooms</Link>
          <span>/</span>
          <Link to={`/rooms?property=${room.propertyName}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>{room.propertyName}</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>{room.roomNumber}</span>
        </nav>

        {/* ── Image Gallery ── */}
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'var(--surface-dark)' }}>
          {!showAllPhotos ? (
            <div className="flex gap-2" style={{ height: 420 }}>
              {/* Main image */}
              <div className="relative flex-1 overflow-hidden">
                <img
                  src={room.images[mainImg]}
                  alt={`${room.roomNumber} main`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <button
                  onClick={() => setSaved(!saved)}
                  className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: 40, height: 40,
                    background: 'rgba(255,255,255,0.92)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{ color: saved ? 'var(--primary)' : 'var(--ash)', fontSize: 18 }}>{saved ? '❤️' : '🤍'}</span>
                </button>
              </div>
              {/* Thumbnail strip (right 30%) */}
              <div className="flex flex-col gap-2" style={{ width: '28%' }}>
                {room.images.slice(1, 5).map((img, i) => (
                  <div
                    key={i}
                    className="relative flex-1 overflow-hidden cursor-pointer"
                    onClick={() => setMainImg(i + 1)}
                    style={{ opacity: mainImg === i + 1 ? 1 : 0.8 }}
                  >
                    <img src={img} alt={`Room photo ${i + 2}`} className="w-full h-full object-cover" />
                    {i === 3 && room.images.length > 5 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAllPhotos(true); }}
                        className="absolute inset-0 flex items-center justify-center font-semibold text-white"
                        style={{ background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', fontSize: 14 }}
                      >
                        +{room.images.length - 5} photos
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2" style={{ maxHeight: 600, overflowY: 'auto' }}>
              {room.images.map((img, i) => (
                <img key={i} src={img} alt={`Photo ${i + 1}`} className="w-full rounded-lg object-cover" style={{ height: 200, cursor: 'pointer' }} onClick={() => { setMainImg(i); setShowAllPhotos(false); }} />
              ))}
              <button onClick={() => setShowAllPhotos(false)} className="btn-dark col-span-full mt-2" style={{ justifyContent: 'center' }}>Show Less</button>
            </div>
          )}
        </div>

        {/* ── Two-Column Content ── */}
        <div className="flex gap-8" style={{ alignItems: 'flex-start' }}>

          {/* LEFT 60% */}
          <div className="flex-1 min-w-0">
            {/* Room title + status */}
            <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
              <div>
                <h1 className="display-md" style={{ color: 'var(--ink)' }}>
                  {room.roomNumber} — {room.roomType}
                </h1>
                <p className="body-md mt-1 flex items-center gap-1" style={{ color: 'var(--charcoal)' }}>
                  📍 {room.address}
                </p>
              </div>
              <span className="badge badge-success text-sm px-3 py-1.5">{room.status}</span>
            </div>

            {/* Block/Floor */}
            <p className="body-sm mb-5" style={{ color: 'var(--muted)' }}>
              {room.blockName} · Floor {room.floorNumber} · Code: <span className="code-md">{room.code}</span>
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 pb-6 mb-6 border-b" style={{ borderColor: 'var(--hairline)' }}>
              {[
                { icon: '👥', label: 'Capacity', val: `${room.capacity} ${room.capacity === 1 ? 'person' : 'people'}` },
                { icon: '📐', label: 'Area', val: `${room.area} m²` },
                { icon: '⚤', label: 'Gender', val: room.genderType },
              ].map((s) => (
                <div key={s.label} className="card px-4 py-3 flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <div className="caption" style={{ color: 'var(--ash)' }}>{s.label}</div>
                    <div className="label-sm" style={{ color: 'var(--ink)' }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Amenities → Room.amenities */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--hairline)' }}>
              <h2 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((a) => (
                  <span key={a} className="badge badge-neutral px-3 py-1.5 text-sm">{a}</span>
                ))}
              </div>
            </div>

            {/* Description → Room.description */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--hairline)' }}>
              <h2 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>About this room</h2>
              <p className="body-lg" style={{ color: 'var(--body)' }}>{room.description}</p>
            </div>

            {/* Utility Rates → UtilityPrice entity */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--hairline)' }}>
              <h2 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Utility Charges</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-bone)' }}>
                      <th className="text-left px-4 py-3 label-sm" style={{ color: 'var(--charcoal)' }}>Type</th>
                      <th className="text-right px-4 py-3 label-sm" style={{ color: 'var(--charcoal)' }}>Unit Price</th>
                      <th className="text-right px-4 py-3 label-sm" style={{ color: 'var(--charcoal)' }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {UTILITY_PRICES.map((u, i) => (
                      <tr key={u.utilityType} style={{ borderTop: i > 0 ? '1px solid var(--hairline)' : 'none' }}>
                        <td className="px-4 py-3 body-sm" style={{ color: 'var(--ink)' }}>
                          {u.utilityType === 'ELECTRICITY' ? '⚡ Electricity' : '💧 Water'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>
                          {formatPrice(u.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--charcoal)' }}>
                          / {u.unitLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reviews → Review entity (moderationStatus=VISIBLE) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>
                  Reviews ({REVIEWS.length})
                </h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>{avgRating.toFixed(1)}</span>
                </div>
              </div>

              {/* Rating distribution */}
              <div className="mb-5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = REVIEWS.filter(r => r.rating === star).length;
                  const pct = (count / REVIEWS.length) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="body-sm w-4" style={{ color: 'var(--charcoal)' }}>{star}</span>
                      <span style={{ color: 'var(--primary)', fontSize: 11 }}>★</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--surface-bone)' }}>
                        <div className="rounded-full transition-all" style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)' }} />
                      </div>
                      <span className="caption w-4 text-right" style={{ color: 'var(--ash)' }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Review cards */}
              <div className="flex flex-col gap-4">
                {REVIEWS.map((review) => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={review.avatarUrl} alt={review.tenantName} className="rounded-full" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                      <div>
                        <p className="label-sm" style={{ color: 'var(--ink)' }}>{review.tenantName}</p>
                        <p className="caption" style={{ color: 'var(--ash)' }}>{review.createdAt}</p>
                      </div>
                      <div className="ml-auto">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <p className="body-md" style={{ color: 'var(--body)' }}>{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 40% — Sticky Booking Sidebar */}
          <div className="hidden lg:block flex-shrink-0" style={{ width: 320 }}>
            <div
              className="sticky"
              style={{ top: 88 }}
            >
              <div
                className="card-lg p-6"
                style={{ boxShadow: '0 8px 32px rgba(32,32,32,0.10)' }}
              >
                <div className="mb-4">
                  <span className="display-md" style={{ color: 'var(--primary)', fontSize: 28 }}>
                    {formatPrice(room.pricePerMonth)}
                  </span>
                  <span className="body-md" style={{ color: 'var(--ash)' }}> / month</span>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1 text-center py-2 rounded-lg" style={{ background: 'var(--surface-bone)' }}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Area</p>
                    <p className="label-sm" style={{ color: 'var(--ink)' }}>{room.area} m²</p>
                  </div>
                  <div className="flex-1 text-center py-2 rounded-lg" style={{ background: 'var(--surface-bone)' }}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Capacity</p>
                    <p className="label-sm" style={{ color: 'var(--ink)' }}>{room.capacity} ppl</p>
                  </div>
                  <div className="flex-1 text-center py-2 rounded-lg" style={{ background: 'var(--surface-bone)' }}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>Gender</p>
                    <p className="label-sm" style={{ color: 'var(--ink)' }}>{room.genderType}</p>
                  </div>
                </div>

                <div className="mb-1">
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Preferred Move-in Date</label>
                  <input
                    type="date"
                    className="input-field-rect w-full"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="border-t mt-5 pt-5 flex flex-col gap-3" style={{ borderColor: 'var(--hairline)' }}>
                  <Link
                    to={`/request-rental/${room.id}`}
                    className="btn-primary w-full"
                    style={{ height: 48, justifyContent: 'center', textDecoration: 'none', display: 'flex', fontSize: 15 }}
                  >
                    🏠 Request Rental
                  </Link>
                  <Link
                    to={`/viewing/${room.id}`}
                    className="btn-outline w-full"
                    style={{ height: 44, justifyContent: 'center', textDecoration: 'none', display: 'flex' }}
                  >
                    📅 Schedule Viewing
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSaved(!saved)}
                    className="btn-ghost w-full"
                    style={{ height: 40, justifyContent: 'center', color: saved ? 'var(--primary)' : 'var(--charcoal)' }}
                  >
                    {saved ? '❤️ Saved' : '🤍 Save to Favorites'}
                  </button>
                </div>

                <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--surface-bone)' }}>
                  <p className="caption text-center" style={{ color: 'var(--muted)' }}>
                    💬 Usually responds within 4 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA bar (fixed bottom) */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex gap-3"
          style={{
            background: 'var(--surface-card)',
            borderTop: '1px solid var(--hairline)',
            padding: '12px 20px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex-1">
            <div className="font-bold" style={{ color: 'var(--primary)', fontSize: 18 }}>{formatPrice(room.pricePerMonth)}</div>
            <div className="caption" style={{ color: 'var(--ash)' }}>/month</div>
          </div>
          <Link to={`/request-rental/${room.id}`} className="btn-primary" style={{ height: 44, padding: '0 24px', textDecoration: 'none' }}>
            Request Rental
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
