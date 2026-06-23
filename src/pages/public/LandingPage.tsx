import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import {
  fetchFeaturedRooms,
  fetchFeaturedProperties,
  fetchPlatformStats,
  fetchSearchSuggestions,
  fetchPromotions,
  type FeaturedRoom,
  type FeaturedProperty,
  type PlatformStats,
  type SearchSuggestion,
  type Promotion,
} from '../../api/publicApi';
import { formatStatValue } from '../../utils/mediaUrl';
import SafeImage from '../../components/ui/SafeImage';

const HOW_IT_WORKS = [
  { step: '01', title: 'Search & Browse', desc: 'Find your perfect room by location, dates, type and capacity with real-time availability.' },
  { step: '02', title: 'Book & Deposit', desc: 'Confirm your booking with a 40% deposit. Receive your contract instantly via email.' },
  { step: '03', title: 'Check In & Enjoy', desc: 'Pay the remaining balance at check-in and enjoy your premium homestay experience.' },
];

const SUGGESTION_ICONS: Record<string, string> = {
  location: '📍',
  property: '🏨',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    AVAILABLE: { cls: 'badge-success', label: 'Available' },
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending Deposit' },
    RESERVED: { cls: 'badge-info', label: 'Reserved' },
    OCCUPIED: { cls: 'badge-neutral', label: 'Occupied' },
    MAINTENANCE: { cls: 'badge-neutral', label: 'Maintenance' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#ea2804' : '#e5e7eb'} stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function RoomCard({ room }: { room: FeaturedRoom }) {
  const rating = room.averageRating ?? 0;
  const reviews = room.totalReviews ?? 0;

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(32,32,32,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
        <SafeImage
          src={room.primaryImageUrl}
          alt={room.roomNumber}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <StatusBadge status={room.status} />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <p className="body-sm text-charcoal mb-1">
          {room.propertyName}
          {room.floorNumber != null && ` · Floor ${room.floorNumber}`}
        </p>
        <h3 className="heading-sm" style={{ marginBottom: 4 }}>
          {room.roomNumber} — {room.roomType}
        </h3>
        <div className="flex items-center gap-3 body-sm text-charcoal mb-3">
          <span>👥 {room.capacity} guests</span>
          <span>📐 {room.area}m²</span>
        </div>
        {rating > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={rating} />
            <span className="body-sm text-charcoal">
              {rating.toFixed(1)} ({reviews})
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="heading-sm text-primary">₫{Number(room.pricePerNight).toLocaleString()}</span>
            <span className="body-sm text-charcoal">/night</span>
          </div>
          <Link to={`/rooms/${room.id}`} className="btn-outline btn-sm" style={{ borderRadius: 9999 }}>
            View Detail
          </Link>
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: FeaturedProperty }) {
  const exploreUrl = `/search?location=${encodeURIComponent(property.name)}`;

  return (
    <Link
      to={exploreUrl}
      className="card"
      style={{ overflow: 'hidden', display: 'block', textDecoration: 'none', transition: 'transform 0.2s' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      <SafeImage
        src={property.coverImageUrl}
        alt={property.name}
        style={{ width: '100%', height: 180, objectFit: 'cover' }}
      />
      <div style={{ padding: 20 }}>
        <h3 className="heading-sm" style={{ marginBottom: 4 }}>
          {property.name}
        </h3>
        <p className="body-sm text-charcoal" style={{ marginBottom: 12 }}>
          📍 {property.address}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <span className="badge badge-neutral">{property.roomCount} rooms</span>
            <span className="badge badge-success">{property.availableRoomCount} available</span>
          </div>
          <span className="btn-ghost btn-sm" style={{ pointerEvents: 'none' }}>
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}

function SectionSkeleton({ count, cols = 4 }: { count: number; cols?: number }) {
  const gridClass =
    cols === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5';
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ height: 320, background: 'var(--surface-bone)', opacity: 0.6 }} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ location: '', checkIn: '', checkOut: '', guests: 1 });
  const [dateError, setDateError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locationChips, setLocationChips] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLandingData() {
      setLoadError('');
      setLoadingRooms(true);
      setLoadingProperties(true);

      const results = await Promise.allSettled([
        fetchFeaturedRooms(8),
        fetchFeaturedProperties(6),
        fetchPlatformStats(),
        fetchSearchSuggestions(''),
        fetchPromotions(),
      ]);

      if (cancelled) return;

      const [roomsResult, propertiesResult, statsResult, chipsResult, promoResult] = results;

      if (promoResult.status === 'fulfilled') {
        setPromotions(promoResult.value);
      }

      if (roomsResult.status === 'fulfilled') {
        setFeaturedRooms(roomsResult.value);
      } else {
        setFeaturedRooms([]);
      }

      if (propertiesResult.status === 'fulfilled') {
        setFeaturedProperties(propertiesResult.value);
      } else {
        setFeaturedProperties([]);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }

      if (chipsResult.status === 'fulfilled') {
        const chips = chipsResult.value
          .filter((s) => s.type === 'location')
          .map((s) => s.label)
          .slice(0, 6);
        setLocationChips(chips);
      }

      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed) {
        setLoadError(
          'Không kết nối được backend (port 8080). Mở IntelliJ → Run HomestayApplication, rồi bấm Thử lại.',
        );
      }

      setLoadingRooms(false);
      setLoadingProperties(false);
    }

    loadLandingData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await fetchSearchSuggestions(search.location);
        if (!cancelled) setSuggestions(data);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search.location]);

  useEffect(() => {
    if (window.location.hash === '#properties') {
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loadingProperties]);

  const filteredSuggestions = suggestions.map((s) => ({
    ...s,
    icon: SUGGESTION_ICONS[s.type] ?? '📍',
  }));

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.checkIn && search.checkOut && search.checkIn >= search.checkOut) {
      setDateError('Check-out must be after check-in');
      return;
    }
    setDateError('');
    const params = new URLSearchParams();
    if (search.location) params.set('location', search.location);
    if (search.checkIn) params.set('checkIn', search.checkIn);
    if (search.checkOut) params.set('checkOut', search.checkOut);
    if (search.guests > 1) params.set('guests', String(search.guests));
    navigate('/search?' + params.toString());
  }

  const statItems = stats
    ? [
        { value: formatStatValue(stats.totalProperties), label: 'Properties' },
        { value: formatStatValue(stats.totalRooms), label: 'Rooms' },
        { value: formatStatValue(stats.totalAvailableRooms), label: 'Available Rooms' },
        { value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—', label: 'Average Rating' },
      ]
    : [
        { value: '—', label: 'Properties' },
        { value: '—', label: 'Rooms' },
        { value: '—', label: 'Available Rooms' },
        { value: '—', label: 'Average Rating' },
      ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section style={{ background: 'var(--primary)', padding: '96px 32px', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,106,61,0.5) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '5%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,168,160,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container-wide" style={{ position: 'relative', textAlign: 'center' }}>
          <h1
            className="display-xl"
            style={{ color: 'var(--on-dark)', marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}
          >
            Find Your Perfect Stay
          </h1>
          <p
            className="body-lg"
            style={{
              color: 'rgba(252,252,252,0.85)',
              marginBottom: 24,
              maxWidth: 560,
              margin: '0 auto 24px',
            }}
          >
            Discover and book premium homestay &amp; resort rooms across Vietnam — simple, fast and secure.
          </p>

          <Link to="/rooms" className="btn-dark" style={{ marginBottom: 32, display: 'inline-flex' }}>
            Browse Rooms
          </Link>

          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              background: 'var(--surface-card)',
              borderRadius: 9999,
              padding: '6px 6px 6px 20px',
              maxWidth: 860,
              margin: '0 auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              alignItems: 'center',
            }}
          >
            <div ref={locationRef} style={{ flex: 1, minWidth: 180, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  placeholder="Location or property..."
                  value={search.location}
                  autoComplete="off"
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearch((p) => ({ ...p, location: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    background: 'transparent',
                    color: 'var(--ink)',
                    width: '100%',
                    padding: '6px 0',
                  }}
                />
              </div>

              {showSuggestions && (loadingSuggestions || filteredSuggestions.length > 0) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 14px)',
                    left: -20,
                    right: -8,
                    background: 'var(--surface-card)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(32,32,32,0.16)',
                    border: '1px solid var(--hairline)',
                    zIndex: 100,
                    overflow: 'hidden',
                    minWidth: 260,
                  }}
                >
                  {filteredSuggestions.some((s) => s.type === 'location') && (
                    <>
                      <div
                        style={{
                          padding: '8px 14px 4px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--ash)',
                        }}
                      >
                        Locations
                      </div>
                      {filteredSuggestions
                        .filter((s) => s.type === 'location')
                        .map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              setSearch((p) => ({ ...p, location: s.label }));
                              setShowSuggestions(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              width: '100%',
                              padding: '9px 14px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 14,
                              color: 'var(--ink)',
                              textAlign: 'left',
                            }}
                          >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                          </button>
                        ))}
                    </>
                  )}
                  {filteredSuggestions.some((s) => s.type === 'property') && (
                    <>
                      <div
                        style={{
                          padding: '8px 14px 4px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--ash)',
                          borderTop: filteredSuggestions.some((s) => s.type === 'location')
                            ? '1px solid var(--hairline)'
                            : 'none',
                          marginTop: 4,
                        }}
                      >
                        Properties
                      </div>
                      {filteredSuggestions
                        .filter((s) => s.type === 'property')
                        .map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              setSearch((p) => ({ ...p, location: s.label }));
                              setShowSuggestions(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              width: '100%',
                              padding: '9px 14px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 14,
                              color: 'var(--ink)',
                              textAlign: 'left',
                            }}
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
              <input
                type="date"
                value={search.checkIn}
                onChange={(e) => setSearch((p) => ({ ...p, checkIn: e.target.value }))}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  background: 'transparent',
                  color: search.checkIn ? 'var(--ink)' : 'var(--ash)',
                }}
              />
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--hairline)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <input
                type="date"
                value={search.checkOut}
                onChange={(e) => setSearch((p) => ({ ...p, checkOut: e.target.value }))}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  background: 'transparent',
                  color: search.checkOut ? 'var(--ink)' : 'var(--ash)',
                }}
              />
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--hairline)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <input
                type="number"
                min={1}
                max={20}
                value={search.guests}
                onChange={(e) => setSearch((p) => ({ ...p, guests: +e.target.value }))}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  background: 'transparent',
                  color: 'var(--ink)',
                  width: 50,
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--ash)' }}>guests</span>
            </div>
            <button type="submit" className="btn-primary btn-sm" style={{ borderRadius: 9999, whiteSpace: 'nowrap' }}>
              Search
            </button>
          </form>

          {dateError && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8, textAlign: 'center' }}>⚠ {dateError}</p>
          )}

          {locationChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5" style={{ justifyContent: 'center' }}>
              {locationChips.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setSearch((p) => ({ ...p, location: loc }));
                    navigate(`/search?location=${encodeURIComponent(loc)}`);
                  }}
                  style={{
                    fontSize: 13,
                    padding: '4px 12px',
                    borderRadius: 9999,
                    background: 'rgba(252,252,252,0.15)',
                    color: 'rgba(252,252,252,0.85)',
                    border: '1px solid rgba(252,252,252,0.25)',
                    cursor: 'pointer',
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {loadError && (
        <div className="container-wide" style={{ paddingTop: 16 }}>
          <div
            className="card"
            style={{
              padding: '16px 20px',
              border: '1px solid var(--error)',
              background: 'rgba(234,40,4,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <p className="body-sm" style={{ color: 'var(--error)', margin: 0 }}>
              {loadError}
            </p>
            <button type="button" className="btn-primary btn-sm" onClick={() => setReloadKey((k) => k + 1)}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Promo Banners — dynamic từ DB */}
      {promotions.length > 0 && (
        <section style={{ background: 'var(--surface-bone)', padding: '40px 32px' }}>
          <div className="container-wide">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {promotions.map((promo) => {
                const gradients: Record<string, string> = {
                  red:    'linear-gradient(135deg, #ea2804 0%, #ff6a3d 100%)',
                  blue:   'linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)',
                  green:  'linear-gradient(135deg, #1a5c3a 0%, #2e9c5e 100%)',
                  purple: 'linear-gradient(135deg, #4c1d8f 0%, #7c3aed 100%)',
                  orange: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                };
                const ctaColors: Record<string, string> = {
                  red: 'var(--primary)', blue: '#1a3c5e',
                  green: '#1a5c3a', purple: '#4c1d8f', orange: '#b45309',
                };
                const bg = gradients[promo.colorTheme] ?? gradients.red;
                const ctaColor = ctaColors[promo.colorTheme] ?? ctaColors.red;

                return (
                  <div
                    key={promo.id}
                    style={{
                      borderRadius: 16,
                      background: bg,
                      padding: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: -10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>
                      {promo.subtitle}
                    </span>
                    <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: 0, whiteSpace: 'pre-line' }}>
                      {promo.title}
                    </h3>
                    {promo.description && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                        {promo.description}
                      </p>
                    )}
                    <Link
                      to={promo.ctaUrl}
                      style={{
                        marginTop: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#fff',
                        color: ctaColor,
                        fontWeight: 700,
                        fontSize: 13,
                        padding: '8px 18px',
                        borderRadius: 9999,
                        textDecoration: 'none',
                        width: 'fit-content',
                      }}
                    >
                      {promo.ctaText}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Rooms */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-md" style={{ marginBottom: 6 }}>
                Featured Rooms
              </h2>
              <p className="body-md text-charcoal">Hand-picked premium rooms across Vietnam&apos;s top destinations</p>
            </div>
            <Link to="/rooms" className="btn-ghost">
              View all rooms →
            </Link>
          </div>

          {loadingRooms ? (
            <SectionSkeleton count={4} />
          ) : featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <p className="body-md text-charcoal mb-4">No featured rooms available yet.</p>
              <Link to="/rooms" className="btn-primary">
                Browse all rooms
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Properties */}
      <section id="properties" className="section-pad-sm" style={{ background: 'var(--surface-bone)', scrollMarginTop: 80 }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-md" style={{ marginBottom: 6 }}>
                Our Properties
              </h2>
              <p className="body-md text-charcoal">Premium homestays and resorts in Vietnam&apos;s top destinations</p>
            </div>
            <Link to="/rooms" className="btn-ghost">
              View all properties →
            </Link>
          </div>

          {loadingProperties ? (
            <SectionSkeleton count={3} cols={3} />
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <p className="body-md text-charcoal">Properties will appear here once added by managers.</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <h2 className="display-md" style={{ marginBottom: 12 }}>
            How It Works
          </h2>
          <p className="body-lg text-charcoal" style={{ marginBottom: 56 }}>
            Book your perfect stay in 3 simple steps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="card" style={{ padding: 28 }}>
                <div className="display-lg text-primary" style={{ marginBottom: 16 }}>
                  {step.step}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p className="body-md text-charcoal" style={{ lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-pad-sm" style={{ background: 'var(--surface-bone)' }}>
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {statItems.map((stat) => (
              <div key={stat.label}>
                <div className="display-md text-primary" style={{ marginBottom: 6 }}>
                  {stat.value}
                </div>
                <p className="body-sm text-charcoal">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section style={{ background: 'var(--primary)', padding: '72px 32px', textAlign: 'center' }}>
        <div className="container-wide">
          <h2 className="display-md" style={{ color: 'var(--on-dark)', marginBottom: 12 }}>
            Ready to Book Your Stay?
          </h2>
          <p className="body-lg" style={{ color: 'rgba(252,252,252,0.85)', marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>
            Join thousands of travelers who trust Homestay&amp;Resort for premium accommodations across Vietnam.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rooms" className="btn-dark">
              Browse Rooms
            </Link>
            <Link
              to="/register"
              className="btn-outline"
              style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'var(--on-dark)', background: 'transparent' }}
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
