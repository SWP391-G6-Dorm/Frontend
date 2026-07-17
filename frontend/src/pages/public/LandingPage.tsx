import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import {
  fetchFeaturedProperties,
  fetchFeaturedRooms,
  fetchPlatformStats,
  fetchPromotions,
  type FeaturedProperty,
  type FeaturedRoom,
  type PlatformStats,
  type Promotion,
} from '../../api/publicApi';
import { formatStatValue } from '../../utils/mediaUrl';
import SafeImage from '../../components/ui/SafeImage';
import BannerCarousel, { type BannerSlide } from '../../components/public/BannerCarousel';
import RoomCard from '../../components/ui/RoomCard';
import { useAuthStore } from '../../store/authStore';

/** Banner mặc định SCR-01 khi DB chưa có promotion (fallback hiển thị ngay) */
const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'default-1',
    subtitle: 'Ưu đãi cuối tuần',
    title: 'Giảm 20%\nthứ 6 – chủ nhật',
    description: 'Áp dụng cho phòng trống cuối tuần tại tất cả homestay.',
    ctaText: 'Đặt ngay →',
    ctaUrl: '/search?sort=price-asc',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=480&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=480&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=480&fit=crop',
    colorTheme: 'green',
    isActive: true,
    sortOrder: 2,
    createdAt: '',
    updatedAt: '',
  },
];

const FALLBACK_BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=480&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=480&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=480&fit=crop',
];

function promotionToSlide(promo: Promotion, index: number): BannerSlide {
  const src = promo.imageUrl?.trim() || FALLBACK_BANNER_IMAGES[index % FALLBACK_BANNER_IMAGES.length];
  return {
    src,
    alt: promo.title.replace('\n', ' '),
  };
}

const HOW_IT_WORKS = [
  { step: '01', title: 'Search & Browse', desc: 'Find your perfect room by location, dates, type and capacity with real-time availability.' },
  { step: '02', title: 'Book & Deposit', desc: 'Confirm your booking with a 40% deposit. Receive your contract instantly via email.' },
  { step: '03', title: 'Check In & Enjoy', desc: 'Pay the remaining balance at check-in and enjoy your premium homestay experience.' },
];

function toRoomCardProps(room: FeaturedRoom) {
  return {
    id: room.id,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    pricePerNight: room.pricePerNight,
    capacity: room.capacity,
    area: room.area,
    status: room.status,
    propertyName: room.propertyName,
    address: room.propertyName,
    imageUrl: room.primaryImageUrl || '',
  };
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
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState({ location: '', checkIn: '', checkOut: '', guests: '2' });

  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  const isGuest = !isAuthenticated;

  useEffect(() => {
    let cancelled = false;

    async function loadLandingData() {
      setLoadError('');
      setLoadingProperties(true);
      setLoadingRooms(true);

      const results = await Promise.allSettled([
        fetchFeaturedProperties(6),
        fetchFeaturedRooms(8),
        fetchPlatformStats(),
        fetchPromotions(),
      ]);

      if (cancelled) return;

      const [propertiesResult, roomsResult, statsResult, promoResult] = results;

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

      if (roomsResult.status === 'fulfilled') {
        setFeaturedRooms(roomsResult.value);
      } else {
        setFeaturedRooms([]);
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
      setLoadingRooms(false);
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
    const params = new URLSearchParams();
    const term = search.location.trim();
    if (term) params.set('location', term);
    if (search.checkIn) params.set('checkIn', search.checkIn);
    if (search.checkOut) params.set('checkOut', search.checkOut);
    const guests = parseInt(search.guests, 10);
    if (guests > 0) params.set('guests', String(guests));
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

  const bannerSlides = promotions.map((promo, i) => promotionToSlide(promo, i));
  const safePromoIndex = promotions.length ? activePromoIndex % promotions.length : 0;
  const activePromo = promotions[safePromoIndex] || DEFAULT_PROMOTIONS[0];

  let finalCtaText = activePromo.ctaText;
  let finalCtaUrl = activePromo.ctaUrl;
  if (isGuest && (finalCtaText.toLowerCase().includes('book') || finalCtaText.toLowerCase().includes('đặt'))) {
    finalCtaText = 'Đăng nhập để đặt';
    finalCtaUrl = '/login';
  }

  return (
    <PublicLayout>
      {/* Hero — banner ảnh + search, responsive */}
      <section className="landing-banner" aria-label="Banner trang chủ">
        <div className="landing-banner-inner">
          <header className="landing-banner-header">
            <h1 className="landing-banner-title">
              Find Your <span>Zen</span>
            </h1>
            <p className="landing-banner-subtitle">
              Homestay &amp; resort giữa thiên nhiên — đặt phòng nhẹ nhàng, minh bạch giá.
            </p>
          </header>

          <div className="landing-banner-stage">
            <BannerCarousel
              slides={bannerSlides}
              activeIndex={safePromoIndex}
              onChange={setActivePromoIndex}
            >
              <div className="landing-banner-promo-card">
                <div>
                  <span className="landing-banner-promo-kicker">{activePromo.subtitle}</span>
                  <h2 className="landing-banner-promo-title">{activePromo.title}</h2>
                </div>
                <Link to={finalCtaUrl} className="landing-banner-promo-cta">
                  {finalCtaText}
                </Link>
              </div>
            </BannerCarousel>

            <div className="landing-banner-dots" role="tablist" aria-label="Chọn slide banner">
              {promotions.map((promo, i) => (
                <button
                  key={promo.id ?? i}
                  type="button"
                  role="tab"
                  aria-selected={i === safePromoIndex}
                  aria-label={`Slide ${i + 1}`}
                  className={`landing-banner-dot${i === safePromoIndex ? ' is-active' : ''}`}
                  onClick={() => setActivePromoIndex(i)}
                />
              ))}
            </div>
          </div>

          <div className="landing-banner-search">
            <form onSubmit={handleSearch} className="hero-search-pill">
              <div className="hero-search-field hero-search-field--location">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="hero-search-field-meta">
                  <span className="hero-search-field-label">Địa điểm</span>
                  <input
                    placeholder="Bạn muốn đi đâu?"
                    value={search.location}
                    autoComplete="off"
                    aria-label="Địa điểm"
                    onChange={(e) => setSearch((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>

              <span className="hero-search-sep" aria-hidden="true" />

              <div className="hero-search-field hero-search-field--date">
                <span className="hero-search-field-label">Nhận phòng</span>
                <input
                  type="date"
                  aria-label="Ngày nhận phòng"
                  value={search.checkIn}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSearch((p) => ({ ...p, checkIn: e.target.value }))}
                />
              </div>

              <span className="hero-search-sep" aria-hidden="true" />

              <div className="hero-search-field hero-search-field--date">
                <span className="hero-search-field-label">Trả phòng</span>
                <input
                  type="date"
                  aria-label="Ngày trả phòng"
                  value={search.checkOut}
                  min={search.checkIn || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSearch((p) => ({ ...p, checkOut: e.target.value }))}
                />
              </div>

              <span className="hero-search-sep" aria-hidden="true" />

              <div className="hero-search-field hero-search-field--guests">
                <span className="hero-search-field-label">Khách</span>
                <input
                  type="number"
                  aria-label="Số khách"
                  min={1}
                  max={20}
                  value={search.guests}
                  onChange={(e) => setSearch((p) => ({ ...p, guests: e.target.value }))}
                />
              </div>

              <button type="submit" className="hero-search-btn">
                <span className="hero-search-btn-text">Tìm phòng</span>
              </button>
            </form>
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



      {/* Featured Rooms */}
      <section className="section-pad-sm" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-heading-lg" style={{ marginBottom: 6 }}>
                Featured Rooms
              </h2>
              <p className="body-md text-charcoal">Hand-picked rooms available for your next getaway</p>
            </div>
            <Link to="/rooms" className="btn-ghost">
              View all rooms →
            </Link>
          </div>

          {loadingRooms ? (
            <SectionSkeleton count={4} cols={4} />
          ) : featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} room={toRoomCardProps(room)} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <p className="body-md text-charcoal">Featured rooms will appear here once properties are added.</p>
            </div>
          )}
        </div>
      </section>

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
