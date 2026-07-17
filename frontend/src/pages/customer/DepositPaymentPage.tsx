// SCR-20: Order Review & Payment (deposit via VNPay only)
import { useCallback, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import HoldCountdownTimer, { isHoldExpired } from '../../components/booking/HoldCountdownTimer';
import StickyOrderSummary from '../../components/booking/StickyOrderSummary';
import { bookingApi, BookingDetailResponse } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function PayViaVNPayButton({
  bookingId,
  disabled,
}: {
  bookingId: string;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVNPay() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.createVnpayUrl(bookingId, 'DEPOSIT');
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        setError(res.message || 'Không thể tạo URL thanh toán VNPay');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? 'Lỗi kết nối khi tạo thanh toán VNPay');
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
      <div className="mb-4 p-4 border border-[var(--hairline)] rounded-lg bg-[var(--surface-bone)]">
        <p className="font-semibold">Thanh toán qua cổng VNPay</p>
        <p className="body-sm text-charcoal mt-1">Hỗ trợ quét mã QR, thẻ ATM, Visa/Mastercard. Chỉ dùng VNPay trên màn này.</p>
      </div>
      <button
        type="button"
        onClick={handleVNPay}
        className="btn-primary w-full py-3.5 text-base"
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
      >
        {loading ? 'Đang kết nối VNPay...' : 'Pay via VNPay'}
      </button>
    </div>
  );
}

export default function DepositPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);

  const handleExpire = useCallback(() => setHoldExpired(true), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Không tìm thấy mã đặt phòng');
      return;
    }
    setLoading(true);
    setError(null);
    bookingApi
      .getMyBookingDetail(id)
      .then((res) => {
        const data = res.data;
        setBooking(data);
        setHoldExpired(isHoldExpired(data.holdExpiresAt));
      })
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
  const payDisabled = holdExpired || isHoldExpired(booking.holdExpiresAt);

  if (booking.status !== 'PENDING_DEPOSIT') {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <Alert variant="warning" message="Đặt phòng này không ở trạng thái chờ thanh toán cọc." />
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
        <nav className="flex items-center gap-2 body-sm text-charcoal mb-5" aria-label="Breadcrumb">
          <Link to="/customer/bookings" className="text-primary no-underline">
            Đặt phòng
          </Link>
          <span aria-hidden="true">›</span>
          <Link to={`/customer/bookings/${booking.id}`} className="text-primary no-underline">
            {shortId}
          </Link>
          <span aria-hidden="true">›</span>
          <span className="font-semibold">Review &amp; Pay</span>
        </nav>

        <h1 className="heading-md mb-1">Xem lại &amp; Thanh toán</h1>
        <p className="body-md text-charcoal mb-6">
          Checkout Step 2 — xác nhận hóa đơn, chính sách và thanh toán cọc 40% qua VNPay
        </p>

        <div className="mb-6">
          <HoldCountdownTimer holdExpiresAt={booking.holdExpiresAt} onExpire={handleExpire} />
          {payDisabled && (
            <div className="mt-3">
              <Alert variant="error" message="Payment window expired. Không thể thanh toán cọc cho đặt phòng này." />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
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
              <p className="font-bold text-base mb-1">
                {booking.roomNumber} — {booking.roomType}
              </p>
              <p className="body-sm text-charcoal mb-3">{booking.propertyName}</p>
              <p className="body-md mb-1">
                {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
              </p>
              <p className="body-sm text-charcoal">{booking.guestCount} khách</p>
              <div className="divider my-4" />
              <p className="body-sm text-charcoal mb-1">Yêu cầu đặc biệt</p>
              <p className="body-md">
                {booking.specialRequests?.trim() ? booking.specialRequests : 'Không có'}
              </p>
            </section>

            <section className="card p-5">
              <h2 className="heading-sm mb-4">Chính sách &amp; nội quy</h2>
              <ul className="body-md text-charcoal space-y-2 list-disc pl-5">
                <li>
                  Chính sách hủy: ≥7 ngày trước check-in hoàn 100% cọc; 3–7 ngày hoàn 50%; dưới 3 ngày
                  không hoàn.
                </li>
                <li>Giờ check-in: 14:00 · check-out: 12:00.</li>
                <li>Giữ yên tĩnh sau 22:00; không tổ chức tiệc trong phòng.</li>
                <li>Cấm hút thuốc trong phòng.</li>
                <li>TotalAmount đã được snapshot lúc đặt — không thay đổi khi giá phòng cập nhật sau.</li>
              </ul>
            </section>
          </div>

          <div className="lg:col-span-2">
            <StickyOrderSummary
              totalAmount={booking.totalAmount}
              depositAmount={booking.depositAmount}
              remainingAmount={booking.remainingAmount}
            >
              <PayViaVNPayButton bookingId={booking.id} disabled={payDisabled} />
            </StickyOrderSummary>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
