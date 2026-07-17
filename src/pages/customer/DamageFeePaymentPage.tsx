// Pay Damage Fee — Customer VNPay for approved damage
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import { bookingApi, BookingDetailResponse } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';

function formatVnd(n: number) {
  return `₫${Number(n).toLocaleString('vi-VN')}`;
}

export default function DamageFeePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    bookingApi.getMyBookingDetail(id)
      .then(res => setBooking(res.data))
      .catch(() => setError('Không thể tải thông tin booking'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleVNPay() {
    if (!booking) return;
    setPaying(true);
    setError(null);
    try {
      const res = await paymentApi.createVnpayUrl(booking.id, 'DAMAGE_FEE');
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        setError(res.message || 'Không thể tạo URL thanh toán VNPay');
      }
    } catch (err) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message ?? 'Lỗi kết nối khi tạo thanh toán VNPay');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <CustomerLayout><div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div></CustomerLayout>;
  }
  if (error && !booking) {
    return <CustomerLayout><div className="alert alert-error">{error}</div></CustomerLayout>;
  }
  if (!booking) {
    return <CustomerLayout><div className="alert alert-error">Booking không tồn tại</div></CustomerLayout>;
  }

  const fee = Number(booking.damageFeeAmount ?? 0);
  const damagePaid = (booking.payments ?? []).some(p => p.type === 'DAMAGE_FEE' && p.status === 'PAID');
  const canPay = fee > 0 && !damagePaid;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
          <span>›</span>
          <Link to={`/customer/bookings/${booking.id}`} className="text-primary" style={{ textDecoration: 'none' }}>
            {booking.id.split('-')[0]}
          </Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Thanh toán phí thiệt hại</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 4 }}>Thanh toán phí thiệt hại</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
          Phí đã được Manager duyệt — thanh toán trước khi hoàn tất check-out.
        </p>

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{booking.roomNumber}</p>
              <p className="body-sm text-charcoal">{booking.propertyName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="body-sm text-charcoal">Phí thiệt hại</p>
              <p style={{ fontWeight: 700, color: 'var(--error)' }}>{formatVnd(fee)}</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          {error && <div className="mb-4"><Alert variant="error" message={error} /></div>}
          {!canPay ? (
            <Alert
              variant={damagePaid ? 'success' : 'warning'}
              message={damagePaid ? 'Phí thiệt hại đã thanh toán.' : 'Không có phí thiệt hại cần thanh toán.'}
            />
          ) : (
            <>
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
                disabled={paying}
              >
                {paying ? 'Đang kết nối VNPay...' : `Thanh toán ${formatVnd(fee)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
