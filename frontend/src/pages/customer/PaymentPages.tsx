// ─── PaymentPages.tsx — SCR-21, 22, 23, 24 ───────────────────────────────────
// Exports: DepositPaymentPage, RemainingPaymentPage, PaymentHistoryPage, ReceiptUploadPage, VNPayResultPage

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { bookingApi, BookingDetailResponse } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';

const PAYMENT_HISTORY = [
  { id: 'P001', bookingId: '0000000-0000-0000-0000-000000000001', type: 'DEPOSIT', amount: 3000000, method: 'BANK_TRANSFER', status: 'PAID', paidAt: '2026-06-14T10:00:00', createdAt: '2026-06-10T09:00:00' },
  { id: 'P002', bookingId: '0000000-0000-0000-0000-000000000002', type: 'REMAINING_BALANCE', amount: 4500000, method: 'BANK_TRANSFER', status: 'PENDING', paidAt: null, createdAt: '2026-06-14T10:30:00' },
  { id: 'P003', bookingId: 'B003', type: 'DEPOSIT', amount: 2160000, method: 'CASH', status: 'PAID', paidAt: '2026-03-22T11:00:00', createdAt: '2026-03-20T08:00:00' },
];

function PaymentForm({ type, amount, bookingId }: { type: 'DEPOSIT' | 'REMAINING_BALANCE'; amount: number; bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVNPay() {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.createVnpayUrl(bookingId, type);
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        setError('Không thể tạo URL thanh toán VNPay');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối khi tạo thanh toán VNPay');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ marginBottom: 24, padding: 16, border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--surface-bone)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>💳</span>
          <div>
            <p style={{ fontWeight: 600 }}>Thanh toán qua cổng VNPay</p>
            <p className="body-sm text-charcoal">Hỗ trợ quét mã QR, thẻ ATM, Visa/Mastercard</p>
          </div>
        </div>
      </div>

      <button onClick={handleVNPay} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16 }} disabled={loading}>
        {loading ? 'Đang kết nối VNPay...' : `Thanh toán qua VNPay`}
      </button>
    </div>
  );
}

// ── SCR-21: Deposit Payment ───────────────────────────────────────────────────
export function DepositPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (!id) return;
    bookingApi.getBookingDetail(id)
      .then(res => setBooking(res.data))
      .catch(err => setError('Không thể tải thông tin booking'))
      .finally(() => setLoading(false));
  });

  if (loading) return <CustomerLayout><div style={{ padding: 40, textAlign: 'center' }}>Đang tải thông tin...</div></CustomerLayout>;
  if (error || !booking) return <CustomerLayout><div className="alert alert-error">{error || 'Booking không tồn tại'}</div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
          <span>›</span>
          <Link to={`/customer/bookings/${booking.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{booking.id.split('-')[0]}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Pay Deposit</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 4 }}>Deposit Payment</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Thanh toán 40% cọc để xác nhận booking của bạn</p>

        {/* Booking summary */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{booking.roomNumber} — {booking.roomType}</p>
              <p className="body-sm text-charcoal">{booking.propertyName}</p>
              <p className="body-sm text-charcoal">📅 {new Date(booking.checkInDate).toLocaleDateString()} → {new Date(booking.checkOutDate).toLocaleDateString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="body-sm text-charcoal">Tổng tiền</p>
              <p style={{ fontWeight: 700, fontSize: 15 }}>₫{booking.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="heading-sm">Tiền cọc cần thanh toán (40%)</span>
            <span className="heading-sm text-primary">₫{booking.depositAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <PaymentForm type="DEPOSIT" amount={booking.depositAmount} bookingId={booking.id} />
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-22: Remaining Balance Payment ────────────────────────────────────────
export function RemainingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (!id) return;
    bookingApi.getBookingDetail(id)
      .then(res => setBooking(res.data))
      .catch(err => setError('Không thể tải thông tin booking'))
      .finally(() => setLoading(false));
  });

  if (loading) return <CustomerLayout><div style={{ padding: 40, textAlign: 'center' }}>Đang tải thông tin...</div></CustomerLayout>;
  if (error || !booking) return <CustomerLayout><div className="alert alert-error">{error || 'Booking không tồn tại'}</div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
          <span>›</span>
          <Link to={`/customer/bookings/${booking.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{booking.id.split('-')[0]}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Pay Remaining Balance</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 4 }}>Thanh toán số dư còn lại</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Thanh toán 60% còn lại trước khi nhận phòng</p>

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{booking.roomNumber}</p>
              <p className="body-sm text-charcoal">{booking.propertyName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="body-sm text-charcoal">Đã cọc</p>
              <p style={{ fontWeight: 600 }}>₫{booking.depositAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="heading-sm">Còn lại (60%)</span>
            <span className="heading-sm text-primary">₫{booking.remainingAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <PaymentForm type="REMAINING_BALANCE" amount={booking.remainingAmount} bookingId={booking.id} />
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-23: Payment History ───────────────────────────────────────────────────
export function PaymentHistoryPage() {
  const StatusBadge = ({ s }: { s: string }) => {
    const m: Record<string, { cls: string; l: string }> = {
      PAID: { cls: 'badge-success', l: 'Paid' },
      PENDING: { cls: 'badge-warning', l: 'Pending' },
      FAILED: { cls: 'badge-error', l: 'Failed' },
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

// ── SCR-24: VNPay Result ────────────────────────────────────────────────────
export function VNPayResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const bookingId = searchParams.get('bookingId');
  const message = searchParams.get('message');

  const isSuccess = status === 'success';

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: isSuccess ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {isSuccess ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          )}
        </div>
        <h2 className="heading-md" style={{ marginBottom: 8 }}>
          {isSuccess ? 'Thanh toán VNPay thành công!' : 'Thanh toán thất bại'}
        </h2>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
          {isSuccess
            ? 'Cảm ơn bạn đã thanh toán. Giao dịch đã được ghi nhận vào hệ thống.'
            : message === 'Payment_Failed' ? 'Bạn đã hủy giao dịch hoặc thẻ không đủ số dư.' : 'Đã có lỗi xảy ra trong quá trình xử lý giao dịch (' + message + ').'}
        </p>

        {isSuccess && bookingId && (
          <Link to={`/customer/bookings/${bookingId}`} className="btn-primary" style={{ marginBottom: 12, display: 'block' }}>
            Xem chi tiết Booking
          </Link>
        )}
        <Link to="/customer/payments" className={isSuccess ? "btn-ghost" : "btn-primary"} style={{ display: 'block' }}>
          {isSuccess ? 'Lịch sử thanh toán' : 'Quay lại Lịch sử thanh toán'}
        </Link>
      </div>
    </CustomerLayout>
  );
}
