import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { fetchAboutContent, type AboutContent } from '../../api/publicApi';
import SafeImage from '../../components/ui/SafeImage';

// SCR-10 — About / Contact (CMS via Admin)
// Form liên hệ → Complaint (simulate)

const DEFAULT_CONTENT: AboutContent = {
  id: 'default',
  heroBrand: 'Homestay&Resort',
  heroTitle: 'Kết nối du khách với những kỳ nghỉ đáng nhớ',
  heroSubtitle:
    'Nền tảng đặt phòng homestay & resort tin cậy tại Việt Nam — tìm phòng, đặt cọc, hợp đồng điện tử và thanh toán, tất cả ở một nơi.',
  heroImageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=80',
  ctaPrimaryText: 'Khám phá phòng',
  ctaPrimaryUrl: '/rooms',
  ctaSecondaryText: 'Liên hệ với chúng tôi',
  storyEyebrow: 'CÂU CHUYỆN CỦA CHÚNG TÔI',
  storyTitle: 'Bắt đầu từ trăn trở của một người lữ hành',
  storyBody1:
    'Thành lập năm 2023, Homestay&Resort ra đời khi những người sáng lập gặp khó khăn trong việc tìm chỗ ở tin cậy tại Việt Nam — thông tin rời rạc, không có hợp đồng điện tử, giá cả thiếu minh bạch.',
  storyBody2:
    'Hôm nay, chúng tôi phục vụ hàng nghìn du khách và chủ nhà đã xác minh tại Đà Nẵng, Đà Lạt, Hội An, Phú Quốc và Nha Trang — từ tìm phòng đến thanh toán và hợp đồng, tất cả trong một nền tảng.',
  storyImage1Url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
  storyImage2Url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&q=80',
  storyImage3Url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=500&q=80',
  storyCtaText: 'Xem các điểm đến →',
  storyCtaUrl: '/rooms',
  valuesEyebrow: 'GIÁ TRỊ CỐT LÕI',
  valuesTitle: 'Điều chúng tôi cam kết trong từng kỳ nghỉ',
  contactEyebrow: 'LIÊN HỆ',
  contactTitle: 'Chúng tôi luôn sẵn sàng lắng nghe',
  contactIntro:
    'Bạn có câu hỏi, khiếu nại hay đề xuất hợp tác? Đội ngũ của chúng tôi thường phản hồi trong vòng 24 giờ làm việc.',
  address: '125 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  email: 'support@homestay-resort.vn',
  phone: '+84 28 1234 5678',
  workingHours: 'Thứ 2 – Thứ 6: 8:00 – 17:30 (ICT)',
  stats: [
    { value: '2023', label: 'Năm thành lập' },
    { value: '5+', label: 'Thành phố' },
    { value: '5.000+', label: 'Khách hài lòng' },
    { value: '98%', label: 'Đánh giá tích cực' },
  ],
  values: [
    { num: '01', title: 'Tin cậy', desc: 'Mọi cơ sở lưu trú đều được xác minh. Mọi thông tin phòng đều chính xác, minh bạch.' },
    { num: '02', title: 'Minh bạch', desc: 'Không phí ẩn. Giá phòng, tiền cọc và chính sách hủy rõ ràng ngay từ đầu.' },
    { num: '03', title: 'Nhanh chóng', desc: 'Từ tìm phòng đến nhận phòng chỉ trong 24 giờ — hợp đồng điện tử, thanh toán trực tuyến.' },
    { num: '04', title: 'Công bằng', desc: 'Khiếu nại và tranh chấp được xử lý chuyên nghiệp, đặt quyền lợi khách hàng lên trước.' },
  ],
  updatedAt: '',
};

function renderBrand(brand: string) {
  const ampIndex = brand.indexOf('&');
  if (ampIndex === -1) return brand;
  return (
    <>
      {brand.slice(0, ampIndex)}
      <span>&amp;</span>
      {brand.slice(ampIndex + 1)}
    </>
  );
}

function ContactIcon({ type }: { type: 'address' | 'email' | 'phone' | 'hours' }) {
  if (type === 'address') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  if (type === 'email') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
    );
  }
  if (type === 'phone') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [pageLoading, setPageLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAboutContent()
      .then(setContent)
      .catch(() => setContent(DEFAULT_CONTENT))
      .finally(() => setPageLoading(false));
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên.';
    if (!email.trim()) e.email = 'Vui lòng nhập email.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email không hợp lệ.';
    if (!subject.trim()) e.subject = 'Vui lòng nhập tiêu đề.';
    if (!message.trim()) e.message = 'Vui lòng nhập nội dung.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  function FieldError({ field }: { field: string }) {
    return errors[field] ? (
      <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors[field]}</p>
    ) : null;
  }

  const contacts = [
    { label: 'Địa chỉ', value: content.address, icon: 'address' as const },
    { label: 'Email', value: content.email, icon: 'email' as const },
    { label: 'Hotline', value: content.phone, icon: 'phone' as const },
    { label: 'Giờ làm việc', value: content.workingHours, icon: 'hours' as const },
  ];

  if (pageLoading) {
    return (
      <PublicLayout>
        <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="body-md text-charcoal">Đang tải…</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="about-hero">
        <div className="about-hero__media">
          <SafeImage
            className="about-hero__img"
            src={content.heroImageUrl}
            alt={content.heroTitle}
          />
          <div className="about-hero__shade" />
        </div>
        <div className="about-hero__content">
          <p className="about-hero__brand">{renderBrand(content.heroBrand)}</p>
          <h1 className="about-hero__title">{content.heroTitle}</h1>
          <p className="about-hero__sub">{content.heroSubtitle}</p>
          <div className="about-hero__actions">
            <Link
              to={content.ctaPrimaryUrl || '/rooms'}
              className="btn-primary"
              style={{ height: 44, padding: '0 22px', borderRadius: 9999 }}
            >
              {content.ctaPrimaryText}
            </Link>
            {content.ctaSecondaryText?.trim() ? (
              <a
                href="#contact"
                className="btn-outline"
                style={{
                  height: 44,
                  padding: '0 22px',
                  borderRadius: 9999,
                  background: 'rgba(255,255,255,0.12)',
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: '#fff',
                }}
              >
                {content.ctaSecondaryText}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--hairline)' }}>
        <div className="container-wide about-stats">
          {content.stats.map((s) => (
            <div key={s.label} className="about-stat">
              <div className="about-stat__value">{s.value}</div>
              <div className="about-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="about-story-grid">
            <div>
              <p className="label-sm mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.08em' }}>
                {content.storyEyebrow}
              </p>
              <h2 className="display-md mb-5" style={{ color: 'var(--ink)' }}>{content.storyTitle}</h2>
              <p className="body-lg mb-4" style={{ color: 'var(--body)' }}>{content.storyBody1}</p>
              <p className="body-lg mb-6" style={{ color: 'var(--body)' }}>{content.storyBody2}</p>
              {content.storyCtaText?.trim() ? (
                <Link
                  to={content.storyCtaUrl || '/rooms'}
                  className="btn-outline"
                  style={{ borderRadius: 9999, padding: '0 20px', height: 42 }}
                >
                  {content.storyCtaText}
                </Link>
              ) : null}
            </div>

            <div className="relative">
              <SafeImage
                src={content.storyImage1Url}
                alt={content.storyTitle}
                className="w-full object-cover"
                style={{ borderRadius: 16, height: 300 }}
              />
              <div className="grid grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                <SafeImage
                  src={content.storyImage2Url}
                  alt=""
                  className="w-full object-cover"
                  style={{ borderRadius: 16, height: 170 }}
                />
                <SafeImage
                  src={content.storyImage3Url}
                  alt=""
                  className="w-full object-cover"
                  style={{ borderRadius: 16, height: 170 }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad-sm" style={{ background: 'var(--surface-bone)' }}>
        <div className="container-wide">
          <div style={{ maxWidth: 560, marginBottom: 48 }}>
            <p className="label-sm mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.08em' }}>
              {content.valuesEyebrow}
            </p>
            <h2 className="display-md" style={{ color: 'var(--ink)' }}>{content.valuesTitle}</h2>
          </div>
          <div className="about-values-grid">
            {content.values.map((v) => (
              <div key={v.num} className="about-value-item">
                <span className="about-value-num" style={{ paddingTop: 16 }}>{v.num}</span>
                <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>{v.title}</h3>
                <p className="body-sm" style={{ color: 'var(--charcoal)', lineHeight: 1.65 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="about-contact-grid">
            <div>
              <p className="label-sm mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.08em' }}>
                {content.contactEyebrow}
              </p>
              <h2 className="display-md mb-4" style={{ color: 'var(--ink)' }}>{content.contactTitle}</h2>
              <p className="body-lg mb-8" style={{ color: 'var(--body)' }}>{content.contactIntro}</p>

              <div className="flex flex-col gap-5">
                {contacts.map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 44,
                        height: 44,
                        background: 'rgba(15,118,110,0.08)',
                        color: 'var(--primary)',
                      }}
                    >
                      <ContactIcon type={c.icon} />
                    </div>
                    <div>
                      <p className="label-sm" style={{ color: 'var(--ink)' }}>{c.label}</p>
                      <p className="body-md" style={{ color: 'var(--charcoal)' }}>{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {submitted ? (
                <div
                  className="card-lg p-8 text-center flex flex-col items-center justify-center animate-fade-in"
                  style={{ minHeight: 420 }}
                >
                  <div
                    className="flex items-center justify-center rounded-full mb-4"
                    style={{ width: 64, height: 64, background: 'rgba(15,118,110,0.1)', color: 'var(--primary)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Đã gửi tin nhắn!</h3>
                  <p className="body-md mb-6" style={{ color: 'var(--charcoal)' }}>
                    Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                    className="btn-outline"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <div className="card-lg p-8">
                  <h3 className="heading-md mb-6" style={{ color: 'var(--ink)' }}>Gửi tin nhắn cho chúng tôi</h3>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="form-label" htmlFor="contact-name">Họ và tên</label>
                      <input
                        id="contact-name"
                        type="text"
                        className="input"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <FieldError field="name" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="contact-email">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        className="input"
                        placeholder="ban@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <FieldError field="email" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="contact-subject">Tiêu đề</label>
                      <input
                        id="contact-subject"
                        type="text"
                        className="input"
                        placeholder="Bạn cần hỗ trợ về vấn đề gì?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={200}
                      />
                      <FieldError field="subject" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="contact-message">Nội dung</label>
                      <textarea
                        id="contact-message"
                        className="textarea"
                        rows={5}
                        placeholder="Hãy cho chúng tôi biết chúng tôi có thể giúp gì…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <FieldError field="message" />
                    </div>

                    <button
                      id="contact-submit"
                      type="submit"
                      className="btn-primary w-full"
                      style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </svg>
                          Đang gửi…
                        </span>
                      ) : 'Gửi tin nhắn'}
                    </button>

                    <p className="caption text-center" style={{ color: 'var(--ash)' }}>
                      Chúng tôi thường phản hồi trong vòng 24 giờ làm việc.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
