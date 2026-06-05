import { Link } from 'react-router-dom';

// SCR: Landlord Pending Verification
// Shown after LANDLORD verifies OTP — account is ACTIVE but landlordVerified=false

export default function LandlordPendingPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--canvas)', padding: '48px 24px' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 no-underline" style={{ textDecoration: 'none' }}>
        <span
          className="flex items-center justify-center rounded-full text-white font-bold"
          style={{ width: 36, height: 36, background: 'var(--primary)', fontSize: 16 }}
        >🏠</span>
        <span className="font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>BoardingHub</span>
      </Link>

      <div
        className="w-full animate-fade-up text-center"
        style={{
          maxWidth: 480,
          background: 'var(--surface-card)',
          borderRadius: 16,
          border: '1px solid var(--hairline)',
          padding: '48px 40px',
          boxShadow: '0 8px 32px rgba(32,32,32,0.08)',
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{ width: 80, height: 80, background: '#fef9c3', fontSize: 36 }}
        >
          ⏳
        </div>

        <h1 className="display-md mb-3" style={{ color: 'var(--ink)' }}>
          Account Under Review
        </h1>

        <p className="body-md mb-6" style={{ color: 'var(--charcoal)', lineHeight: 1.7 }}>
          Your email has been verified! Our team is reviewing your landlord registration details.
          You'll be notified once your account is fully approved.
        </p>

        {/* Status steps */}
        <div
          className="flex flex-col gap-3 text-left mb-8"
          style={{
            padding: '16px',
            borderRadius: 12,
            background: 'var(--surface-bone)',
            border: '1px solid var(--hairline)',
          }}
        >
          {[
            { done: true,  label: 'Email verified' },
            { done: true,  label: 'Registration submitted' },
            { done: false, label: 'Admin review (in progress)' },
            { done: false, label: 'Full access granted' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  width: 24,
                  height: 24,
                  background: step.done ? '#dcfce7' : 'var(--hairline)',
                  color: step.done ? '#16a34a' : 'var(--ash)',
                }}
              >
                {step.done ? '✓' : i + 1}
              </span>
              <span
                className="body-sm"
                style={{ color: step.done ? 'var(--ink)' : 'var(--ash)' }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="caption mb-6" style={{ color: 'var(--ash)' }}>
          Typical review time: <strong style={{ color: 'var(--charcoal)' }}>1–2 business days</strong>
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="btn-primary w-full"
            style={{ height: 48, fontSize: 15, justifyContent: 'center', textDecoration: 'none' }}
          >
            Sign in to my account
          </Link>
          <Link
            to="/"
            className="btn-outline w-full"
            style={{ height: 44, fontSize: 14, justifyContent: 'center', textDecoration: 'none' }}
          >
            Back to home
          </Link>
        </div>
      </div>

      <p className="body-sm text-center mt-6" style={{ color: 'var(--charcoal)' }}>
        Questions?{' '}
        <a href="mailto:support@boardinghub.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          Contact support
        </a>
      </p>
    </div>
  );
}
