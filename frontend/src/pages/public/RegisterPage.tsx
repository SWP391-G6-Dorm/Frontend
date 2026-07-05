import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#dc2626', '#f59e0b', '#2563eb', '#2b9a66'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 9999, background: i <= score ? colors[score] : 'var(--hairline)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim())   e.fullName = 'Full name is required';
    
    if (!form.email)             e.email    = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format';
    
    if (!form.phone)             e.phone    = 'Phone number is required';
    else if (!/^(\+84|0)[0-9]{9,10}$/.test(form.phone)) e.phone = 'Invalid phone number (e.g. 0912345678 or +84912345678)';
    
    if (!form.password)          e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain at least 1 uppercase letter';
    
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.terms)             e.terms = 'You must accept the terms';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone
      });
      
      if (!res.success) {
        setErrors({ _: res.message || 'Registration failed. Please try again.' });
        return;
      }
      
      navigate('/verify-email?email=' + encodeURIComponent(form.email));
    } catch (err: unknown) {
      console.error("Register API Error:", err);
      const axiosError = err as { response?: { data?: { message?: string, data?: Record<string, string> } } };
      const responseData = axiosError?.response?.data;
      
      if (responseData?.data && Object.keys(responseData.data).length > 0) {
        // Lỗi validation từ field (Backend MethodArgumentNotValidException)
        setErrors(responseData.data);
      } else {
        // Lỗi logic chung (BusinessException hoặc lỗi khác)
        const msg = responseData?.message || 'Registration failed. Please try again.';
        setErrors({ _: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 }}>
        <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" fillOpacity="0.95"/>
            <polyline points="9,22 9,12 15,12 15,22" fill="white" fillOpacity="0.6"/>
          </svg>
        </div>
        <span className="font-display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
          Homestay<span style={{ color: 'var(--primary)' }}>&</span>Resort
        </span>
      </Link>

      <div className="card-lg animate-fade-up" style={{ width: '100%', maxWidth: 520, padding: 40 }}>
        <h1 className="display-md" style={{ marginBottom: 6, textAlign: 'center' }}>Create your account</h1>
        <p className="body-md text-charcoal" style={{ textAlign: 'center', marginBottom: 28 }}>Join thousands of satisfied guests</p>

        {errors._ && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors._}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="reg-name">Full Name</label>
            <input id="reg-name" className={`input ${errors.fullName ? 'input-error' : ''}`} placeholder="Nguyễn Văn An" value={form.fullName} onChange={e => f('fullName', e.target.value)} />
            {errors.fullName && <p className="form-error">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" value={form.email} onChange={e => f('email', e.target.value)} autoComplete="email" />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="reg-phone">Phone Number</label>
            <input id="reg-phone" type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="0901 234 567" value={form.phone} onChange={e => f('phone', e.target.value)} />
            {errors.phone && <p className="form-error">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="reg-pw">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="reg-pw" type={showPw ? 'text' : 'password'} className={`input ${errors.password ? 'input-error' : ''}`} placeholder="At least 8 characters" value={form.password} onChange={e => f('password', e.target.value)} style={{ paddingRight: 50 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)' }}>
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <PasswordStrength password={form.password} />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label form-label-required" htmlFor="reg-confirm">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} className={`input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repeat your password" value={form.confirmPassword} onChange={e => f('confirmPassword', e.target.value)} style={{ paddingRight: 50 }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)' }}>
                {showConfirm
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>

          {/* Terms */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
              <span className="body-sm text-charcoal">
                I agree to the{' '}
                <a href="#" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
              </span>
            </label>
            {errors.terms && <p className="form-error" style={{ marginTop: 4 }}>{errors.terms}</p>}
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !form.terms}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="body-sm text-charcoal" style={{ textAlign: 'center', marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
