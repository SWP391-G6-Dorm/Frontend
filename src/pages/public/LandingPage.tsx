import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// ── Mock data (will be replaced by API calls) ──────────────────────────────
const FEATURED_ROOMS = [
  { id: '1', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, status: 'AVAILABLE', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=400&fit=crop', propertyName: 'Sunset Resort Đà Nẵng', rating: 4.8, reviews: 124 },
  { id: '2', roomNumber: 'Deluxe 05', roomType: 'Deluxe', pricePerNight: 1200000, capacity: 2, area: 35, status: 'AVAILABLE', primaryImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop', propertyName: 'Mountain View Homestay', rating: 4.6, reviews: 89 },
  { id: '3', roomNumber: 'Suite 03', roomType: 'Suite', pricePerNight: 1800000, capacity: 3, area: 55, status: 'AVAILABLE', primaryImageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=400&fit=crop', propertyName: 'Hội An Garden Villa', rating: 4.9, reviews: 210 },
  { id: '4', roomNumber: 'Standard 12', roomType: 'Standard', pricePerNight: 750000, capacity: 2, area: 28, status: 'AVAILABLE', primaryImageUrl: 'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=400&h=400&fit=crop', propertyName: 'Phú Quốc Beach House', rating: 4.4, reviews: 67 },
];

const FEATURED_PROPERTIES = [
  { id: '1', name: 'Sunset Resort Đà Nẵng', address: '123 Nguyễn Tất Thành, Đà Nẵng', roomCount: 15, availableCount: 8, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop' },
  { id: '2', name: 'Mountain View Homestay', address: '456 Trần Phú, Đà Lạt', roomCount: 8, availableCount: 5, image: 'https://images.unsplash.com/photo-1587874522487-fe10e954d035?w=600&h=400&fit=crop' },
  { id: '3', name: 'Hội An Garden Villa', address: '78 Phan Bội Châu, Hội An', roomCount: 12, availableCount: 9, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search & Browse', desc: 'Find your perfect room by location, dates, type and capacity with real-time availability.' },
  { step: '02', title: 'Book & Deposit', desc: 'Confirm your booking with a 40% deposit. Receive your contract instantly via email.' },
  { step: '03', title: 'Check In & Enjoy', desc: 'Pay the remaining balance at check-in and enjoy your premium homestay experience.' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    AVAILABLE:       { cls: 'badge-success', label: 'Available' },
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending Deposit' },
    RESERVED:        { cls: 'badge-info',    label: 'Reserved' },
    OCCUPIED:        { cls: 'badge-neutral', label: 'Occupied' },
    MAINTENANCE:     { cls: 'badge-neutral', label: 'Maintenance' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#ea2804' : '#e5e7eb'} stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );
}

function RoomCard({ room }: { room: typeof FEATURED_ROOMS[0] }) {
  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(32,32,32,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
      {/* Image */}
      <div style={{ position: 'relative', paddingBottom: '66%', overflow: 'hidden' }}>
        <img src={room.primaryImageUrl} alt={room.roomNumber}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <StatusBadge status={room.status} />
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: 16 }}>
        <p className="body-sm text-charcoal mb-1">{room.propertyName}</p>
        <h3 className="heading-sm" style={{ marginBottom: 4 }}>{room.roomNumber} — {room.roomType}</h3>
        <div className="flex items-center gap-3 body-sm text-charcoal mb-3">
          <span>👥 {room.capacity} guests</span>
          <span>📐 {room.area}m²</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <StarRating rating={room.rating} />
          <span className="body-sm text-charcoal">{room.rating} ({room.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="heading-sm text-primary">₫{room.pricePerNight.toLocaleString()}</span>
            <span className="body-sm text-charcoal">/night</span>
          </div>
          <Link to={`/rooms/${room.id}`} className="btn-outline btn-sm">View Detail</Link>
        </div>
      </div>
    </div>
  );
}

// All searchable suggestions: locations + property names
const SUGGESTIONS = [
  { type: 'location', label: 'Đà Lạt',      icon: '📍' },
  { type: 'location', label: 'Hội An',      icon: '📍' },
  { type: 'location', label: 'Đà Nẵng',      icon: '📍' },
  { type: 'location', label: 'Phú Quốc',    icon: '📍' },
  { type: 'location', label: 'Nha Trang',    icon: '📍' },
  { type: 'location', label: 'Hà Nội',       icon: '📍' },
  { type: 'property', label: 'Sunset Resort Đà Nẵng', icon: '🏨' },
  { type: 'property', label: 'Mountain View Homestay', icon: '🏡' },
  { type: 'property', label: 'Hội An Garden Villa',  icon: '🏡' },
  { type: 'property', label: 'Phú Quốc Beach House', icon: '🏡' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ location: '', checkIn: '', checkOut: '', guests: 1 });
  const [dateError, setDateError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredSuggestions = search.location.trim()
    ? SUGGESTIONS.filter(s => s.label.toLowerCase().includes(search.location.toLowerCase()))
    : SUGGESTIONS;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Validate date range
    if (search.checkIn && search.checkOut && search.checkIn >= search.checkOut) {
      setDateError('Check-out must be after check-in');
      return;
    }
    setDateError('');
    const params = new URLSearchParams();
    if (search.location)   params.set('location', search.location);
    if (search.checkIn)    params.set('checkIn', search.checkIn);
    if (search.checkOut)   params.set('checkOut', search.checkOut);
    if (search.guests > 1) params.set('guests', String(search.guests));
    navigate('/rooms?' + params.toString());
  }

  return (
    <PublicLayout>
      {/* ── Hero Band ── */}
      <section style={{ background: 'var(--primary)', padding: '96px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* Atmospheric glow */}
        <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,61,0.5) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,168,160,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container-wide" style={{ position: 'relative', textAlign: 'center' }}>
          <h1 className="display-xl" style={{ color: 'var(--on-dark)', marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}>
            Find Your Perfect Stay
          </h1>
          <p className="body-lg" style={{ color: 'rgba(252,252,252,0.85)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Discover and book premium homestay &amp; resort rooms across Vietnam — simple, fast and secure.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: 'var(--surface-card)', borderRadius: 9999, padding: '6px 6px 6px 20px', maxWidth: 860, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', alignItems: 'center' }}>

            {/* Location / Property autocomplete */}
            <div ref={locationRef} style={{ flex: 1, minWidth: 180, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input
                  placeholder="Location or property..."
                  value={search.location}
                  autoComplete="off"
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => { setSearch(p => ({ ...p, location: e.target.value })); setShowSuggestions(true); }}
                  style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--ink)', width: '100%', padding: '6px 0' }}
                />
              </div>

              {/* Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 14px)', left: -20, right: -8,
                  background: 'var(--surface-card)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(32,32,32,0.16)',
                  border: '1px solid var(--hairline)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'fadeInUp 150ms ease-out',
                  minWidth: 260,
                }}>
                  {/* Group: Locations */}
                  {filteredSuggestions.some(s => s.type === 'location') && (
                    <>
                      <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ash)' }}>Locations</div>
                      {filteredSuggestions.filter(s => s.type === 'location').map(s => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => { setSearch(p => ({ ...p, location: s.label })); setShowSuggestions(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink)', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {/* Group: Properties */}
                  {filteredSuggestions.some(s => s.type === 'property') && (
                    <>
                      <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ash)', borderTop: filteredSuggestions.some(s => s.type === 'location') ? '1px solid var(--hairline)' : 'none', marginTop: 4 }}>Properties</div>
                      {filteredSuggestions.filter(s => s.type === 'property').map(s => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => { setSearch(p => ({ ...p, location: s.label })); setShowSuggestions(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink)', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--hairline)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value={search.checkIn} onChange={e => setSearch(p => ({ ...p, checkIn: e.target.value }))}
                style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: search.checkIn ? 'var(--ink)' : 'var(--ash)' }} placeholder="Check-in" />
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--hairline)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value={search.checkOut} onChange={e => setSearch(p => ({ ...p, checkOut: e.target.value }))}
                style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: search.checkOut ? 'var(--ink)' : 'var(--ash)' }} placeholder="Check-out" />
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--hairline)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <input type="number" min={1} max={20} value={search.guests} onChange={e => setSearch(p => ({ ...p, guests: +e.target.value }))}
                style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--ink)', width: 50 }} />
              <span style={{ fontSize: 13, color: 'var(--ash)' }}>guests</span>
            </div>
            <button type="submit" className="btn-dark btn-sm" style={{ borderRadius: 9999, whiteSpace: 'nowrap' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search
            </button>
          </form>

          {/* Date validation error */}
          {dateError && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8, textAlign: 'center' }}>⚠ {dateError}</p>
          )}

          {/* Quick tags — use encodeURIComponent to handle Vietnamese chars */}
          <div className="flex flex-wrap gap-2 mt-5" style={{ justifyContent: 'center' }}>
            {['Đà Lạt', 'Hội An', 'Đà Nẵng', 'Phú Quốc', 'Nha Trang'].map(loc => (
              <button key={loc} onClick={() => {
                setSearch(p => ({ ...p, location: loc }));
                navigate(`/rooms?location=${encodeURIComponent(loc)}`);
              }}
                style={{ fontSize: 13, padding: '4px 12px', borderRadius: 9999, background: 'rgba(252,252,252,0.15)', color: 'rgba(252,252,252,0.85)', border: '1px solid rgba(252,252,252,0.25)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(252,252,252,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(252,252,252,0.15)'; }}>
                {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Rooms ── */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-md" style={{ marginBottom: 6 }}>Featured Rooms</h2>
              <p className="body-md text-charcoal">Hand-picked premium rooms across Vietnam's top destinations</p>
            </div>
            <Link to="/rooms" className="btn-ghost">View all rooms →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_ROOMS.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="section-pad-sm" style={{ background: 'var(--surface-bone)' }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-md" style={{ marginBottom: 6 }}>Our Properties</h2>
              <p className="body-md text-charcoal">Premium homestays and resorts in Vietnam's top destinations</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_PROPERTIES.map(prop => (
              <div key={prop.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                <img src={prop.image} alt={prop.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: 20 }}>
                  <h3 className="heading-sm" style={{ marginBottom: 4 }}>{prop.name}</h3>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 12 }}>📍 {prop.address}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <span className="badge badge-neutral">{prop.roomCount} rooms</span>
                      <span className="badge badge-success">{prop.availableCount} available</span>
                    </div>
                    <Link to={`/search?location=${encodeURIComponent(prop.name)}`} className="btn-ghost btn-sm">Explore →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="section-pad" style={{ background: 'var(--surface-dark)' }}>
        <div className="container-wide">
          <h2 className="display-md text-on-dark" style={{ marginBottom: 12 }}>How It Works</h2>
          <p className="body-lg" style={{ color: 'var(--on-dark-mute)', marginBottom: 56 }}>Book your perfect stay in 3 simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
                <div className="display-lg text-primary" style={{ marginBottom: 16 }}>{step.step}</div>
                <h3 className="heading-sm text-on-dark" style={{ marginBottom: 10 }}>{step.title}</h3>
                <p className="body-md" style={{ color: 'var(--on-dark-mute)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/rooms" className="btn-primary">Browse Rooms</Link>
            <Link to="/register" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--on-dark)', background: 'transparent' }}>Create Account</Link>
          </div>
        </div>
      </section>

      {/* ── Stats Band ── */}
      <section className="section-pad-sm" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+',  label: 'Properties' },
              { value: '300+', label: 'Rooms' },
              { value: '5K+',  label: 'Happy Guests' },
              { value: '4.8',  label: 'Average Rating' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="display-md text-primary" style={{ marginBottom: 6 }}>{stat.value}</div>
                <p className="body-sm text-charcoal">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
