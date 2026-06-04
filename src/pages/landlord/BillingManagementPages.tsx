import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_BILLS, MOCK_PAYMENTS, MOCK_CONTRACTS, KpiCard, StatusBadge, PageHeader, FilterBar, formatDate, formatPrice, formatDateTime } from './shared';

// SCR-55 — Billing Dashboard
// SCR-56 — Bill List Management
// SCR-57 — Create Bill
// SCR-58 — Bill Detail Management
// SCR-59 — Edit Bill
// SCR-60 — Payment Verification Queue
// SCR-61 — Payment Detail

const TOTAL_REVENUE = 34580000;
const PAID_BILLS    = MOCK_BILLS.filter(b => b.status === 'PAID').length;
const PENDING_BILLS = MOCK_BILLS.filter(b => b.status === 'PENDING').length;
const OVERDUE_BILLS = MOCK_BILLS.filter(b => b.status === 'OVERDUE').length;

// ─── SCR-55: Billing Dashboard ─────────────────────────────────────────────────
export function BillingDashboardPage() {
  return (
    <LandlordLayout>
      <div className="animate-fade-up flex flex-col gap-6">
        <PageHeader title="Billing Overview" sub="Revenue, outstanding bills, and payment tracking" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="💰" label="Total Bills" value={MOCK_BILLS.length} sub="this period" />
          <KpiCard icon="✅" label="Paid Bills" value={PAID_BILLS} sub={formatPrice(MOCK_BILLS.filter(b=>b.status==='PAID').reduce((s,b)=>s+b.totalAmount,0))} color="var(--success)" />
          <KpiCard icon="⏳" label="Pending Bills" value={PENDING_BILLS} sub="awaiting payment" color="var(--warning)" />
          <KpiCard icon="⚠️" label="Overdue Bills" value={OVERDUE_BILLS} sub="action needed" color="var(--error)" />
        </div>

        {/* Revenue summary + outstanding */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-5" style={{ color: 'var(--ink)' }}>Recent Bills</h3>
            {MOCK_BILLS.slice(0, 4).map((bill, i) => (
              <div key={bill.id} className="flex items-center justify-between py-3 border-b"
                style={{ borderColor: i < 3 ? 'var(--hairline)' : 'transparent' }}>
                <div>
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{bill.tenantName}</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>{bill.billingPeriod} · Room {bill.roomNumber}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(bill.totalAmount)}</p>
                  <StatusBadge status={bill.status} />
                  <Link to={`/landlord/billing/${bill.id}`} className="btn-ghost" style={{ height: 30, padding: '0 12px', fontSize: 12, color: 'var(--charcoal)' }}>View</Link>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <Link to="/landlord/billing" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All Bills →</Link>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Recent Payments</h3>
            {MOCK_PAYMENTS.map((pmt, i) => (
              <div key={pmt.id} className="py-3 border-b" style={{ borderColor: i < MOCK_PAYMENTS.length - 1 ? 'var(--hairline)' : 'transparent' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{pmt.tenantName}</p>
                  <StatusBadge status={pmt.status} />
                </div>
                <p className="caption" style={{ color: 'var(--ash)' }}>{pmt.method} · {formatPrice(pmt.amount)}</p>
              </div>
            ))}
            <div className="mt-4">
              <Link to="/landlord/payments" className="body-sm font-semibold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View All Payments →</Link>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-56: Bill List Management ─────────────────────────────────────────────
export function BillListManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = MOCK_BILLS
    .filter(b => status === 'ALL' || b.status === status)
    .filter(b =>
      b.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Bills" sub={`${MOCK_BILLS.length} total`}
          action={<Link to="/landlord/billing/create" className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14, textDecoration: 'none' }}>+ Create Bill</Link>}
        />
        <FilterBar search={search} onSearch={setSearch}>
          <select className="input-field-rect" style={{ height: 38, width: 160, cursor: 'pointer' }}
            value={status} onChange={e => setStatus(e.target.value)}>
            {['ALL','PENDING','OVERDUE','PAID','DISPUTED','WAIVED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterBar>
        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr 1fr 90px', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Bill No.', 'Tenant', 'Period', 'Total', 'Due Date', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((bill, i) => (
            <div key={bill.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr 1fr 90px', gap: '12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{bill.id}</p>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{bill.tenantName}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>Room {bill.roomNumber}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{bill.billingPeriod}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(bill.totalAmount)}</p>
              <p className="body-sm" style={{ color: bill.status === 'OVERDUE' ? 'var(--error)' : 'var(--ink)' }}>{formatDate(bill.dueDate)}</p>
              <StatusBadge status={bill.status} />
              <div className="flex gap-1">
                <Link to={`/landlord/billing/${bill.id}`} className="btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 12, color: 'var(--charcoal)' }}>View</Link>
                <Link to={`/landlord/billing/${bill.id}/edit`} className="btn-ghost" style={{ height: 30, padding: '0 8px', fontSize: 12, color: 'var(--charcoal)' }}>✏️</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-57: Create Bill ──────────────────────────────────────────────────────
export function CreateBillPage() {
  const navigate = useNavigate();
  const [contractId, setContract]   = useState('');
  const [period, setPeriod]         = useState('');
  const [electricKwh, setElec]      = useState('');
  const [waterM3, setWater]         = useState('');
  const [serviceFee, setService]    = useState('200000');
  const [dueDate, setDueDate]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const selectedContract = MOCK_CONTRACTS.find(c => c.id === contractId);
  const elecAmount = Number(electricKwh) * 3500;
  const waterAmount = Number(waterM3) * 10000;
  const totalEstimate = (selectedContract?.monthlyRent ?? 0) + elecAmount + waterAmount + Number(serviceFee);

  function validate() {
    const e: Record<string, string> = {};
    if (!contractId) e.contract = 'Contract is required.';
    if (!period) e.period = 'Billing period is required.';
    if (!dueDate) e.dueDate = 'Due date is required.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/landlord/billing'); }, 1000);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 700 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/landlord/billing" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Create Bill</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            <div className="flex flex-col gap-5">
              {/* Bill.contract */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Contract <span style={{ color: 'var(--error)' }}>*</span></label>
                <select className="input-field-rect" style={{ cursor: 'pointer' }} value={contractId} onChange={e => setContract(e.target.value)}>
                  <option value="">Select contract…</option>
                  {MOCK_CONTRACTS.filter(c => c.status === 'ACTIVE').map(c => (
                    <option key={c.id} value={c.id}>{c.id} — {c.tenantName} (Room {c.roomNumber})</option>
                  ))}
                </select>
                {errors.contract && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.contract}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bill.billingPeriod */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Billing Period <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="month" className="input-field-rect" value={period} onChange={e => setPeriod(e.target.value)} />
                  {errors.period && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.period}</p>}
                </div>
                {/* Bill.dueDate */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Due Date <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="date" className="input-field-rect" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  {errors.dueDate && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.dueDate}</p>}
                </div>
              </div>

              {/* Utility charges (linked to UtilityReading) */}
              <div>
                <p className="label-sm mb-3" style={{ color: 'var(--charcoal)' }}>UTILITY CHARGES</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Bill.electricityFee — from UtilityReading */}
                  <div>
                    <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Electricity Usage (kWh)</label>
                    <input type="number" className="input-field-rect" value={electricKwh} onChange={e => setElec(e.target.value)} placeholder="120" min="0" />
                    <p className="caption mt-1" style={{ color: 'var(--ash)' }}>@ ₫3,500/kWh = {formatPrice(elecAmount)}</p>
                  </div>
                  {/* Bill.waterFee — from UtilityReading */}
                  <div>
                    <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Water Usage (m³)</label>
                    <input type="number" className="input-field-rect" value={waterM3} onChange={e => setWater(e.target.value)} placeholder="8" min="0" />
                    <p className="caption mt-1" style={{ color: 'var(--ash)' }}>@ ₫10,000/m³ = {formatPrice(waterAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Bill.serviceFee */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Service Fee (₫)</label>
                <input type="number" className="input-field-rect" value={serviceFee} onChange={e => setService(e.target.value)} min="0" />
              </div>

              {/* Preview total */}
              {selectedContract && (
                <div className="rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="label-sm mb-3" style={{ color: 'var(--charcoal)' }}>BILL PREVIEW</p>
                  {[
                    { label: 'Room Rent',    amount: selectedContract.monthlyRent },
                    { label: 'Electricity',  amount: elecAmount },
                    { label: 'Water',        amount: waterAmount },
                    { label: 'Service Fee',  amount: Number(serviceFee) },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between body-sm mb-1">
                      <span style={{ color: 'var(--charcoal)' }}>{row.label}</span>
                      <span style={{ color: 'var(--ink)' }}>{formatPrice(row.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 flex justify-between" style={{ borderColor: 'var(--hairline)' }}>
                    <span className="body-sm font-bold" style={{ color: 'var(--ink)' }}>Total</span>
                    <span className="body-sm font-bold" style={{ color: 'var(--primary)' }}>{formatPrice(totalEstimate)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}>
                {loading ? '…' : '💳 Generate Bill'}
              </button>
              <Link to="/landlord/billing" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-58 / SCR-59: Bill Detail + Edit (combined) ────────────────────────────
export function BillDetailManagementPage({ mode }: { mode: 'view' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bill = MOCK_BILLS.find(b => b.id === id) ?? MOCK_BILLS[0];
  const [editRent, setEditRent] = useState(String(bill.roomRent));
  const [editElec, setEditElec] = useState(String(bill.electricityFee));
  const [editWater, setEditWater] = useState(String(bill.waterFee));
  const [editService, setEditService] = useState(String(bill.serviceFee));
  const [loading, setLoading] = useState(false);

  const total = Number(editRent) + Number(editElec) + Number(editWater) + Number(editService);

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/billing" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Bills</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{bill.id}</span>
          {mode === 'edit' && <><span>/</span><span style={{ color: 'var(--ink)' }}>Edit</span></>}
        </nav>

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{mode === 'edit' ? 'Edit Bill' : 'Bill Detail'}</h1>
              <StatusBadge status={bill.status} />
            </div>
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{bill.tenantName} · {bill.billingPeriod}</p>
          </div>
          {mode === 'view' && (
            <Link to={`/landlord/billing/${bill.id}/edit`} className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}>✏️ Edit</Link>
          )}
        </div>

        <div className="card overflow-hidden mb-5">
          <div className="px-5 py-4 border-b" style={{ background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Charge Breakdown</h3>
          </div>
          {[
            { label: 'Room Rent',      field: 'rent',    amount: bill.roomRent,       setEdit: setEditRent,    editVal: editRent },
            { label: 'Electricity Fee', field: 'elec',  amount: bill.electricityFee, setEdit: setEditElec,    editVal: editElec },
            { label: 'Water Fee',      field: 'water',   amount: bill.waterFee,       setEdit: setEditWater,   editVal: editWater },
            { label: 'Service Fee',    field: 'service', amount: bill.serviceFee,     setEdit: setEditService, editVal: editService },
          ].map((item, i, arr) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: i < arr.length - 1 ? 'var(--hairline)' : 'transparent' }}>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{item.label}</p>
              {mode === 'edit' ? (
                <input type="number" value={item.editVal} onChange={e => item.setEdit(e.target.value)}
                  className="input-field-rect text-right" style={{ width: 160, height: 36 }} />
              ) : (
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatPrice(item.amount)}</p>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: 'var(--surface-bone)' }}>
            <p className="heading-sm" style={{ color: 'var(--ink)' }}>Total</p>
            <p className="heading-sm" style={{ color: 'var(--primary)', fontSize: 22 }}>
              {mode === 'edit' ? formatPrice(total) : formatPrice(bill.totalAmount)}
            </p>
          </div>
        </div>

        {mode === 'edit' && (
          <div className="flex gap-3">
            <button className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}
              onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); navigate(`/landlord/billing/${bill.id}`); }, 1000); }}>
              {loading ? '…' : '💾 Save Changes'}
            </button>
            <Link to={`/landlord/billing/${bill.id}`} className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-60: Payment Verification Queue ──────────────────────────────────────
export function PaymentVerificationPage() {
  const [filter, setFilter] = useState('PENDING');
  const payments = MOCK_PAYMENTS.filter(p => filter === 'ALL' || p.status === filter);

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Payment Verification" sub="Review and verify tenant payment receipts" />
        <div className="flex gap-2 mb-5">
          {['ALL','PENDING','SUCCESS','FAILED'].map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="btn-ghost rounded-full text-sm font-semibold px-4"
              style={{ height: 36, background: filter === f ? 'var(--surface-dark)' : 'transparent', color: filter === f ? 'var(--on-dark)' : 'var(--charcoal)' }}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {payments.map(pmt => (
            <div key={pmt.id} className="card" style={{ padding: 24 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  {/* PaymentReceipt.fileUrl preview */}
                  <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 80, height: 80 }}>
                    <img src={pmt.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{pmt.id}</p>
                      <StatusBadge status={pmt.status} />
                    </div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{pmt.tenantName}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>
                      {pmt.method} · {formatPrice(pmt.amount)} · Ref: {pmt.transactionRef}
                    </p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{formatDateTime(pmt.paidAt)}</p>
                  </div>
                </div>
                {pmt.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link to={`/landlord/payments/${pmt.id}`} className="btn-outline" style={{ height: 36, padding: '0 16px', fontSize: 13, textDecoration: 'none' }}>
                      View Details
                    </Link>
                    <button type="button" className="btn-primary" style={{ height: 36, padding: '0 16px', fontSize: 13, background: 'var(--success)' }}>
                      ✅ Approve
                    </button>
                    <button type="button" className="btn-ghost" style={{ height: 36, padding: '0 16px', fontSize: 13, color: 'var(--error)' }}>
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="card flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="heading-sm" style={{ color: 'var(--ink)' }}>No payments to verify</p>
            </div>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-61: Payment Detail ───────────────────────────────────────────────────
export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const payment = MOCK_PAYMENTS.find(p => p.id === id) ?? MOCK_PAYMENTS[0];
  const bill = MOCK_BILLS.find(b => b.id === payment.billId);

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/payments" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Payments</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{payment.id}</span>
        </nav>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Payment {payment.id}</h1>
          <StatusBadge status={payment.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Transaction info */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Transaction Details</h3>
            {[
              { label: 'Payment ID',    value: payment.id, mono: true },
              { label: 'Tenant',        value: payment.tenantName },
              { label: 'Amount',        value: formatPrice(payment.amount), bold: true },
              { label: 'Method',        value: payment.method },
              { label: 'Transaction Ref', value: payment.transactionRef, mono: true },
              { label: 'Date',          value: formatDateTime(payment.paidAt) },
              { label: 'Bill Period',   value: bill?.billingPeriod ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2.5 border-b" style={{ borderColor: 'var(--hairline)' }}>
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{row.label}</span>
                <span className={row.mono ? 'code-md' : 'body-sm'} style={{ color: row.bold ? 'var(--primary)' : 'var(--ink)', fontWeight: row.bold ? 700 : 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Receipt image + verify actions */}
          <div className="flex flex-col gap-4">
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Receipt Image</h3>
              <img src={payment.receiptUrl} alt="Receipt" className="rounded-lg w-full object-cover mb-3" style={{ maxHeight: 240 }} />
              <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-outline w-full" style={{ height: 38, justifyContent: 'center', fontSize: 13, textDecoration: 'none', display: 'flex' }}>
                🔍 View Full Receipt
              </a>
            </div>
            {payment.status === 'PENDING' && (
              <div className="card" style={{ padding: 20 }}>
                <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Verification</h3>
                <div className="flex flex-col gap-2">
                  <button type="button" className="btn-primary w-full" style={{ height: 44, justifyContent: 'center', background: 'var(--success)' }}>
                    ✅ Approve Payment
                  </button>
                  <button type="button" className="btn-outline w-full" style={{ height: 40, justifyContent: 'center', color: 'var(--error)', borderColor: 'var(--error)', fontSize: 13 }}>
                    ❌ Reject Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
