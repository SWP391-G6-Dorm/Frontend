// ─── PaymentPages.tsx — SCR-21, 22, 23, 24 ───────────────────────────────────
// Exports: DepositPaymentPage, RemainingPaymentPage, PaymentHistoryPage, ReceiptUploadPage

import { useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const BOOKING_MOCK = { id: 'B001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', totalAmount: 7500000, status: 'PENDING_DEPOSIT' };
const DEPOSIT_AMOUNT   = Math.round(BOOKING_MOCK.totalAmount * 0.4);
const REMAINING_AMOUNT = BOOKING_MOCK.totalAmount - DEPOSIT_AMOUNT;

const PAYMENT_HISTORY = [
  { id: 'P001', bookingId: 'B001', type: 'DEPOSIT', amount: 3000000, method: 'BANK_TRANSFER', status: 'PAID', paidAt: '2026-06-14T10:00:00', createdAt: '2026-06-10T09:00:00' },
  { id: 'P002', bookingId: 'B001', type: 'REMAINING_BALANCE', amount: 4500000, method: 'BANK_TRANSFER', status: 'PENDING', paidAt: null, createdAt: '2026-06-14T10:30:00' },
  { id: 'P003', bookingId: 'B003', type: 'DEPOSIT', amount: 2160000, method: 'CASH', status: 'PAID', paidAt: '2026-03-22T11:00:00', createdAt: '2026-03-20T08:00:00' },
];

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
    setFilename(file.name);
    onChange(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else { setPreview(null); }
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] || null); }}
      style={{
        border: '2px dashed var(--hairline)', borderRadius: 10, padding: 28, textAlign: 'center',
        cursor: 'pointer', background: 'var(--surface-bone)', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
    >
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0] || null)} />
      {preview ? (
        <img src={preview} alt="Receipt preview" style={{ maxHeight: 140, borderRadius: 8, marginBottom: 8, maxWidth: '100%' }} />
      ) : (
        <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
      )}
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{filename || 'Click or drag to upload receipt'}</p>
      <p className="body-sm text-charcoal">JPG, PNG, PDF up to 10MB</p>
    </div>
  );
}

function PaymentForm({ type, amount, bookingId, onSuccess }: { type: 'DEPOSIT' | 'REMAINING_BALANCE'; amount: number; bookingId: string; onSuccess: () => void }) {
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receipt) { setError('Please upload your payment receipt'); return; }
    setError(null);
    setLoading(true);
    try {
      // TODO: await paymentApi.create({ bookingId, type, method, amount, receipt });
      await new Promise(r => setTimeout(r, 1000));
      onSuccess();
    } catch {
      setError('Payment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Payment method selection */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Payment Method</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYMENT_METHODS.map(m => (
            <label key={m.value} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              border: `1.5px solid ${method === m.value ? 'var(--primary)' : 'var(--hairline)'}`,
              borderRadius: 10, cursor: 'pointer', background: method === m.value ? '#fff1ee' : 'var(--surface-card)',
              transition: 'all 0.15s',
            }}>
              <input type="radio" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} style={{ accentColor: 'var(--primary)' }} />
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</p>
                <p className="body-sm text-charcoal">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Bank info if bank transfer */}
      {method === 'BANK_TRANSFER' && (
        <div style={{ background: 'var(--surface-bone)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <p className="form-label" style={{ marginBottom: 12 }}>Transfer to this account</p>
          {[
            { l: 'Bank', v: BANK_INFO.bankName },
            { l: 'Account Name', v: BANK_INFO.accountName },
            { l: 'Account Number', v: BANK_INFO.accountNumber },
            { l: 'Amount', v: `₫${amount.toLocaleString()}` },
            { l: 'Transfer note', v: `BOOKING ${bookingId} ${type}` },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">{r.l}</span>
              <span style={{ fontWeight: 600, fontSize: 13, fontFamily: r.l === 'Account Number' ? 'JetBrains Mono, monospace' : 'inherit' }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Receipt upload */}
      <div style={{ marginBottom: 24 }}>
        <label className="form-label form-label-required">Upload Payment Receipt</label>
        <FileUploadBox onChange={setReceipt} />
        <p className="form-hint">Upload a screenshot or photo of your payment confirmation</p>
      </div>

      <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Submitting...' : `Submit ${type === 'DEPOSIT' ? 'Deposit' : 'Balance'} Payment`}
      </button>
    </form>
  );
}

// ── SCR-21: Deposit Payment ───────────────────────────────────────────────────
export function DepositPaymentPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <CustomerLayout>
        <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
          </div>
          <h2 className="heading-md" style={{ marginBottom: 8 }}>Deposit Submitted!</h2>
          <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Your payment receipt has been submitted. The manager will verify and confirm your booking shortly.</p>
          <Link to="/customer/bookings" className="btn-primary">View My Bookings</Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
          <span>›</span>
          <Link to={`/customer/bookings/${BOOKING_MOCK.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{BOOKING_MOCK.id}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Pay Deposit</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 4 }}>Deposit Payment</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Pay 40% deposit to confirm your booking</p>

        {/* Booking summary */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{BOOKING_MOCK.roomNumber} — {BOOKING_MOCK.roomType}</p>
              <p className="body-sm text-charcoal">{BOOKING_MOCK.propertyName}</p>
              <p className="body-sm text-charcoal">📅 {BOOKING_MOCK.checkInDate} → {BOOKING_MOCK.checkOutDate}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="body-sm text-charcoal">Total booking</p>
              <p style={{ fontWeight: 700, fontSize: 15 }}>₫{BOOKING_MOCK.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="heading-sm">Deposit Required (40%)</span>
            <span className="heading-sm text-primary">₫{DEPOSIT_AMOUNT.toLocaleString()}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <PaymentForm type="DEPOSIT" amount={DEPOSIT_AMOUNT} bookingId={BOOKING_MOCK.id} onSuccess={() => setDone(true)} />
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-22: Remaining Balance Payment ────────────────────────────────────────
export function RemainingPaymentPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  if (done) {
    return (
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
  }

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
          <PaymentForm type="REMAINING_BALANCE" amount={REMAINING_AMOUNT} bookingId={BOOKING_MOCK.id} onSuccess={() => setDone(true)} />
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-23: Payment History ───────────────────────────────────────────────────
export function PaymentHistoryPage() {
  const StatusBadge = ({ s }: { s: string }) => {
    const m: Record<string, { cls: string; l: string }> = {
      PAID:    { cls: 'badge-success', l: 'Paid' },
      PENDING: { cls: 'badge-warning', l: 'Pending' },
      FAILED:  { cls: 'badge-error',   l: 'Failed' },
    };
    const v = m[s] || { cls: 'badge-neutral', l: s };
    return <span className={`badge ${v.cls}`}>{v.l}</span>;
  };

  const TypeBadge = ({ t }: { t: string }) => (
    <span className="badge badge-tag">
      {t === 'DEPOSIT' ? 'Deposit (40%)' : 'Remaining (60%)'}
    </span>
  );

  return (
    <CustomerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Payment History</h1>

      {PAYMENT_HISTORY.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No payments yet</h3>
          <p className="body-md text-charcoal">Your payment history will appear here once you make a payment.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENT_HISTORY.map(p => (
                <tr key={p.id}>
                  <td><span className="code-md">{p.id}</span></td>
                  <td><Link to={`/customer/bookings/${p.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>{p.bookingId}</Link></td>
                  <td><TypeBadge t={p.type} /></td>
                  <td className="text-charcoal">{p.method.replace('_', ' ')}</td>
                  <td style={{ fontWeight: 700 }}>₫{p.amount.toLocaleString()}</td>
                  <td><StatusBadge s={p.status} /></td>
                  <td className="text-charcoal">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CustomerLayout>
  );
}

// ── SCR-24: Receipt Upload ────────────────────────────────────────────────────
export function ReceiptUploadPage() {
  const navigate = useNavigate();
  const [paymentId] = useState('P002');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      // TODO: await paymentApi.uploadReceipt(paymentId, file);
      await new Promise(r => setTimeout(r, 800));
      setDone(true);
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 className="heading-md" style={{ marginBottom: 8 }}>Upload Receipt</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Payment ID: <span className="code-md">{paymentId}</span></p>

        {done ? (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
            Receipt uploaded successfully! Awaiting manager verification.
          </div>
        ) : (
          <form onSubmit={handleUpload} className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label form-label-required">Payment Receipt</label>
              <FileUploadBox onChange={setFile} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={!file || loading}>
              {loading ? 'Uploading...' : 'Upload Receipt'}
            </button>
          </form>
        )}
        <Link to="/customer/payments" className="btn-ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex' }}>
          ← Back to Payments
        </Link>
      </div>
    </CustomerLayout>
  );
}
