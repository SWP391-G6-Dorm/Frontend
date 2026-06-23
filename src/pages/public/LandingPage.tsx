import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import {
  fetchFeaturedRooms,
  fetchFeaturedProperties,
  fetchPlatformStats,
  fetchPromotions,
  type FeaturedRoom,
  type FeaturedProperty,
  type PlatformStats,
  type Promotion,
} from '../../api/publicApi';
import { formatStatValue, resolveMediaUrl } from '../../utils/mediaUrl';
import SafeImage from '../../components/ui/SafeImage';

/** Banner mặc định SCR-01 khi DB chưa có promotion (fallback hiển thị ngay) */
const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'default-1',
    subtitle: 'Ưu đãi cuối tuần',
    title: 'Giảm 20%\nthứ 6 – chủ nhật',
    description: 'Áp dụng cho phòng trống cuối tuần tại tất cả homestay.',
    ctaText: 'Đặt ngay →',
    ctaUrl: '/search?sort=price-asc',
    colorTheme: 'red',
    isActive: true,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'default-2',
    subtitle: 'Đặt sớm hè 2026',
    title: 'Combo 3 đêm\n+ bữa sáng miễn phí',
    description: 'Ưu đãi có hạn — đặt trước 31/08/2026.',
    ctaText: 'Khám phá →',
    ctaUrl: '/search',
    colorTheme: 'blue',
    isActive: true,
    sortOrder: 1,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'default-3',
    subtitle: 'Lưu trú dài hạn',
    title: 'Giảm thêm 15%\ncho booking từ 5 đêm',
    description: 'Lý tưởng cho kỳ nghỉ dài ngày hoặc công tác.',
    ctaText: 'Xem phòng →',
    ctaUrl: '/rooms',
    colorTheme: 'green',
    isActive: true,
    sortOrder: 2,
    createdAt: '',
    updatedAt: '',
  },
];

const HERO_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&h=650&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop',
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search & Browse', desc: 'Find your perfect room by location, dates, type and capacity with real-time availability.' },
  { step: '02', title: 'Book & Deposit', desc: 'Confirm your booking with a 40% deposit. Receive your contract instantly via email.' },
  { step: '03', title: 'Check In & Enjoy', desc: 'Pay the remaining balance at check-in and enjoy your premium homestay experience.' },
];

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

  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);

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
        fetchPromotions(),
      ]);

      if (cancelled) return;

      const [roomsResult, propertiesResult, statsResult, promoResult] = results;

      if (promoResult.status === 'fulfilled') {
        const promos = promoResult.value;
        setPromotions(promos.length > 0 ? promos : DEFAULT_PROMOTIONS);
      } else {
        setPromotions(DEFAULT_PROMOTIONS);
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
    if (window.location.hash === '#properties') {
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loadingProperties]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.checkIn && search.checkOut && search.checkIn >= search.checkOut) {
      setDateError('Ngày check-out phải sau ngày check-in');
      return;
    }
    setDateError('');
    const params = new URLSearchParams();
    const term = search.location.trim();
    if (term) params.set('location', term);
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

  const heroImages = [
    featuredRooms[0]?.primaryImageUrl ?? featuredProperties[0]?.coverImageUrl,
    featuredRooms[1]?.primaryImageUrl ?? featuredProperties[1]?.coverImageUrl,
    featuredRooms[2]?.primaryImageUrl ?? featuredProperties[2]?.coverImageUrl,
  ].map((url, i) => (url ? resolveMediaUrl(url) : HERO_FALLBACK_IMAGES[i]));

  return (
    <PublicLayout>
      {/* Hero — compact split layout with imagery */}
      <section
        style={{
          padding: '40px 32px 36px',
          background: 'linear-gradient(135deg, #faf8f4 0%, #f3efe6 55%, #fce8e4 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234,40,4,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="container-wide"
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32,
            alignItems: 'center',
          }}
        >
          {/* Left — copy + search */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
                background: 'rgba(234,40,4,0.08)',
                padding: '6px 12px',
                borderRadius: 9999,
                marginBottom: 14,
              }}
            >
              ✦ Homestay &amp; Resort Việt Nam
            </span>

            <h1
              className="heading-md"
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: 10,
                maxWidth: 480,
              }}
            >
              Tìm nơi lưu trú hoàn hảo
            </h1>
            <p className="body-md text-charcoal" style={{ marginBottom: 20, maxWidth: 440, lineHeight: 1.6 }}>
              Khám phá homestay &amp; resort cao cấp — đặt phòng nhanh, an toàn, minh bạch giá.
            </p>

            <form onSubmit={handleSearch} className="hero-search-pill">
              <div className="hero-search-field hero-search-field--location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  placeholder="Bạn muốn đi đâu?"
                  value={search.location}
                  autoComplete="off"
                  onChange={(e) => setSearch((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <span className="hero-search-sep" aria-hidden />

              <div className="hero-search-field hero-search-field--date">
                <input
                  type="date"
                  value={search.checkIn}
                  onChange={(e) => setSearch((p) => ({ ...p, checkIn: e.target.value }))}
                  title="Check-in"
                />
              </div>

              <span className="hero-search-sep" aria-hidden />

              <div className="hero-search-field hero-search-field--date">
                <input
                  type="date"
                  value={search.checkOut}
                  onChange={(e) => setSearch((p) => ({ ...p, checkOut: e.target.value }))}
                  title="Check-out"
                />
              </div>

              <span className="hero-search-sep" aria-hidden />

              <div className="hero-search-field hero-search-field--guests">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={search.guests}
                  onChange={(e) => setSearch((p) => ({ ...p, guests: +e.target.value }))}
                  aria-label="Số khách"
                />
                <span className="hero-search-guest-label">khách</span>
              </div>

              <button type="submit" className="hero-search-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="hero-search-btn-text">Tìm</span>
              </button>
            </form>

            {dateError && (
              <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 8 }}>⚠ {dateError}</p>
            )}
          </div>

          {/* Right — image collage */}
          <div className="landing-hero-visual" style={{ position: 'relative', minHeight: 280, maxWidth: 480, margin: '0 auto', width: '100%', paddingBottom: 8 }}>
            <SafeImage
              src={heroImages[0]}
              alt="Homestay resort"
              style={{
                width: '100%',
                height: 280,
                objectFit: 'cover',
                borderRadius: 20,
                boxShadow: '0 20px 50px rgba(32,32,32,0.15)',
                display: 'block',
              }}
            />
            <SafeImage
              src={heroImages[1]}
              alt="Phòng view biển"
              className="landing-hero-float"
              style={{
                position: 'absolute',
                bottom: -16,
                left: -12,
                width: 130,
                height: 100,
                objectFit: 'cover',
                borderRadius: 14,
                border: '3px solid #fff',
                boxShadow: '0 8px 24px rgba(32,32,32,0.18)',
              }}
            />
            <SafeImage
              src={heroImages[2]}
              alt="Resort villa"
              className="landing-hero-float landing-hero-float-tr"
              style={{
                position: 'absolute',
                top: 20,
                right: -16,
                width: 110,
                height: 90,
                objectFit: 'cover',
                borderRadius: 14,
                border: '3px solid #fff',
                boxShadow: '0 8px 24px rgba(32,32,32,0.18)',
              }}
            />
            {stats && stats.totalProperties > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  right: 20,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  boxShadow: '0 4px 20px rgba(32,32,32,0.12)',
                  border: '1px solid var(--hairline)',
                }}
              >
                <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>
                  {formatStatValue(stats.totalProperties)}
                </p>
                <p className="body-sm text-charcoal" style={{ margin: 0, fontSize: 11 }}>Homestay &amp; resort</p>
              </div>
            )}
          </div>
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

      {/* Promo Banners — dynamic từ DB (fallback mặc định nếu chưa seed) */}
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
