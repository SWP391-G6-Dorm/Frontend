import { useState } from 'react';
import PublicLayout from '../../layouts/PublicLayout';

// SCR-10 — About / Contact
// Entity created: Complaint
// Fields: User.name · User.email · Complaint.subject · Complaint.description

export default function AboutPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!subject.trim()) e.subject = 'Subject is required.';
    if (!message.trim()) e.message = 'Message is required.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    // Simulate API → Complaint.status = OPEN
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  function FieldError({ field }: { field: string }) {
    return errors[field] ? <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors[field]}</p> : null;
  }

  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section style={{ background: 'var(--primary)', padding: '80px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,61,0.45) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container-wide" style={{ textAlign: 'center' }}>
          <p className="label-sm mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>ABOUT US</p>
          <h1 className="display-xl mb-4" style={{ color: 'var(--on-dark)', lineHeight: 1, margin: '0 auto 16px', maxWidth: 700 }}>
            We connect guests<br />with great stays
          </h1>
          <p className="body-lg" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 540, margin: '0 auto' }}>
            Homestay&amp;Resort is Vietnam's trusted platform for discovering and booking
            premium homestay and resort rooms — simple, transparent, and secure.
          </p>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="label-sm mb-3" style={{ color: 'var(--ash)' }}>OUR STORY</p>
              <h2 className="display-md mb-5" style={{ color: 'var(--ink)' }}>
                Born from a traveler's frustration
              </h2>
              <p className="body-lg mb-4" style={{ color: 'var(--body)' }}>
                Founded in 2023, Homestay&amp;Resort was built after our founders struggled to find
                reliable, transparent homestay bookings in Vietnam — scattered listings, no digital
                contracts, and unclear pricing.
              </p>
              <p className="body-lg mb-6" style={{ color: 'var(--body)' }}>
                Today we serve thousands of guests and verified property owners across Đà Nẵng,
                Đà Lạt, Hội An, Phú Quốc and Nha Trang — from room discovery to payment and
                contract generation, all in one place.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { val: '2023',    label: 'Founded' },
                  { val: '5 cities', label: 'Coverage' },
                  { val: '98%',     label: 'Satisfaction' },
                ].map((s) => (
                  <div key={s.label} className="card p-4 text-center">
                    <div className="heading-md" style={{ color: 'var(--primary)' }}>{s.val}</div>
                    <div className="caption mt-1" style={{ color: 'var(--charcoal)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=700&q=80"
                alt="About Homestay&Resort"
                className="w-full object-cover"
                style={{ borderRadius: 16, height: 440 }}
              />
              <div
                className="absolute -bottom-4 -left-4 card p-5"
                style={{ background: 'var(--surface-card)', maxWidth: 200, boxShadow: '0 8px 32px rgba(32,32,32,0.12)' }}
              >
                <div className="heading-md mb-1" style={{ color: 'var(--primary)' }}>5,000+</div>
                <div className="body-sm" style={{ color: 'var(--charcoal)' }}>Happy guests across Vietnam 🇻🇳</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="section-pad-sm" style={{ background: 'var(--surface-bone)' }}>
        <div className="container-wide">
          <div className="text-center mb-10">
            <p className="label-sm mb-2" style={{ color: 'var(--ash)' }}>WHAT WE STAND FOR</p>
            <h2 className="heading-lg" style={{ color: 'var(--ink)' }}>Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🛡️', title: 'Trust',        desc: 'Every property is verified. Every listing is accurate.' },
              { icon: '💡', title: 'Transparency', desc: 'No hidden fees. All pricing is clear from day one.' },
              { icon: '⚡', title: 'Efficiency',   desc: 'From search to check-in in as little as 24 hours.' },
              { icon: '🤝', title: 'Fairness',     desc: 'Disputes and complaints are handled professionally.' },
            ].map((v) => (
              <div key={v.title} className="card p-6">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>{v.title}</h3>
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="section-pad" style={{ background: 'var(--canvas)' }}>
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left: Contact info */}
            <div>
              <p className="label-sm mb-3" style={{ color: 'var(--ash)' }}>GET IN TOUCH</p>
              <h2 className="display-md mb-4" style={{ color: 'var(--ink)' }}>We'd love to hear from you</h2>
              <p className="body-lg mb-8" style={{ color: 'var(--body)' }}>
                Have a question, complaint, or partnership idea? Our team typically responds within 24 hours on business days.
              </p>

              <div className="flex flex-col gap-5">
                {[
                  { icon: '📍', label: 'Address', val: '125 Nguyễn Huệ, Quận 1, Hồ Chí Minh' },
                  { icon: '📧', label: 'Email',   val: 'support@homestay-resort.vn' },
                  { icon: '📞', label: 'Phone',   val: '+84 28 1234 5678' },
                  { icon: '🕐', label: 'Hours',   val: 'T2–T6: 8:00 – 17:30 ICT' },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full text-xl"
                      style={{ width: 44, height: 44, background: '#fde8e3' }}
                    >
                      {c.icon}
                    </div>
                    <div>
                      <p className="label-sm" style={{ color: 'var(--ink)' }}>{c.label}</p>
                      <p className="body-md" style={{ color: 'var(--charcoal)' }}>{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Contact form → Complaint entity */}
            <div>
              {submitted ? (
                <div
                  className="card-lg p-8 text-center flex flex-col items-center justify-center animate-fade-in"
                  style={{ minHeight: 420 }}
                >
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Message sent!</h3>
                  <p className="body-md mb-6" style={{ color: 'var(--charcoal)' }}>
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                    className="btn-outline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <div className="card-lg p-8">
                  <h3 className="heading-md mb-6" style={{ color: 'var(--ink)' }}>Send us a message</h3>

                  <div className="alert alert-info mb-6">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    We typically respond within 24 hours on business days.
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="form-label" htmlFor="contact-name">Full Name</label>
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
                      <label className="form-label" htmlFor="contact-email">Email Address</label>
                      <input
                        id="contact-email"
                        type="email"
                        className="input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <FieldError field="email" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="contact-subject">Subject</label>
                      <input
                        id="contact-subject"
                        type="text"
                        className="input"
                        placeholder="What is your inquiry about?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={200}
                      />
                      <FieldError field="subject" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="contact-message">Message</label>
                      <textarea
                        id="contact-message"
                        className="textarea"
                        rows={5}
                        placeholder="Tell us how we can help you…"
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
                          Sending…
                        </span>
                      ) : '📬 Send Message'}
                    </button>
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
