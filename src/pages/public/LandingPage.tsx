import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// ── Mock data (entity-driven: Room, Property, RoomImage) ──────────────────────
const FEATURED_ROOMS = [
  {
    id: '1',
    roomNumber: 'A-301',
    roomType: 'Studio',
    pricePerMonth: 3500000,
    capacity: 2,
    area: 25,
    genderType: 'Mixed',
    status: 'AVAILABLE',
    propertyName: 'Sunset Apartments',
    address: '125 Nguyen Hue, District 1, HCMC',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    amenities: ['WiFi', 'AC', 'Kitchen'],
  },
  {
    id: '2',
    roomNumber: 'B-102',
    roomType: 'Single Room',
    pricePerMonth: 2200000,
    capacity: 1,
    area: 18,
    genderType: 'Female',
    status: 'AVAILABLE',
    propertyName: 'Green House Dormitory',
    address: '88 Le Van Viet, Thu Duc, HCMC',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    amenities: ['WiFi', 'Laundry', 'Security'],
  },
  {
    id: '3',
    roomNumber: 'C-203',
    roomType: 'Double Room',
    pricePerMonth: 4800000,
    capacity: 2,
    area: 32,
    genderType: 'Mixed',
    status: 'AVAILABLE',
    propertyName: 'City Center Residences',
    address: '45 Tran Hung Dao, District 5, HCMC',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    amenities: ['WiFi', 'AC', 'Parking', 'Gym'],
  },
  {
    id: '4',
    roomNumber: 'D-401',
    roomType: 'Studio',
    pricePerMonth: 3000000,
    capacity: 1,
    area: 22,
    genderType: 'Male',
    status: 'AVAILABLE',
    propertyName: 'Riverside View',
    address: '210 Vo Thi Sau, District 3, HCMC',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    amenities: ['WiFi', 'AC', 'Balcony'],
  },
  {
    id: '5',
    roomNumber: 'E-115',
    roomType: 'Dormitory',
    pricePerMonth: 1500000,
    capacity: 4,
    area: 40,
    genderType: 'Male',
    status: 'AVAILABLE',
    propertyName: 'Student Quarter',
    address: '3 Pham Van Dong, Thu Duc, HCMC',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    amenities: ['WiFi', 'Laundry', 'Security'],
  },
  {
    id: '6',
    roomNumber: 'F-222',
    roomType: 'Single Room',
    pricePerMonth: 2800000,
    capacity: 1,
    area: 20,
    genderType: 'Female',
    status: 'AVAILABLE',
    propertyName: 'Blossom Boarding',
    address: '67 Nguyen Trai, District 1, HCMC',
    imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=80',
    amenities: ['WiFi', 'AC', 'Kitchen'],
  },
];

const ROOM_TYPES = ['Studio', 'Single Room', 'Double Room', 'Dormitory'];

const STATS = [
  { value: '2,400+', label: 'Verified Rooms' },
  { value: '850+', label: 'Trusted Landlords' },
  { value: '12,000+', label: 'Happy Tenants' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔍',
    title: 'Search & Filter',
    desc: 'Browse rooms by location, price, type and amenities. Find exactly what fits your lifestyle.',
  },
  {
    step: '02',
    icon: '📅',
    title: 'Book a Viewing',
    desc: 'Schedule an in-person viewing with the landlord at a time that suits you.',
  },
  {
    step: '03',
    icon: '✍️',
    title: 'Sign & Move In',
    desc: 'Review and sign your digital contract. Pay your first month and you\'re home.',
  },
];

function formatPrice(price: number) {
  return '₫' + price.toLocaleString('vi-VN');
}

function RoomCard({ room }: { room: typeof FEATURED_ROOMS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="card overflow-hidden flex flex-col transition-all duration-200"
      style={{
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 32px rgba(32,32,32,0.12)' : '0 2px 8px rgba(32,32,32,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <img
          src={room.imageUrl}
          alt={room.roomNumber}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
        />
        <div className="absolute top-3 left-3">
          <span className="badge badge-success">{room.status === 'AVAILABLE' ? 'Available' : room.status}</span>
        </div>
        <div className="absolute top-3 right-3">
          <button
            className="flex items-center justify-center rounded-full transition-colors"
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)' }}
            aria-label="Save room"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div>
          <p className="caption" style={{ color: 'var(--ash)' }}>{room.propertyName}</p>
          <h3 className="heading-sm mt-0.5" style={{ color: 'var(--ink)' }}>
            {room.roomNumber} — {room.roomType}
          </h3>
        </div>

        <p className="body-sm flex items-center gap-1" style={{ color: 'var(--charcoal)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {room.address}
        </p>

        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span>👥 {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
          <span>📐 {room.area}m²</span>
          <span>⚤ {room.genderType}</span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1">
          {room.amenities.slice(0, 3).map((a) => (
            <span key={a} className="badge badge-neutral text-xs">{a}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 mt-auto border-t" style={{ borderColor: 'var(--hairline)' }}>
          <div>
            <span className="display-md" style={{ color: 'var(--primary)', fontSize: 20 }}>
              {formatPrice(room.pricePerMonth)}
            </span>
            <span className="caption" style={{ color: 'var(--ash)' }}>/month</span>
          </div>
          <Link
            to={`/rooms/${room.id}`}
            className="btn-outline"
            style={{ height: 34, padding: '0 16px', fontSize: 13 }}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchMoveIn, setSearchMoveIn] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (searchMoveIn) params.set('moveIn', searchMoveIn);
    if (searchMaxPrice) params.set('maxPrice', searchMaxPrice);
    navigate('/rooms?' + params.toString());
  }

  return (
    <PublicLayout>
      {/* ── HERO SECTION ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'var(--primary)',
          padding: '96px 32px',
        }}
      >
        {/* Atmospheric mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 60% 40%, #ff6a3d44 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 70% at 20% 80%, #f4a8a044 0%, transparent 60%)',
          }}
        />

        <div className="container-wide relative z-10">
          <div className="max-w-2xl">
            <p className="label-sm mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                style={{ background: 'rgba(255,255,255,0.15)', fontSize: 12 }}
              >
                ✨ Trusted by 12,000+ tenants
              </span>
            </p>
            <h1
              className="display-xl mb-6"
              style={{ color: 'var(--on-dark)', lineHeight: 1.0 }}
            >
              Find Your<br />Perfect Room
            </h1>
            <p className="body-lg mb-10" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 480 }}>
              Browse verified boarding houses across Vietnam. Simple search, transparent pricing, and digital contracts.
            </p>

            {/* Search Card */}
            <div
              className="card-lg p-6"
              style={{ background: 'var(--surface-card)', maxWidth: 680 }}
            >
              <form onSubmit={handleSearch}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="var(--ash)" strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: 40, borderRadius: 10 }}
                      placeholder="Location (city, district…)"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  <input
                    type="date"
                    className="input-field"
                    style={{ borderRadius: 10 }}
                    placeholder="Move-in date"
                    value={searchMoveIn}
                    onChange={(e) => setSearchMoveIn(e.target.value)}
                  />
                  <input
                    type="number"
                    className="input-field"
                    style={{ borderRadius: 10 }}
                    placeholder="Max price (₫/month)"
                    value={searchMaxPrice}
                    onChange={(e) => setSearchMaxPrice(e.target.value)}
                  />
                </div>
                <div className="mt-3 flex gap-3">
                  <button type="submit" className="btn-primary flex-1" style={{ height: 48, fontSize: 15 }}>
                    🔍 Search Rooms
                  </button>
                  <Link to="/rooms" className="btn-outline" style={{ height: 48, padding: '0 24px', fontSize: 14 }}>
                    Browse All
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ background: 'var(--surface-bone)', padding: '32px 32px' }}>
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="display-md" style={{ color: 'var(--primary)' }}>{s.value}</div>
                <div className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ROOMS ── */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="label-sm mb-2" style={{ color: 'var(--ash)' }}>HANDPICKED FOR YOU</p>
              <h2 className="heading-lg" style={{ color: 'var(--ink)' }}>Featured Rooms</h2>
            </div>
            <Link to="/rooms" className="btn-outline hidden md:inline-flex">
              View All Rooms →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_ROOMS.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link to="/rooms" className="btn-outline">View All Rooms →</Link>
          </div>
        </div>
      </section>

      {/* ── ROOM TYPE CATEGORIES ── */}
      <section className="section-pad-sm" style={{ background: 'var(--surface-bone)' }}>
        <div className="container-wide">
          <div className="text-center mb-8">
            <p className="label-sm mb-2" style={{ color: 'var(--ash)' }}>BROWSE BY TYPE</p>
            <h2 className="heading-md" style={{ color: 'var(--ink)' }}>Find the Right Fit</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'Studio',      icon: '🏠', count: 284, desc: 'Self-contained unit' },
              { type: 'Single Room', icon: '🛏️', count: 612, desc: 'Private room, shared facilities' },
              { type: 'Double Room', icon: '🛋️', count: 198, desc: 'Spacious shared room' },
              { type: 'Dormitory',   icon: '🏘️', count: 145, desc: 'Budget-friendly shared dorm' },
            ].map((cat) => (
              <Link
                key={cat.type}
                to={`/rooms?type=${cat.type}`}
                className="card flex flex-col items-center text-center p-6 transition-all duration-200 group no-underline"
                style={{ textDecoration: 'none' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--hairline)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="heading-sm mb-1" style={{ color: 'var(--ink)' }}>{cat.type}</h3>
                <p className="body-sm mb-3" style={{ color: 'var(--charcoal)' }}>{cat.desc}</p>
                <span className="badge badge-neutral">{cat.count} rooms</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="section-pad"
        style={{ background: 'var(--surface-dark)' }}
      >
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="label-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>SIMPLE PROCESS</p>
            <h2 className="display-lg" style={{ color: 'var(--on-dark)', lineHeight: 1 }}>How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex flex-col gap-4">
                <div
                  className="flex items-center justify-center rounded-full text-2xl"
                  style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {step.icon}
                </div>
                <div>
                  <span className="caption" style={{ color: 'var(--primary)' }}>STEP {step.step}</span>
                  <h3 className="heading-sm mt-1 mb-2" style={{ color: 'var(--on-dark)' }}>{step.title}</h3>
                  <p className="body-md" style={{ color: 'var(--on-dark-mute)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="section-pad-sm" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide text-center">
          <h2 className="display-md mb-4" style={{ color: 'var(--ink)' }}>
            Ready to Find Your Next Home?
          </h2>
          <p className="body-lg mb-8" style={{ color: 'var(--charcoal)', maxWidth: 480, margin: '0 auto 32px' }}>
            Join thousands of tenants who found their perfect room through BoardingHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/rooms" className="btn-primary" style={{ height: 52, padding: '0 36px', fontSize: 16 }}>
              Browse Rooms
            </Link>
            <Link to="/register" className="btn-outline" style={{ height: 52, padding: '0 36px', fontSize: 16 }}>
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
