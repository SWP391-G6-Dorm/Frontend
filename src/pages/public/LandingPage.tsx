import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import {
  fetchFeaturedProperties,
  fetchPlatformStats,
  fetchPromotions,
  type FeaturedProperty,
  type PlatformStats,
  type Promotion,
} from '../../api/publicApi';
import { formatStatValue } from '../../utils/mediaUrl';
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
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'var(--primary)' : '#e5e7eb'} stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
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
  const [search, setSearch] = useState({ location: '' });

  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  const isGuest = !sessionStorage.getItem('userRole');

  useEffect(() => {
    let cancelled = false;

    async function loadLandingData() {
      setLoadError('');
      setLoadingProperties(true);

      const results = await Promise.allSettled([
        fetchFeaturedProperties(6),
        fetchPlatformStats(),
        fetchPromotions(),
      ]);

      if (cancelled) return;

      const [propertiesResult, statsResult, promoResult] = results;

      if (promoResult.status === 'fulfilled') {
        let promos = promoResult.value;
        if (promos.length > 0) {
          promos.sort((a, b) => a.sortOrder - b.sortOrder);
          setPromotions(promos);
        } else {
          setPromotions(DEFAULT_PROMOTIONS);
        }
      } else {
        setPromotions(DEFAULT_PROMOTIONS);
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

      setLoadingProperties(false);
    }

    loadLandingData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  useEffect(() => {
    if (window.location.hash === '#properties') {
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loadingProperties]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const term = search.location.trim();
    if (term) params.set('location', term);
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

  const activePromo = promotions[activePromoIndex] || DEFAULT_PROMOTIONS[0];
  const gradients: Record<string, string> = {
    red:    'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
    teal:   'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
    blue:   'linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)',
    green:  'linear-gradient(135deg, #1a5c3a 0%, #2e9c5e 100%)',
    purple: 'linear-gradient(135deg, #4c1d8f 0%, #7c3aed 100%)',
    orange: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
  };
  const ctaColors: Record<string, string> = {
    red: '#0F766E', teal: '#0F766E', blue: '#1a3c5e',
    green: '#1a5c3a', purple: '#4c1d8f', orange: '#b45309',
  };
  const bg = gradients[activePromo.colorTheme] ?? gradients.red;
  const ctaColor = ctaColors[activePromo.colorTheme] ?? ctaColors.red;

  let finalCtaText = activePromo.ctaText;
  let finalCtaUrl = activePromo.ctaUrl;
  if (isGuest && (finalCtaText.toLowerCase().includes('book') || finalCtaText.toLowerCase().includes('đặt'))) {
    finalCtaText = 'Login to Book';
    finalCtaUrl = '/login';
  }

  return (
    <PublicLayout>
      {/* Hero — Carousel with Search Form embedded */}
      <section
        style={{
          padding: '40px 32px 36px',
          background: 'var(--primary-base)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bg,
            transition: 'background 0.5s ease',
            zIndex: 0,
          }}
        />

        <div
          className="container-wide"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32,
            alignItems: 'center',
          }}
        >
          {/* Left — copy + search */}
          <div>
            <h1
              className="text-display-lg text-inverted"
              style={{
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: 10,
                maxWidth: 480,
                color: '#fff',
              }}
            >
              Find Your Zen
            </h1>
            <p className="body-md text-inverted" style={{ marginBottom: 20, maxWidth: 440, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              Khám phá homestay &amp; resort cao cấp — đặt phòng nhanh, an toàn, minh bạch giá.
            </p>

            <form onSubmit={handleSearch} className="hero-search-pill" style={{ background: '#fff', padding: 8, borderRadius: 9999, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="hero-search-field hero-search-field--location" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  placeholder="Bạn muốn đi đâu?"
                  value={search.location}
                  autoComplete="off"
                  onChange={(e) => setSearch((p) => ({ ...p, location: e.target.value }))}
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                />
              </div>

              <button type="submit" className="button-primary" style={{ padding: '12px 24px', borderRadius: 9999, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Search
              </button>
            </form>
          </div>

          {/* Right — Promo Carousel */}
          <div className="landing-hero-visual" style={{ position: 'relative', minHeight: 280, maxWidth: 480, margin: '0 auto', width: '100%', paddingBottom: 8 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                color: '#fff',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>
                {activePromo.subtitle}
              </span>
              <h3 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.25, margin: '8px 0 16px', whiteSpace: 'pre-line' }}>
                {activePromo.title}
              </h3>
              {activePromo.description && (
                <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 24 }}>
                  {activePromo.description}
                </p>
              )}
              <Link
                to={finalCtaUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#fff',
                  color: ctaColor,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '12px 24px',
                  borderRadius: 9999,
                  textDecoration: 'none',
                }}
              >
                {finalCtaText}
              </Link>
            </div>
            
            {/* Carousel dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {promotions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePromoIndex(i)}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i === activePromoIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>
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



      {/* Featured Properties */}
      <section id="properties" className="section-pad-sm" style={{ background: 'var(--surface-bone)', scrollMarginTop: 80 }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-heading-lg" style={{ marginBottom: 6 }}>
                Popular Destinations
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
