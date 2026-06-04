import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-25 Bill List · SCR-26 Bill Detail · SCR-27 Payment Screen · SCR-28 Payment History · SCR-29 Receipt Upload
// Entities: Bill · Payment · PaymentReceipt

const MOCK_BILLS = [
  { id: 'B-001', billingPeriod: 'October 2025', roomRent: 3500000, electricityFee: 420000, waterFee: 80000, serviceFee: 200000, totalAmount: 4200000, issueDate: '2025-10-28', dueDate: '2025-11-10', status: 'PENDING', lineItems: [] },
  { id: 'B-002', billingPeriod: 'September 2025', roomRent: 3500000, electricityFee: 280000, waterFee: 100000, serviceFee: 200000, totalAmount: 4080000, issueDate: '2025-09-28', dueDate: '2025-10-10', status: 'PAID', lineItems: [] },
  { id: 'B-003', billingPeriod: 'August 2025', roomRent: 3500000, electricityFee: 350000, waterFee: 90000, serviceFee: 200000, totalAmount: 4140000, issueDate: '2025-08-28', dueDate: '2025-09-10', status: 'PAID', lineItems: [] },
  { id: 'B-004', billingPeriod: 'July 2025', roomRent: 3500000, electricityFee: 490000, waterFee: 110000, serviceFee: 200000, totalAmount: 4300000, issueDate: '2025-07-28', dueDate: '2025-08-10', status: 'OVERDUE', lineItems: [] },
];

const MOCK_PAYMENTS = [
  { id: 'PMT-001', billId: 'B-002', amount: 4080000, method: 'VNPAY',         status: 'SUCCESS',  transactionRef: 'TXN-8821', paidAt: '2025-10-08T10:30:00Z' },
  { id: 'PMT-002', billId: 'B-003', amount: 4140000, method: 'BANK_TRANSFER', status: 'SUCCESS',  transactionRef: 'TXN-7612', paidAt: '2025-09-09T14:15:00Z' },
  { id: 'PMT-003', billId: 'B-004', amount: 4300000, method: 'VNPAY',         status: 'FAILED',   transactionRef: 'TXN-6901', paidAt: '2025-08-10T09:00:00Z' },
];

const PAYMENT_METHODS = [
  { id: 'VNPAY',         label: 'VNPay', icon: '💳', desc: 'QR Code / Card payment via VNPay gateway' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer to landlord account' },
  { id: 'CASH',          label: 'Cash', icon: '💵', desc: 'Pay in person at the management office' },
  { id: 'E_WALLET',      label: 'E-Wallet', icon: '📱', desc: 'MoMo / ZaloPay / ShopeePay' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { PAID: 'badge-success', PENDING: 'badge-warning', OVERDUE: 'badge-error', DISPUTED: 'badge-info', WAIVED: 'badge-neutral', SUCCESS: 'badge-success', FAILED: 'badge-error', REFUNDED: 'badge-info' };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}
function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(iso: string) { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }

// ─── SCR-25: Bill List ────────────────────────────────────────────────────────
export function BillListPage() {
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? MOCK_BILLS : MOCK_BILLS.filter(b => b.status === filter);

  return (
    <TenantLayout>
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Bills & Payments</h1>
          <Link to="/tenant/bills/history" className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}>
            Payment History →
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="btn-ghost rounded-full text-sm font-semibold px-4"
              style={{ height: 36, background: filter === f ? 'var(--surface-dark)' : 'transparent', color: filter === f ? 'var(--on-dark)' : 'var(--charcoal)' }}>
              {f}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="grid gap-3 px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1fr 1.5fr 1.2fr 1.2fr 1fr 80px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Bill No.', 'Billing Period', 'Total Amount', 'Due Date', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((bill, i) => (
            <div key={bill.id} className="grid gap-3 px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1fr 1.5fr 1.2fr 1.2fr 1fr 80px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{bill.id}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{bill.billingPeriod}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(bill.totalAmount)}</p>
              <div>
                <p className="body-sm" style={{ color: bill.status === 'OVERDUE' ? 'var(--error)' : 'var(--ink)' }}>{formatDate(bill.dueDate)}</p>
                {bill.status === 'OVERDUE' && <p className="caption" style={{ color: 'var(--error)' }}>⚠ Overdue</p>}
              </div>
              <StatusBadge status={bill.status} />
              <Link to={`/tenant/bills/${bill.id}`} className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>View</Link>
            </div>
          ))}
        </div>
      </div>
    </TenantLayout>
  );
}

// ─── SCR-26: Bill Detail ──────────────────────────────────────────────────────
export function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bill = MOCK_BILLS.find(b => b.id === id) ?? MOCK_BILLS[0];

  const lineItems = [
    { label: 'Room Rent',       amount: bill.roomRent,       desc: 'Base monthly rent' },
    { label: '⚡ Electricity',  amount: bill.electricityFee, desc: '120 kWh × ₫3,500' },
    { label: '💧 Water',        amount: bill.waterFee,       desc: '8 m³ × ₫10,000' },
    { label: '🔧 Service Fee',  amount: bill.serviceFee,     desc: 'Cleaning & maintenance' },
  ];

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 720 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/tenant/bills" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Bills</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{bill.id}</span>
        </nav>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Bill {bill.id}</h1>
            <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>Issued: {formatDate(bill.issueDate)} · Due: {formatDate(bill.dueDate)}</p>
          </div>
          <StatusBadge status={bill.status} />
        </div>

        {bill.status === 'OVERDUE' && (
          <div className="alert alert-error mb-5">
            ⚠ This bill is overdue. Please make payment immediately to avoid additional charges.
          </div>
        )}

        {/* Bill breakdown */}
        <div className="card overflow-hidden mb-5">
          <div className="px-5 py-3 border-b" style={{ background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Bill Breakdown — {bill.billingPeriod}</h3>
          </div>
          {lineItems.map((item, i) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.label}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{item.desc}</p>
              </div>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(item.amount)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: 'var(--surface-bone)' }}>
            <p className="heading-sm" style={{ color: 'var(--ink)' }}>Total Amount</p>
            <p className="heading-sm" style={{ color: 'var(--primary)', fontSize: 22 }}>{formatPrice(bill.totalAmount)}</p>
          </div>
        </div>

        {/* Payment action */}
        {(bill.status === 'PENDING' || bill.status === 'OVERDUE') && (
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Make Payment</h3>
            <div className="flex gap-3">
              <Link to={`/tenant/bills/${bill.id}/pay`} className="btn-primary" style={{ height: 48, padding: '0 32px', fontSize: 15, textDecoration: 'none' }}>
                💳 Pay Now — {formatPrice(bill.totalAmount)}
              </Link>
              <Link to={`/tenant/bills/${bill.id}/receipt`} className="btn-outline" style={{ height: 48, padding: '0 20px' }}>
                📷 Upload Receipt
              </Link>
            </div>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}

// ─── SCR-27: Payment Screen ────────────────────────────────────────────────────
export function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const bill = MOCK_BILLS.find(b => b.id === id) ?? MOCK_BILLS[0];
  const [method, setMethod] = useState('VNPAY');
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  function handlePay(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setPaid(true); }, 1500);
  }

  if (paid) {
    return (
      <TenantLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Payment Successful!</h2>
          <p className="body-md mb-4" style={{ color: 'var(--charcoal)' }}>Your payment of <strong>{formatPrice(bill.totalAmount)}</strong> for {bill.billingPeriod} has been processed.</p>
          <div className="alert alert-success mb-5 w-full">Payment status: SUCCESS · Transaction ID: TXN-{Math.random().toString(36).slice(2,8).toUpperCase()}</div>
          <Link to="/tenant/bills" className="btn-primary">Back to Bills</Link>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 560 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/tenant/bills/${bill.id}`} className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Make Payment</h1>
        </div>

        {/* Bill summary */}
        <div className="card mb-5" style={{ padding: 20 }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="caption" style={{ color: 'var(--ash)' }}>Paying for</p>
              <p className="body-md font-semibold" style={{ color: 'var(--ink)' }}>{bill.billingPeriod}</p>
              <p className="caption" style={{ color: 'var(--ash)' }}>Due: {formatDate(bill.dueDate)}</p>
            </div>
            <div className="text-right">
              <p className="heading-md" style={{ color: 'var(--primary)' }}>{formatPrice(bill.totalAmount)}</p>
              <StatusBadge status={bill.status} />
            </div>
          </div>
        </div>

        <form onSubmit={handlePay}>
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Select Payment Method</h3>
            {/* Payment.method enum */}
            <div className="flex flex-col gap-3 mb-6">
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.id}
                  className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all"
                  style={{
                    border: method === pm.id ? '2px solid var(--primary)' : '1px solid var(--hairline)',
                    background: method === pm.id ? '#fdf6f0' : 'var(--surface-card)',
                  }}
                >
                  <input type="radio" name="method" value={pm.id} checked={method === pm.id} onChange={() => setMethod(pm.id)} style={{ accentColor: 'var(--primary)' }} />
                  <span className="text-xl">{pm.icon}</span>
                  <div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{pm.label}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{pm.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* VNPay QR demo */}
            {method === 'VNPAY' && (
              <div className="rounded-lg p-6 text-center mb-5" style={{ background: 'var(--surface-bone)' }}>
                <div className="w-36 h-36 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline)' }}>
                  <span className="text-5xl">🔳</span>
                </div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>Scan QR Code to Pay</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>Opens VNPay app automatically</p>
              </div>
            )}

            <button
              id="pay-submit"
              type="submit"
              className="btn-primary w-full"
              style={{ height: 52, fontSize: 16, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Processing…
                </span>
              ) : `💳 Pay ${formatPrice(bill.totalAmount)}`}
            </button>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}

// ─── SCR-28: Payment History ───────────────────────────────────────────────────
export function PaymentHistoryPage() {
  return (
    <TenantLayout>
      <div className="animate-fade-up">
        <div className="flex items-center gap-4 mb-5">
          <Link to="/tenant/bills" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Payment History</h1>
        </div>
        <div className="card overflow-hidden">
          <div className="grid gap-3 px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1.2fr 1fr', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Transaction ID', 'Bill', 'Amount', 'Paid At', 'Status'].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {MOCK_PAYMENTS.map((pmt, i) => (
            <div key={pmt.id} className="grid gap-3 px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1.2fr 1fr', borderBottom: i < MOCK_PAYMENTS.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{pmt.transactionRef}</p>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{pmt.billId}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(pmt.amount)}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{formatDateTime(pmt.paidAt)}</p>
              <StatusBadge status={pmt.status} />
            </div>
          ))}
        </div>
      </div>
    </TenantLayout>
  );
}

// ─── SCR-29: Receipt Upload ────────────────────────────────────────────────────
export function ReceiptUploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const bill = MOCK_BILLS.find(b => b.id === id) ?? MOCK_BILLS[0];
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) { setError('Only JPG, PNG, WebP, or PDF files are supported.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return; }
    setError('');
    setFileName(file.name);
    if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const fake = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFile(fake);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!fileName) { setError('Please upload a receipt file.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  }

  if (submitted) {
    return (
      <TenantLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="text-5xl mb-4">📷</div>
          <h2 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Receipt Uploaded!</h2>
          <p className="body-md mb-5" style={{ color: 'var(--charcoal)' }}>Your receipt has been submitted for verification. The landlord will confirm your payment within 24 hours.</p>
          <Link to="/tenant/bills" className="btn-primary">Back to Bills</Link>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 520 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/tenant/bills/${bill.id}`} className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Upload Receipt</h1>
        </div>

        <div className="card mb-4" style={{ padding: 16 }}>
          <div className="flex justify-between">
            <div>
              <p className="caption" style={{ color: 'var(--ash)' }}>For bill</p>
              <p className="body-sm font-semibold">{bill.id} — {bill.billingPeriod}</p>
            </div>
            <p className="font-bold" style={{ color: 'var(--primary)', fontSize: 18 }}>{formatPrice(bill.totalAmount)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            {/* PaymentReceipt.fileUrl — upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="cursor-pointer rounded-xl flex flex-col items-center justify-center p-8 mb-4 transition-all"
              style={{
                border: '2px dashed var(--hairline)',
                background: fileName ? '#fdf6f0' : 'var(--surface-bone)',
                minHeight: 180,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
            >
              {preview ? (
                <img src={preview} alt="Receipt preview" className="max-h-40 rounded-lg object-contain mb-2" />
              ) : (
                <>
                  <div className="text-4xl mb-3">{fileName ? '📄' : '📤'}</div>
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    {fileName || 'Click or drag file here'}
                  </p>
                  <p className="caption mt-1" style={{ color: 'var(--ash)' }}>
                    JPG, PNG, WebP, PDF · Max 5MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFile}
              className="hidden"
            />
            {error && <div className="alert alert-error mb-4">{error}</div>}

            <div className="flex gap-3 mt-2">
              <button type="button" className="btn-outline" style={{ height: 44 }} onClick={() => fileRef.current?.click()}>
                📸 Browse Files
              </button>
              <button
                id="receipt-submit"
                type="submit"
                className="btn-primary flex-1"
                style={{ height: 44, justifyContent: 'center' }}
                disabled={loading || !fileName}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                    Uploading…
                  </span>
                ) : '📤 Submit Receipt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}
