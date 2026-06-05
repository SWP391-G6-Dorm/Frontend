import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

/**
 * SCR: Landlord Google OAuth — Submit Verification Info
 * Shown after a LANDLORD registers via Google and needs to provide CCCD/identity info.
 * Requires JWT token already saved in store (user is authenticated).
 */
export default function LandlordVerifyInfoPage() {
  const navigate = useNavigate();

  const [identityNumber, setIdentityNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate() {
    const e: Record<string, string> = {};
    if (!identityNumber.trim())
      e.identityNumber = 'CCCD / Identity number is required.';
    else if (!/^\d{9,12}$/.test(identityNumber.replace(/\s/g, '')))
      e.identityNumber = 'Identity number must be 9–12 digits.';
    return e;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await authApi.submitLandlordVerifyInfo({
        identityNumber: identityNumber.trim(),
        taxCode: taxCode.trim() || undefined,
        businessLicense: businessLicense.trim() || undefined,
      });
      navigate('/landlord-pending');
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--canvas)', padding: '48px 24px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <span className="flex items-center justify-center rounded-full text-white font-bold"
          style={{ width: 36, height: 36, background: 'var(--primary)', fontSize: 16 }}>🏠</span>
        <span className="font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>BoardingHub</span>
      </div>

      <div
        className="w-full animate-fade-up"
        style={{
          maxWidth: 520,
          background: 'var(--surface-card)',
          borderRadius: 16,
          border: '1px solid var(--hairline)',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(32,32,32,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, background: '#eff6ff', fontSize: 22 }}>🏢</span>
          <div>
            <h1 className="display-md" style={{ color: 'var(--ink)', marginBottom: 2 }}>
              Landlord Verification
            </h1>
            <p className="caption" style={{ color: 'var(--ash)' }}>Step 2 of 2 — Identity Info</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6 mt-4">
          {[1, 2].map(i => (
            <div key={i} className="flex-1 rounded-full"
              style={{ height: 4, background: i <= 2 ? 'var(--primary)' : 'var(--hairline)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Info banner */}
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: '#eff6ff', border: '1px solid #bfdbfe',
          display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <p className="body-sm" style={{ color: '#1d4ed8', lineHeight: 1.6 }}>
            Your details will be reviewed by our admin team within{' '}
            <strong>1–2 business days</strong>. You can sign in after email verification
            while awaiting approval.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="alert alert-error mb-5 animate-fade-in" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* CCCD — required */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }} htmlFor="verify-identity">
              CCCD / Identity Number
              <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ fontSize: 16 }}>🪪</span>
              <input
                id="verify-identity"
                type="text"
                className="input-field"
                style={{ paddingLeft: 42 }}
                placeholder="012345678901"
                value={identityNumber}
                onChange={e => setIdentityNumber(e.target.value)}
                maxLength={50}
                autoFocus
              />
            </div>
            {errors.identityNumber && (
              <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.identityNumber}</p>
            )}
          </div>

          {/* Tax Code — optional */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }} htmlFor="verify-taxcode">
              Tax Code
              <span className="caption ml-2" style={{ color: 'var(--ash)' }}>(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ fontSize: 16 }}>🏛️</span>
              <input
                id="verify-taxcode"
                type="text"
                className="input-field"
                style={{ paddingLeft: 42 }}
                placeholder="0123456789"
                value={taxCode}
                onChange={e => setTaxCode(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>

          {/* Business License — optional */}
          <div>
            <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }} htmlFor="verify-license">
              Business License
              <span className="caption ml-2" style={{ color: 'var(--ash)' }}>(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ fontSize: 16 }}>📋</span>
              <input
                id="verify-license"
                type="text"
                className="input-field"
                style={{ paddingLeft: 42 }}
                placeholder="License number or reference"
                value={businessLicense}
                onChange={e => setBusinessLicense(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="verify-submit"
            type="submit"
            className="btn-primary w-full mt-2"
            style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Submitting…
              </span>
            ) : 'Submit Verification Info'}
          </button>
        </form>

        {/* Note */}
        <p className="caption text-center mt-5" style={{ color: 'var(--ash)', lineHeight: 1.6 }}>
          You can update this information later from your profile settings.
        </p>
      </div>
    </div>
  );
}
