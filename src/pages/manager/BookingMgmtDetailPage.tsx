import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerBookingV1,
  type ManagerBookingDetail,
  type BookingPaymentInfo,
} from '../../api/bookingApi';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING_DEPOSIT:        { label: 'Chờ cọc',                    variant: 'warning' },
  CONFIRMED:              { label: 'Đã xác nhận',                variant: 'success' },
  CHECKED_IN:             { label: 'Đã nhận phòng',              variant: 'primary' },
  PENDING_INSPECTION:     { label: 'Chờ kiểm tra',               variant: 'warning' },
  PENDING_DAMAGE_PAYMENT: { label: 'Chờ thanh toán thiệt hại',   variant: 'danger' },
  CHECKED_OUT:            { label: 'Đã trả phòng',               variant: 'neutral' },
  CANCELLED:              { label: 'Đã hủy',                     variant: 'danger' },
  NO_SHOW:                { label: 'Không đến',                    variant: 'danger' },
};

/** Spec: status stays PENDING_DAMAGE_PAYMENT until check-out; label changes after fee is PAID. */
function resolveStatusBadge(
  status: string,
  damageFeePaid?: boolean,
): { label: string; variant: StatusVariant } {
  if (status === 'PENDING_DAMAGE_PAYMENT' && damageFeePaid) {
    return { label: 'Sẵn sàng trả phòng', variant: 'warning' };
  }
  return STATUS_VI[status] ?? { label: status, variant: 'neutral' };
}

const PAYMENT_TYPE_VI: Record<string, string> = {
  DEPOSIT: 'Đặt cọc',
  REMAINING_BALANCE: 'Phần còn lại',
  DAMAGE_FEE: 'Phí thiệt hại',
  REFUND: 'Hoàn tiền',
};

const PAYMENT_STATUS_VI: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn',
};

function formatVnd(value: number | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function shortBookingId(id: string): string {
  return `BK-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function countNights(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        padding: '14px 20px',
        background: '#202020',
        color: '#fcfcfc',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(32,32,32,0.18)',
        borderLeft: '4px solid #2b9a66',
      }}
    >
      {message}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-[#F1F5F9] rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 bg-[#F1F5F9] rounded-xl" />
          <div className="h-48 bg-[#F1F5F9] rounded-xl" />
          <div className="h-56 bg-[#F1F5F9] rounded-xl" />
        </div>
        <div className="h-64 bg-[#F1F5F9] rounded-xl" />
      </div>
    </div>
  );
}

function PaymentTable({ payments }: { payments: BookingPaymentInfo[] }) {
  if (!payments.length) {
    return <p className="text-sm text-[#64748B]">Chưa có giao dịch thanh toán.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-[#64748B] border-b border-[#E2E8F0]">
            <th className="py-2 pr-3">Loại</th>
            <th className="py-2 pr-3">Số tiền</th>
            <th className="py-2 pr-3">Phương thức</th>
            <th className="py-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id} className="border-b border-[#F1F5F9]">
              <td className="py-2.5 pr-3">{PAYMENT_TYPE_VI[p.type] ?? p.type}</td>
              <td className="py-2.5 pr-3 font-medium">{formatVnd(p.amount)}</td>
              <td className="py-2.5 pr-3">{p.method}</td>
              <td className="py-2.5">{PAYMENT_STATUS_VI[p.status] ?? p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BookingMgmtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [booking, setBooking] = useState<ManagerBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchManagerBookingV1(id);
      setBooking(data);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      if (ax?.response?.status === 403) {
        setLoadError('Bạn không có quyền xem đặt phòng này.');
      } else {
        setLoadError(ax?.response?.data?.message ?? 'Không thể tải chi tiết đặt phòng.');
      }
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      setToast(state.toast);
      loadBooking();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, loadBooking]);

  if (loadError) {
    return (
      <ManagerLayout>
        <div className="card p-10 text-center max-w-md mx-auto">
          <h2 className="heading-sm mb-2">Không tải được đặt phòng</h2>
          <p className="body-md text-charcoal mb-6">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={loadBooking}>Thử lại</button>
            <Link to="/manager/bookings" className="btn-ghost">Quay lại danh sách</Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  const damageFeePaid = Boolean(
    booking?.damageFeePaid
    || (booking?.payments ?? []).some(p => p.type === 'DAMAGE_FEE' && p.status === 'PAID'),
  );
  const statusCfg = booking
    ? resolveStatusBadge(booking.status, damageFeePaid)
    : null;

  const nights = booking
    ? countNights(booking.checkInDate, booking.checkOutDate)
    : 0;

  const showCheckOutButton = booking && (
    booking.canCheckOut
    || (booking.status === 'PENDING_INSPECTION' && booking.checkOutBlockedReason)
    || booking.status === 'PENDING_DAMAGE_PAYMENT'
  );
  const showCheckInButton = booking?.status === 'CONFIRMED';
  const checkInBlockedReason = booking && showCheckInButton && !booking.canCheckIn
    ? (booking.checkInDate > new Date().toISOString().slice(0, 10)
      ? `Chỉ check-in từ ngày ${formatDate(booking.checkInDate)}`
      : 'Booking chưa đủ điều kiện nhận phòng')
    : null;

  return (
    <ManagerLayout>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Link to="/manager/bookings" className="text-[#0F766E] no-underline">Đặt phòng</Link>
          <span>›</span>
          <span className="font-semibold text-[#1E293B]">
            {booking ? shortBookingId(booking.id) : '…'}
          </span>
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : booking && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="font-display text-[28px] font-bold text-[#1E293B]">
                {shortBookingId(booking.id)}
              </h1>
              {statusCfg && (
                <StatusBadge status={statusCfg.label} variant={statusCfg.variant} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
                  <h2 className="font-semibold text-[#1E293B] mb-4">Thông tin khách</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#64748B]">Họ tên</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{booking.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Email</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{booking.customerEmail}</p>
                    </div>
                    {booking.customerPhone && (
                      <div>
                        <p className="text-xs text-[#64748B]">Điện thoại</p>
                        <p className="font-semibold text-[#1E293B] mt-0.5">{booking.customerPhone}</p>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/manager/customers/${booking.customerId}`}
                    className="inline-block mt-4 text-sm text-[#0F766E] font-medium no-underline hover:underline"
                  >
                    Xem hồ sơ khách →
                  </Link>
                </div>

                <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
                  <h2 className="font-semibold text-[#1E293B] mb-4">Chi tiết đặt phòng</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#64748B]">Phòng</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{booking.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Loại phòng</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{booking.roomType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Homestay</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{booking.propertyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Số khách</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{booking.guestCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Nhận phòng</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{formatDate(booking.checkInDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Trả phòng</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{formatDate(booking.checkOutDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Số đêm</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{nights} đêm</p>
                    </div>
                  </div>
                  {booking.specialRequests && (
                    <div className="mt-4 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs text-[#64748B]">Yêu cầu đặc biệt</p>
                      <p className="text-sm text-[#334155] mt-1">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
                  <h2 className="font-semibold text-[#1E293B] mb-4">Thanh toán</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-[#64748B]">Tổng tiền</p>
                      <p className="font-bold text-[#1E293B] mt-0.5">{formatVnd(booking.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Cọc (40%)</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{formatVnd(booking.depositAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Còn lại (60%)</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{formatVnd(booking.remainingAmount)}</p>
                    </div>
                    {(booking.damageFeeAmount ?? 0) > 0 && (
                      <div>
                        <p className="text-xs text-[#64748B]">Phí thiệt hại</p>
                        <p className="font-semibold text-red-600 mt-0.5">{formatVnd(booking.damageFeeAmount)}</p>
                      </div>
                    )}
                  </div>
                  <PaymentTable payments={booking.payments ?? []} />
                </div>
              </div>

              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-sm">
                <h2 className="font-semibold text-[#1E293B] mb-4">Thao tác</h2>
                <div className="flex flex-col gap-3">
                  {showCheckInButton && (
                    <button
                      type="button"
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => navigate(`/manager/bookings/${id}/check-in`)}
                      disabled={!booking.canCheckIn}
                      title={checkInBlockedReason ?? undefined}
                    >
                      Nhận phòng
                    </button>
                  )}

                  {checkInBlockedReason && (
                    <p className="text-xs text-[#B45309]">{checkInBlockedReason}</p>
                  )}

                  {showCheckOutButton && (
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={() => navigate(`/manager/bookings/${id}/check-out`)}
                      title={booking.checkOutBlockedReason ?? undefined}
                    >
                      Trả phòng
                    </button>
                  )}

                  {booking.checkOutBlockedReason && !booking.canCheckOut && (
                    <p className="text-xs text-[#B45309]">{booking.checkOutBlockedReason}</p>
                  )}

                  <button
                    type="button"
                    className="btn-outline w-full opacity-50 cursor-not-allowed"
                    disabled
                    title="Sắp có"
                  >
                    Gửi lại xác nhận
                  </button>

                  <Link
                    to={`/manager/payments?bookingId=${booking.id}`}
                    className="btn-outline w-full text-center no-underline"
                  >
                    Xem thanh toán
                  </Link>
                  <Link
                    to={`/manager/contracts?bookingId=${booking.id}`}
                    className="btn-outline w-full text-center no-underline"
                  >
                    Xem hợp đồng
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
