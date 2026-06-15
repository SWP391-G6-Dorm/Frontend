import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const BOOKING_MOCK = { id: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', totalAmount: 7500000 };
const DEPOSIT_AMOUNT    = Math.round(BOOKING_MOCK.totalAmount * 0.4);
const REMAINING_AMOUNT  = BOOKING_MOCK.totalAmount - DEPOSIT_AMOUNT;

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦', desc: 'Transfer to our bank account' },
  { value: 'CASH',          label: 'Cash',          icon: '💵', desc: 'Pay in person at check-in' },
  { value: 'E_WALLET',      label: 'E-Wallet',      icon: '📱', desc: 'MoMo, ZaloPay, VNPay' },
];
const BANK_INFO = { accountNumber: '1234567890', accountName: 'CONG TY HOMESTAY RESORT', bankName: 'Vietcombank (VCB)' };

function FileUploadBox({ onChange }: { onChange: (file: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  function handleFile(file: File | null) {
    if (!file) return;
    setFilename(file.name); onChange(file);
    if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file)); else setPreview(null);
  }
  return (
    <div onClick={() => ref.current?.click()} onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] || null); }}
      style={{ border: '2px dashed var(--hairline)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'var(--surface-bone)', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}>
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0] || null)} />
      {preview ? <img src={preview} alt="Receipt" style={{ maxHeight: 140, borderRadius: 8, marginBottom: 8, maxWidth: '100%' }} /> : <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>}
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{filename || 'Click or drag to upload receipt'}</p>
      <p className="body-sm text-charcoal">JPG, PNG, PDF up to 10MB</p>
    </div>
  );
}

export default function RemainingPaymentPage() {
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receipt) { setError('Please upload your payment receipt'); return; }
    setError(null); setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setDone(true);
    } catch { setError('Payment submission failed. Please try again.'); }
    finally { setLoading(false); }
  }

  if (done) return (
    <CustomerLayout>
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
        </div>
        <h2 className="heading-md" style={{ marginBottom: 8 }}>Balance Submitted!</h2>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Your remaining balance receipt has been submitted and is pending verification.</p>
        <Link to="/customer/bookings" className="btn-primary">View My Bookings</Link>
      </div>
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Pay Remaining Balance</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 4 }}>Remaining Balance</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Pay the remaining 60% balance before or at check-in</p>

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{BOOKING_MOCK.roomNumber}</p>
              <p className="body-sm text-charcoal">{BOOKING_MOCK.propertyName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="body-sm text-charcoal">Deposit paid</p>
              <p style={{ fontWeight: 600 }}>₫{DEPOSIT_AMOUNT.toLocaleString()}</p>
            </div>
          </div>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="heading-sm">Remaining (60%)</span>
            <span className="heading-sm text-primary">₫{REMAINING_AMOUNT.toLocaleString()}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: `1.5px solid ${method === m.value ? 'var(--primary)' : 'var(--hairline)'}`, borderRadius: 10, cursor: 'pointer', background: method === m.value ? '#fff1ee' : 'var(--surface-card)', transition: 'all 0.15s' }}>
                    <input type="radio" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} style={{ accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div><p style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</p><p className="body-sm text-charcoal">{m.desc}</p></div>
                  </label>
                ))}
              </div>
            </div>
            {method === 'BANK_TRANSFER' && (
              <div style={{ background: 'var(--surface-bone)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <p className="form-label" style={{ marginBottom: 12 }}>Transfer to this account</p>
                {[
                  { l: 'Bank', v: BANK_INFO.bankName },
                  { l: 'Account Name', v: BANK_INFO.accountName },
                  { l: 'Account Number', v: BANK_INFO.accountNumber },
                  { l: 'Amount', v: `₫${REMAINING_AMOUNT.toLocaleString()}` },
                  { l: 'Transfer note', v: `BOOKING ${BOOKING_MOCK.id} BALANCE` },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">{r.l}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label form-label-required">Upload Payment Receipt</label>
              <FileUploadBox onChange={setReceipt} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Balance Payment'}
            </button>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
}
