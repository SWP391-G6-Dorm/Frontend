import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PublicLayout from '../../layouts/PublicLayout';
import RoomCard, { type Room } from '../../components/ui/RoomCard';
import { fetchFeaturedRooms, fetchPlatformStats } from '../../api/publicApi';

// ── SEO ───────────────────────────────────────────────────────────────────────
const PAGE_TITLE = 'KTX Manager — Hệ thống quản lý ký túc xá sinh viên';
const PAGE_DESC = 'Tìm phòng ký túc xá, đăng ký trực tuyến, thanh toán VNPay và quản lý hợp đồng — nhanh chóng, minh bạch, tiện lợi.';

const ROOM_TYPE_TABS = ['Tất cả', 'Studio', 'Phòng đơn', 'Phòng đôi', 'Phòng tập thể'] as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔍',
    title: 'Tìm kiếm & Lọc',
    desc: 'Duyệt phòng theo vị trí, mức giá, loại phòng và tiện ích. Tìm đúng nơi phù hợp với bạn.',
  },
  {
    step: '02',
    icon: '📝',
    title: 'Đăng ký trực tuyến',
    desc: 'Điền form đăng ký ký túc xá theo học kỳ. Không cần xếp hàng, xử lý nhanh chóng.',
  },
  {
    step: '03',
    icon: '💳',
    title: 'Thanh toán & Nhận phòng',
    desc: 'Thanh toán hóa đơn qua VNPay. Ký hợp đồng điện tử và nhận phòng ngay.',
  },
];

const FEATURES = [
  {
    icon: '🏢',
    title: 'Đăng ký ký túc xá trực tuyến',
    desc: 'Sinh viên đăng ký phòng theo học kỳ hoàn toàn trực tuyến. Theo dõi trạng thái đăng ký theo thời gian thực, không cần đến trực tiếp.',
    color: '#fde8e3',
    accent: 'var(--primary)',
  },
  {
    icon: '💳',
    title: 'Thanh toán VNPay tiện lợi',
    desc: 'Thanh toán hóa đơn tiền phòng, điện, nước qua VNPay. Lịch sử thanh toán minh bạch, nhận xác nhận ngay lập tức.',
    color: '#e0f2fe',
    accent: '#0369a1',
  },
  {
    icon: '🎫',
    title: 'Hỗ trợ & Báo cáo sự cố',
    desc: 'Gửi ticket hỗ trợ khi gặp sự cố. Theo dõi tiến trình xử lý và nhận thông báo khi được giải quyết.',
    color: '#dcfce7',
    accent: '#16a34a',
  },
];

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Nguyễn Thị Mai',
    school: 'Sinh viên năm 2 — FPT University',
    rating: 5,
    avatar: 'NM',
    avatarBg: '#fde8e3',
    avatarColor: 'var(--primary)',
    text: 'Đăng ký phòng KTX cực kỳ nhanh, chỉ mất 5 phút. Thanh toán VNPay rất tiện. Nhân viên hỗ trợ nhiệt tình và phản hồi nhanh.',
  },
  {
    id: '2',
    name: 'Trần Văn Khoa',
    school: 'Sinh viên năm 3 — FPT University',
    rating: 5,
    avatar: 'TK',
    avatarBg: '#e0f2fe',
    avatarColor: '#0369a1',
    text: 'Hệ thống dễ dùng, giao diện đẹp. Tôi theo dõi hóa đơn và thanh toán trực tiếp trên app mà không cần đến phòng quản lý.',
  },
  {
    id: '3',
    name: 'Phạm Hương Giang',
    school: 'Sinh viên năm 1 — FPT University',
    rating: 4,
    avatar: 'PG',
    avatarBg: '#dcfce7',
    avatarColor: '#16a34a',
    text: 'Là sinh viên năm nhất, tôi lo lắng về việc tìm phòng. KTX Manager giúp tôi tìm được phòng phù hợp và đăng ký ngay trong buổi.',
  },
];

// ── Animated stat counter ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 1400, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className="font-bold" style={{ fontSize: 36, color: 'var(--primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
        {count.toLocaleString('vi-VN')}{suffix}
      </div>
      <div className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>{label}</div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function RoomCardSkeleton() {
  return (
    <div className="card overflow-hidden flex flex-col" style={{ opacity: 0.7 }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 6 }} />
        <div className="flex gap-2">
          <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 9999 }} />
          <div className="skeleton" style={{ height: 24, width: 50, borderRadius: 9999 }} />
          <div className="skeleton" style={{ height: 24, width: 55, borderRadius: 9999 }} />
        </div>
        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--hairline)' }}>
          <div className="skeleton" style={{ height: 28, width: '45%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 34, width: 100, borderRadius: 9999 }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<typeof ROOM_TYPE_TABS[number]>('Tất cả');

  // React Query calls
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['featured-rooms'],
    queryFn: () => fetchFeaturedRooms(6),
    staleTime: 5 * 60 * 1000, // cache 5 mins
  });

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 10 * 60 * 1000,
  });

  // SEO
  useEffect(() => {
    document.title = PAGE_TITLE;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = PAGE_DESC;
    return () => { document.title = 'KTX Manager'; };
  }, []);

  const filteredRooms =
    activeTab === 'Tất cả'
      ? rooms
      : rooms.filter((r) => r.roomType === activeTab);

  const statsData = [
    { value: stats?.totalAvailableRooms || 2400, suffix: '+', label: 'Phòng đang trống' },
    { value: stats?.totalProperties || 850, suffix: '+', label: 'Cơ sở tin cậy' },
    { value: stats?.totalTenants || 12000, suffix: '+', label: 'Sinh viên hài lòng' },
    { value: stats?.satisfactionPercent || 98, suffix: '%', label: 'Tỷ lệ hài lòng' },
  ];

  return (
    <PublicLayout>
      {/* ══════════════════ HERO ══════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--primary)', minHeight: 560, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Mesh background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 20%, rgba(255,106,61,0.4) 0%, transparent 65%),' +
              'radial-gradient(ellipse 50% 60% at 10% 90%, rgba(244,168,160,0.25) 0%, transparent 55%),' +
              'radial-gradient(ellipse 40% 50% at 90% 80%, rgba(255,255,255,0.06) 0%, transparent 50%)',
          }}
        />
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="container-wide relative z-10 py-24">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto animate-fade-up">
            {/* Trust badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              <span style={{ fontSize: 14 }}>✨</span>
              <span className="label-sm" style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13 }}>
                Tin tưởng bởi 12,000+ sinh viên FPT
              </span>
            </div>

            <h1
              className="display-xl mb-6"
              style={{ color: '#fff', lineHeight: 1.0, letterSpacing: '-2.5px' }}
            >
              Chạm là thấy nhà<br />
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>thuê là yên tâm</span>
            </h1>

            <p className="body-lg mb-10" style={{ color: 'rgba(255,255,255,0.82)', maxWidth: 520 }}>
              Đăng ký phòng trực tuyến, thanh toán qua VNPay, theo dõi hợp đồng và gửi yêu cầu hỗ trợ — tất cả trong một nền tảng.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                to="/rooms"
                className="btn-dark"
                style={{ height: 52, padding: '0 36px', fontSize: 16, fontWeight: 700 }}
              >
                🏠 Tìm phòng ngay
              </Link>
              <Link
                to="/register"
                className="btn-outline"
                style={{
                  height: 52,
                  padding: '0 32px',
                  fontSize: 16,
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                }}
              >
                Đăng ký tài khoản →
              </Link>
            </div>

            {/* Trust badges row */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { icon: '✅', text: 'Phòng đã xác thực' },
                { icon: '🔒', text: 'Thanh toán bảo mật' },
                { icon: '⭐', text: '4.8/5 đánh giá' },
                { icon: '⚡', text: 'Duyệt trong 2 giờ' },
              ].map((b) => (
                <span key={b.text} className="caption flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {b.icon} {b.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
            <path d="M0 48h1440V24C1200 4 960 0 720 8 480 16 240 44 0 24v24z" fill="var(--surface-bone)" />
          </svg>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section style={{ background: 'var(--surface-bone)', padding: '48px 32px' }}>
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((s) => (
              <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED ROOMS ══════════════════ */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="label-sm mb-2" style={{ color: 'var(--ash)', letterSpacing: '0.08em' }}>
                PHÒNG NỔI BẬT
              </p>
              <h2 className="heading-lg" style={{ color: 'var(--ink)' }}>Phòng đang có sẵn</h2>
            </div>
            <Link to="/rooms" className="btn-outline hidden md:inline-flex" style={{ fontSize: 14 }}>
              Xem tất cả phòng →
            </Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ROOM_TYPE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="transition-all duration-150"
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: activeTab === tab ? 'none' : '1px solid var(--hairline)',
                  background: activeTab === tab ? 'var(--ink)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--charcoal)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Room grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingRooms
              ? Array.from({ length: 6 }).map((_, i) => <RoomCardSkeleton key={i} />)
              : filteredRooms.length > 0
                ? filteredRooms.map((room) => <RoomCard key={room.id} room={room} />)
                : (
                  <div className="col-span-3 text-center py-16">
                    <div className="text-4xl mb-3">🏠</div>
                    <p className="body-md" style={{ color: 'var(--muted)' }}>Không có phòng nào trong danh mục này.</p>
                  </div>
                )
            }
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link to="/rooms" className="btn-outline">Xem tất cả phòng →</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURE HIGHLIGHTS ══════════════════ */}
      <section className="section-pad" style={{ background: 'var(--surface-bone)' }}>
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="label-sm mb-3" style={{ color: 'var(--ash)', letterSpacing: '0.08em' }}>TẠI SAO CHỌN CHÚNG TÔI</p>
            <h2 className="heading-lg" style={{ color: 'var(--ink)' }}>Quản lý ký túc xá<br />chưa bao giờ dễ hơn</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card-lg p-7 flex flex-col gap-4 transition-all duration-200"
                style={{ background: 'var(--surface-card)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(32,32,32,0.10)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                <div
                  className="flex items-center justify-center rounded-2xl text-3xl"
                  style={{ width: 60, height: 60, background: f.color }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)', fontSize: 18 }}>{f.title}</h3>
                  <p className="body-sm" style={{ color: 'var(--charcoal)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
                <div className="mt-auto">
                  <Link to="/rooms" className="label-sm flex items-center gap-1 transition-all duration-150"
                    style={{ color: f.accent, textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.gap = '6px')}
                    onMouseLeave={(e) => (e.currentTarget.style.gap = '4px')}
                  >
                    Tìm hiểu thêm →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ ROOM TYPES ══════════════════ */}
      <section className="section-pad-sm" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="text-center mb-8">
            <p className="label-sm mb-2" style={{ color: 'var(--ash)', letterSpacing: '0.08em' }}>TÌM THEO LOẠI PHÒNG</p>
            <h2 className="heading-md" style={{ color: 'var(--ink)' }}>Chọn loại phù hợp</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'Studio', icon: '🏠', count: 284, desc: 'Căn hộ khép kín' },
              { type: 'Phòng đơn', icon: '🛏️', count: 612, desc: 'Phòng riêng, tiện ích chung' },
              { type: 'Phòng đôi', icon: '🛋️', count: 198, desc: 'Phòng rộng dành cho 2 người' },
              { type: 'Phòng tập thể', icon: '🏘️', count: 145, desc: 'Tiết kiệm, tiện nghi đủ dùng' },
            ].map((cat) => (
              <Link
                key={cat.type}
                to={`/rooms?type=${encodeURIComponent(cat.type)}`}
                className="card flex flex-col items-center text-center p-6 transition-all duration-200 no-underline"
                style={{ textDecoration: 'none' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(234,40,4,0.12)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--hairline)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="heading-sm mb-1" style={{ color: 'var(--ink)', fontSize: 17 }}>{cat.type}</h3>
                <p className="body-sm mb-3" style={{ color: 'var(--charcoal)' }}>{cat.desc}</p>
                <span className="badge badge-neutral">{cat.count} phòng</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="section-pad" style={{ background: 'var(--surface-dark)' }}>
        <div className="container-wide">
          <div className="text-center mb-14">
            <p className="label-sm mb-3" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>QUY TRÌNH ĐƠN GIẢN</p>
            <h2 className="display-lg" style={{ color: 'var(--on-dark)', lineHeight: 1 }}>Cách hoạt động</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px"
              style={{ background: 'rgba(255,255,255,0.1)', zIndex: 0 }}
            />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="flex flex-col gap-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center rounded-2xl text-2xl flex-shrink-0"
                    style={{
                      width: 60,
                      height: 60,
                      background: i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="font-bold"
                    style={{ fontSize: 48, color: 'rgba(255,255,255,0.06)', lineHeight: 1, letterSpacing: '-2px', userSelect: 'none' }}
                  >
                    {step.step}
                  </span>
                </div>
                <div>
                  <span className="caption" style={{ color: 'var(--primary)' }}>BƯỚC {step.step}</span>
                  <h3 className="heading-sm mt-1 mb-2" style={{ color: 'var(--on-dark)', fontSize: 20 }}>{step.title}</h3>
                  <p className="body-md" style={{ color: 'var(--on-dark-mute)', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="label-sm mb-3" style={{ color: 'var(--ash)', letterSpacing: '0.08em' }}>ĐÁNH GIÁ TỪ SINH VIÊN</p>
            <h2 className="heading-lg" style={{ color: 'var(--ink)' }}>Sinh viên nói gì về chúng tôi?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="card-lg p-6 flex flex-col gap-4 transition-all duration-200"
                style={{ background: 'var(--surface-card)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(32,32,32,0.09)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                      fill={i < t.rating ? '#f59e0b' : 'var(--hairline)'}
                      stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="body-md flex-1" style={{ color: 'var(--charcoal)', lineHeight: 1.75, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--hairline)' }}>
                  <div
                    className="flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0"
                    style={{
                      width: 42,
                      height: 42,
                      background: t.avatarBg,
                      color: t.avatarColor,
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{t.name}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section
        className="section-pad-sm relative overflow-hidden"
        style={{ background: 'var(--primary)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),' +
              'radial-gradient(ellipse 40% 60% at 80% 30%, rgba(255,106,61,0.3) 0%, transparent 50%)',
          }}
        />
        <div className="container-wide text-center relative z-10">
          <h2
            className="display-md mb-4"
            style={{ color: '#fff', letterSpacing: '-0.5px' }}
          >
            Sẵn sàng tìm phòng ký túc xá?
          </h2>
          <p className="body-lg mb-10" style={{ color: 'rgba(255,255,255,0.82)', maxWidth: 460, margin: '0 auto 40px' }}>
            Tham gia cùng hàng nghìn sinh viên đã đăng ký phòng qua KTX Manager.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/rooms"
              className="btn-dark"
              style={{ height: 52, padding: '0 36px', fontSize: 16 }}
            >
              Tìm phòng ngay
            </Link>
            <Link
              to="/register"
              className="btn-outline"
              style={{ height: 52, padding: '0 36px', fontSize: 16, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
