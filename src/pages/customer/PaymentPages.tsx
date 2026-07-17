// ─── PaymentPages.tsx — SCR-21, 22, 23, 24 ───────────────────────────────────
// Exports: DepositPaymentPage, RemainingPaymentPage, PaymentHistoryPage, VNPayResultPage

import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import { bookingApi, BookingDetailResponse } from '../../api/bookingApi';
import { paymentApi, PaymentSummaryResponse } from '../../api/paymentApi';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatTxnId(id: string): string {
  return `TXN-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function formatBookingShortId(uuid: string): string {
  return uuid.split('-')[0].toUpperCase();
}

function formatVnd(n: number) {
  return `₫${Number(n).toLocaleString('vi-VN')}`;
}

function PaymentForm({ type, bookingId }: { type: 'DEPOSIT' | 'REMAINING_BALANCE'; bookingId: string }) {
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
      {error && (
        <div className="mb-4">
          <Alert variant="error" message={error} />
        </div>
      )}

      <div className="mb-6 p-4 border border-[var(--hairline)] rounded-lg bg-[var(--surface-bone)]">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">💳</span>
          <div>
            <p className="font-semibold">Thanh toán qua cổng VNPay</p>
            <p className="body-sm text-charcoal">Hỗ trợ quét mã QR, thẻ ATM, Visa/Mastercard</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleVNPay}
        className="btn-primary w-full py-3.5 text-base"
        disabled={loading}
      >
        {loading ? 'Đang kết nối VNPay...' : 'Thanh toán qua VNPay'}
      </button>
    </div>
  );
}

// ── SCR-20: Order Review & Payment (deposit) ─────────────────────────────────
export function DepositPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Không tìm thấy mã đặt phòng');
      return;
    }
    setLoading(true);
    setError(null);
    bookingApi.getMyBookingDetail(id)
      .then(res => setBooking(res.data))
      .catch(() => setError('Không thể tải thông tin đặt phòng'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="py-10 text-center body-md text-charcoal">Đang tải thông tin...</div>
      </CustomerLayout>
    );
  }

  if (error || !booking) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8">
          <Alert variant="error" message={error || 'Đặt phòng không tồn tại'} />
        </div>
      </CustomerLayout>
    );
  }

  const shortId = booking.id.split('-')[0];

  if (booking.status !== 'PENDING_DEPOSIT') {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <Alert
            variant="warning"
            message="Đặt phòng này không ở trạng thái chờ thanh toán cọc. Bạn không thể thanh toán tại đây."
          />
          <Link to={`/customer/bookings/${booking.id}`} className="btn-primary inline-flex">
            Xem chi tiết đặt phòng
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center gap-2 body-sm text-charcoal mb-5">
          <Link to="/customer/bookings" className="text-primary no-underline">Đặt phòng</Link>
          <span aria-hidden="true">›</span>
          <Link to={`/customer/bookings/${booking.id}`} className="text-primary no-underline">{shortId}</Link>
          <span aria-hidden="true">›</span>
          <span className="font-semibold">Thanh toán</span>
        </nav>

        <h1 className="heading-md mb-1">Xem lại &amp; Thanh toán</h1>
        <p className="body-md text-charcoal mb-8">Xác nhận thông tin đặt phòng và thanh toán 40% tiền cọc qua VNPay</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* Left — review */}
          <div className="lg:col-span-3 space-y-6">
            <section className="card p-5">
              <h2 className="heading-sm mb-4">Thông tin khách</h2>
              <dl className="space-y-2 body-md">
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal">Họ tên</dt>
                  <dd className="font-medium text-right">{booking.customerName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal">Email</dt>
                  <dd className="font-medium text-right break-all">{booking.customerEmail}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal">Số điện thoại</dt>
                  <dd className="font-medium">{booking.customerPhone || '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="card p-5">
              <h2 className="heading-sm mb-4">Chi tiết đặt phòng</h2>
              <p className="font-bold text-base mb-1">{booking.roomNumber} — {booking.roomType}</p>
              <p className="body-sm text-charcoal mb-3">{booking.propertyName}</p>
              <p className="body-md mb-1">
                📅 {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
              </p>
              <p className="body-sm text-charcoal">👥 {booking.guestCount} khách</p>
              <div className="divider my-4" />
              <p className="body-sm text-charcoal mb-1">Yêu cầu đặc biệt</p>
              <p className="body-md">{booking.specialRequests?.trim() ? booking.specialRequests : 'Không có'}</p>
            </section>

            <section className="card p-5">
              <h2 className="heading-sm mb-4">Chính sách &amp; nội quy</h2>
              <ul className="body-md text-charcoal space-y-2 list-disc pl-5">
                <li>Chính sách hủy: từ 7 ngày trước check-in hoàn 100% cọc; 3–6 ngày hoàn 50%; dưới 3 ngày không hoàn.</li>
                <li>Giờ check-in: 14:00 · check-out: 12:00 (có thể thay đổi theo homestay).</li>
                <li>Giữ yên tĩnh sau 22:00; không tổ chức tiệc trong phòng.</li>
                <li>Cấm hút thuốc trong phòng; phí phạt theo quy định của homestay.</li>
              </ul>
            </section>
          </div>

          {/* Right — sticky summary */}
          <div className="lg:col-span-2">
            <div className="card p-5 lg:sticky lg:top-6 shadow-md">
              <h2 className="heading-sm mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-3 body-md">
                <div className="flex justify-between">
                  <span className="text-charcoal">Tổng tiền</span>
                  <span className="font-semibold">{formatVnd(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal">Tiền cọc (40%)</span>
                  <span className="font-semibold text-primary">{formatVnd(booking.depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal">Còn lại (60%)</span>
                  <span className="font-semibold">{formatVnd(booking.remainingAmount)}</span>
                </div>
              </div>
              <div className="divider my-4" />
              <p className="body-sm text-charcoal mb-3">Phương thức thanh toán</p>
              <PaymentForm type="DEPOSIT" bookingId={booking.id} />
            </div>
          </div>
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
          <PaymentForm type="REMAINING_BALANCE" bookingId={booking.id} />
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-26: Payment History ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  PENDING:  { cls: 'badge-warning', label: 'Chờ xử lý' },
  PAID:     { cls: 'badge-success', label: 'Đã thanh toán' },
  FAILED:   { cls: 'badge-error',   label: 'Thất bại' },
  REFUNDED: { cls: 'badge-info',    label: 'Đã hoàn' },
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Đặt cọc (40%)',
  REMAINING_BALANCE: 'Còn lại (60%)',
  DAMAGE_FEE: 'Phí hư hỏng',
};

const METHOD_LABELS: Record<string, string> = {
  VNPAY: 'VNPay',
  BANK_TRANSFER: 'Chuyển khoản',
  CASH: 'Tiền mặt',
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'PAID', label: 'Đã thanh toán' },
  { key: 'FAILED', label: 'Thất bại' },
];

export function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setApiError(null);
      try {
        const res = await paymentApi.getMyPayments({
          page,
          size: 20,
          status: filter === 'ALL' ? undefined : filter,
        });
        if (cancelled) return;
        if (res.success && res.data) {
          setPayments(res.data.content);
          setTotalPages(res.data.totalPages);
        } else {
          setPayments([]);
          setTotalPages(0);
          setApiError(res.message || 'Không tải được lịch sử thanh toán.');
        }
      } catch {
        if (!cancelled) {
          setPayments([]);
          setApiError('Không tải được lịch sử thanh toán. Vui lòng thử lại.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, filter]);

  return (
    <CustomerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Lịch sử thanh toán</h1>

      <div className="flex gap-1 flex-wrap p-1 mb-5 bg-[var(--surface-bone)] rounded-full w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`tab-pill ${filter === tab.key ? 'active' : ''}`}
            onClick={() => { setFilter(tab.key); setPage(0); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {apiError && (
        <div style={{ marginBottom: 20 }}>
          <Alert variant="error" message={apiError} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p className="body-md text-charcoal">Đang tải...</p>
        </div>
      ) : payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>Chưa có lịch sử thanh toán.</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Mã giao dịch</th>
                <th>Số tiền</th>
                <th>Loại</th>
                <th>Phương thức</th>
                <th>Đơn đặt phòng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const statusCfg = STATUS_CONFIG[p.status] ?? { cls: 'badge-neutral', label: p.status };
                const displayDate = p.paidAt || p.createdAt;
                return (
                  <tr key={p.id}>
                    <td className="text-charcoal">{displayDate ? formatDateTime(displayDate) : '—'}</td>
                    <td><span className="code-md">{formatTxnId(p.id)}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatVnd(p.amount)}</td>
                    <td><span className="badge badge-tag">{TYPE_LABELS[p.type] ?? p.type}</span></td>
                    <td className="text-charcoal">{METHOD_LABELS[p.method] ?? p.method}</td>
                    <td>
                      <Link
                        to={`/customer/bookings/${p.bookingId}`}
                        className="text-primary"
                        style={{ textDecoration: 'none', fontWeight: 600 }}
                      >
                        #{formatBookingShortId(p.bookingId)}
                      </Link>
                    </td>
                    <td><span className={`badge ${statusCfg.cls}`}>{statusCfg.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-12" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Trước
          </button>
          <span className="body-sm text-charcoal">Trang {page + 1} / {totalPages}</span>
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Sau
          </button>
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
