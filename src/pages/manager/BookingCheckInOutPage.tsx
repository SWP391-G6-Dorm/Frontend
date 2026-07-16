import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import Checkbox from '../../components/ui/Checkbox';
import { StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerBookingV1,
  checkInBookingV1,
  checkOutBookingV1,
  type ManagerBookingDetail,
} from '../../api/bookingApi';

const MAX_ID_BYTES = 5 * 1024 * 1024;

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING_DEPOSIT:        { label: 'Chờ cọc',                  variant: 'warning' },
  CONFIRMED:              { label: 'Đã xác nhận',              variant: 'success' },
  CHECKED_IN:             { label: 'Đã nhận phòng',            variant: 'primary' },
  PENDING_INSPECTION:     { label: 'Chờ kiểm tra',             variant: 'warning' },
  PENDING_DAMAGE_PAYMENT: { label: 'Chờ thanh toán thiệt hại', variant: 'danger' },
  CHECKED_OUT:            { label: 'Đã trả phòng',             variant: 'neutral' },
  CANCELLED:              { label: 'Đã hủy',                   variant: 'danger' },
  NO_SHOW:                { label: 'Không đến',                variant: 'danger' },
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

function isRemainingUnpaid(booking: ManagerBookingDetail): boolean {
  if (!booking.remainingAmount || booking.remainingAmount <= 0) return false;
  return !(booking.payments ?? []).some(
    p => p.type === 'REMAINING_BALANCE' && p.status === 'PAID',
  );
}

function isDamageUnpaid(booking: ManagerBookingDetail): boolean {
  if (!booking.damageFeeAmount || booking.damageFeeAmount <= 0) return false;
  return !(booking.payments ?? []).some(
    p => p.type === 'DAMAGE_FEE' && p.status === 'PAID',
  );
}

function paymentStatusLabel(booking: ManagerBookingDetail, type: string): { status: string; variant: StatusVariant } {
  const paid = (booking.payments ?? []).some(p => p.type === type && p.status === 'PAID');
  return paid
    ? { status: 'Đã thanh toán', variant: 'success' }
    : { status: 'Chưa thanh toán', variant: 'warning' };
}

function validateIdFile(file: File | null, sideLabel: string): string | null {
  if (!file) return `Vui lòng tải ảnh ${sideLabel}.`;
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return `${sideLabel}: chỉ chấp nhận JPG/PNG.`;
  }
  if (file.size > MAX_ID_BYTES) {
    return `${sideLabel}: mỗi ảnh tối đa 5MB.`;
  }
  return null;
}

function IdUploadField({
  id,
  label,
  file,
  previewUrl,
  disabled,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  file: File | null;
  previewUrl: string | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        disabled={disabled}
        onChange={e => {
          const next = e.target.files?.[0];
          if (next) onSelect(next);
          e.target.value = '';
        }}
      />
      <div
        className="rounded-[12px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 min-h-[140px] flex flex-col items-center justify-center gap-3"
      >
        {previewUrl ? (
          <div className="relative w-full max-w-[220px]">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-36 object-cover rounded-lg border border-[#E2E8F0]"
            />
            <button
              type="button"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm"
              onClick={onClear}
              disabled={disabled}
              aria-label={`Xóa ${label}`}
            >
              ×
            </button>
            <p className="text-xs text-[#64748B] mt-2 truncate">{file?.name}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#64748B] text-center">JPG/PNG · tối đa 5MB</p>
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Chọn ảnh
            </button>
          </>
        )}
        {previewUrl && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            Thay ảnh
          </button>
        )}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-[#E2E8F0] rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6">
        <div className="h-64 bg-[#E2E8F0] rounded-[16px]" />
        <div className="h-72 bg-[#E2E8F0] rounded-[16px]" />
      </div>
    </div>
  );
}

export default function BookingCheckInOutPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isCheckIn = location.pathname.endsWith('/check-in');

  const [booking, setBooking] = useState<ManagerBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [keyHandedOver, setKeyHandedOver] = useState(false);
  const [depositCollected, setDepositCollected] = useState(false);
  const [keyReturned, setKeyReturned] = useState(false);
  const [depositRefunded, setDepositRefunded] = useState(false);
  const [note, setNote] = useState('');

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
        setLoadError('Bạn không có quyền thao tác đặt phòng này.');
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
    if (!idCardFront) {
      setFrontPreview(null);
      return;
    }
    const url = URL.createObjectURL(idCardFront);
    setFrontPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [idCardFront]);

  useEffect(() => {
    if (!idCardBack) {
      setBackPreview(null);
      return;
    }
    const url = URL.createObjectURL(idCardBack);
    setBackPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [idCardBack]);

  async function handleCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !booking) return;

    setSubmitError(null);
    const frontErr = validateIdFile(idCardFront, 'CMND/CCCD mặt trước');
    if (frontErr) { setSubmitError(frontErr); return; }
    const backErr = validateIdFile(idCardBack, 'CMND/CCCD mặt sau');
    if (backErr) { setSubmitError(backErr); return; }
    if (!keyHandedOver) {
      setSubmitError('Vui lòng xác nhận đã bàn giao chìa khóa.');
      return;
    }
    if (isRemainingUnpaid(booking) && !depositCollected) {
      setSubmitError('CHECKIN_DENIED_UNPAID: Phải thu đủ Remaining 60% tại quầy (hoặc khách trả online) trước khi Check-in.');
      return;
    }

    setSubmitting(true);
    try {
      await checkInBookingV1(id, {
        idCardFront: idCardFront!,
        idCardBack: idCardBack!,
        depositCollected: isRemainingUnpaid(booking) ? depositCollected : true,
        keyHandedOver: true,
        note: note.trim() || undefined,
      });
      navigate(`/manager/bookings/${id}`, {
        state: { toast: 'Nhận phòng thành công' },
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setSubmitError(ax?.response?.data?.message ?? 'Không thể hoàn tất nhận phòng.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOutSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !booking) return;

    setSubmitError(null);
    if (!keyReturned) {
      setSubmitError('Vui lòng xác nhận đã nhận lại chìa khóa.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await checkOutBookingV1(id, {
        keyReturned: true,
        depositRefunded,
        note: note.trim() || undefined,
      });

      const message = result.status === 'CHECKED_OUT'
        ? 'Trả phòng thành công'
        : 'Đã chuyển sang chờ kiểm tra phòng';

      navigate(`/manager/bookings/${id}`, { state: { toast: message } });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setSubmitError(ax?.response?.data?.message ?? 'Không thể hoàn tất trả phòng.');
    } finally {
      setSubmitting(false);
    }
  }

  const statusCfg = booking
    ? STATUS_VI[booking.status] ?? { label: booking.status, variant: 'neutral' as StatusVariant }
    : null;

  const title = isCheckIn ? 'Check-in Guest' : 'Check-out Guest';
  const breadcrumbAction = isCheckIn ? 'Check-in' : 'Check-out';
  const showRemainingCheckbox = Boolean(booking && isCheckIn && isRemainingUnpaid(booking));

  const checkInBlocked = Boolean(booking && isCheckIn && !booking.canCheckIn);
  const inspectionWaiting = Boolean(
    booking && !isCheckIn && booking.status === 'PENDING_INSPECTION' && !booking.canCheckOut
      && (booking.checkOutBlockedReason?.includes('kiểm tra') || booking.checkOutBlockedReason?.includes('Inspection')),
  );
  const unpaidBlocking = Boolean(
    booking && !isCheckIn && (
      isRemainingUnpaid(booking) || isDamageUnpaid(booking) || booking.status === 'PENDING_DAMAGE_PAYMENT'
    ),
  );
  const checkOutBlocked = Boolean(booking && !isCheckIn && !booking.canCheckOut);
  const checkInCanSubmit = Boolean(
    booking && !checkInBlocked && idCardFront && idCardBack && keyHandedOver
      && (!showRemainingCheckbox || depositCollected) && !submitting,
  );

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

  return (
    <ManagerLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Link to="/manager/bookings" className="text-[#0F766E] no-underline">Bookings</Link>
          <span>›</span>
          {booking && (
            <>
              <Link to={`/manager/bookings/${id}`} className="text-[#0F766E] no-underline">
                {shortBookingId(booking.id)}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="font-semibold text-[#1E293B]">{breadcrumbAction}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[28px] font-bold text-[#1E293B]">{title}</h1>
          {statusCfg && <StatusBadge status={statusCfg.label} variant={statusCfg.variant} />}
        </div>

        {submitError && (
          <Alert variant="error" message={submitError} closeable onClose={() => setSubmitError(null)} />
        )}

        {loading ? (
          <PageSkeleton />
        ) : booking && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] gap-6 items-start">
            {/* Left — Booking Summary */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-6 space-y-5">
              <h2 className="font-semibold text-[#1E293B]">Booking Summary</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#64748B]">Khách</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{booking.customerName}</p>
                  {booking.customerPhone && (
                    <p className="text-[#64748B] mt-0.5">{booking.customerPhone}</p>
                  )}
                  <p className="text-[#64748B] mt-0.5 break-all">{booking.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Phòng / Property</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{booking.roomNumber}</p>
                  <p className="text-[#64748B] mt-0.5">{booking.propertyName}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Check-in</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{formatDate(booking.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Check-out</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{formatDate(booking.checkOutDate)}</p>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Payment summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#64748B]">Deposit (40%)</p>
                      <p className="font-semibold text-[#1E293B]">{formatVnd(booking.depositAmount)}</p>
                    </div>
                    <StatusBadge {...paymentStatusLabel(booking, 'DEPOSIT')} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#64748B]">Remaining (60%)</p>
                      <p className={`font-semibold ${showRemainingCheckbox ? 'text-amber-800' : 'text-[#1E293B]'}`}>
                        {formatVnd(booking.remainingAmount)}
                      </p>
                    </div>
                    <StatusBadge {...paymentStatusLabel(booking, 'REMAINING_BALANCE')} />
                  </div>
                  {(booking.damageFeeAmount ?? 0) > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#64748B]">Damage Fee</p>
                        <p className="font-semibold text-red-600">{formatVnd(booking.damageFeeAmount)}</p>
                      </div>
                      <StatusBadge {...paymentStatusLabel(booking, 'DAMAGE_FEE')} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — Verification Form */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-6">
              <h2 className="font-semibold text-[#1E293B] mb-4">Verification</h2>

              {isCheckIn ? (
                <form onSubmit={handleCheckInSubmit} className="space-y-4">
                  {checkInBlocked && (
                    <Alert variant="warning" message="Booking không ở trạng thái cho phép nhận phòng (Confirmed + đúng/đến ngày check-in)." />
                  )}
                  {showRemainingCheckbox && (
                    <Alert
                      variant="warning"
                      message="Remaining 60% chưa PAID — phải thu tại quầy (tick bên dưới) hoặc khách trả online trước khi Confirm Check-in. Hệ thống sẽ ghi Payment Remaining = PAID."
                    />
                  )}
                  {!showRemainingCheckbox && booking && !isRemainingUnpaid(booking) && (
                    <Alert variant="info" message="Remaining 60% đã thanh toán — đủ điều kiện Check-in về mặt tiền." />
                  )}

                  <IdUploadField
                    id="id-card-front"
                    label="CMND/CCCD mặt trước"
                    file={idCardFront}
                    previewUrl={frontPreview}
                    disabled={checkInBlocked || submitting}
                    onSelect={setIdCardFront}
                    onClear={() => setIdCardFront(null)}
                  />
                  <IdUploadField
                    id="id-card-back"
                    label="CMND/CCCD mặt sau"
                    file={idCardBack}
                    previewUrl={backPreview}
                    disabled={checkInBlocked || submitting}
                    onSelect={setIdCardBack}
                    onClear={() => setIdCardBack(null)}
                  />

                  {showRemainingCheckbox && (
                    <Checkbox
                      id="deposit-collected"
                      label="Đã thu đủ Remaining Balance (60%) tại quầy — sẽ ghi nhận Payment PAID"
                      checked={depositCollected}
                      onChange={e => setDepositCollected(e.target.checked)}
                      disabled={checkInBlocked || submitting}
                    />
                  )}
                  <Checkbox
                    id="key-handed-over"
                    label="Đã bàn giao chìa khóa"
                    checked={keyHandedOver}
                    onChange={e => setKeyHandedOver(e.target.checked)}
                    disabled={checkInBlocked || submitting}
                  />

                  <div>
                    <label className="form-label" htmlFor="checkin-note">Ghi chú nội bộ (tuỳ chọn)</label>
                    <textarea
                      id="checkin-note"
                      className="input min-h-[80px]"
                      maxLength={500}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      disabled={checkInBlocked || submitting}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={!checkInCanSubmit}
                    >
                      {submitting ? 'Đang xử lý…' : 'Confirm Check-in'}
                    </button>
                    <Link to={`/manager/bookings/${id}`} className="btn-ghost no-underline">Cancel</Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCheckOutSubmit} className="space-y-4">
                  {inspectionWaiting && (
                    <Alert variant="warning" message="Waiting for room inspection — chưa thể Confirm Check-out." />
                  )}
                  {unpaidBlocking && (
                    <Alert
                      variant="error"
                      message={
                        booking.status === 'PENDING_DAMAGE_PAYMENT' || isDamageUnpaid(booking)
                          ? 'Còn khoản Damage Fee chưa thanh toán — không thể trả phòng.'
                          : 'Còn khoản Remaining chưa thanh toán — không thể trả phòng.'
                      }
                    />
                  )}
                  {checkOutBlocked && booking.checkOutBlockedReason && !inspectionWaiting && !unpaidBlocking && (
                    <Alert variant="warning" message={booking.checkOutBlockedReason} />
                  )}
                  {!checkOutBlocked && booking.status === 'PENDING_INSPECTION' && (
                    <Alert variant="info" message="Kiểm tra phòng đã PASSED. Xác nhận chìa khóa để hoàn tất trả phòng." />
                  )}
                  {!checkOutBlocked && booking.status === 'CHECKED_IN' && (
                    <Alert variant="info" message="Xác nhận sẽ chuyển booking sang chờ kiểm tra phòng (Pending Inspection)." />
                  )}

                  <Checkbox
                    id="key-returned"
                    label="Đã nhận lại chìa khóa"
                    checked={keyReturned}
                    onChange={e => setKeyReturned(e.target.checked)}
                    disabled={checkOutBlocked || submitting}
                  />
                  <Checkbox
                    id="deposit-refunded"
                    label="Đã hoàn / tất toán đúng chính sách"
                    checked={depositRefunded}
                    onChange={e => setDepositRefunded(e.target.checked)}
                    disabled={checkOutBlocked || submitting}
                  />

                  <div>
                    <label className="form-label" htmlFor="checkout-note">Ghi chú check-out (tuỳ chọn)</label>
                    <textarea
                      id="checkout-note"
                      className="input min-h-[80px]"
                      maxLength={500}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      disabled={checkOutBlocked || submitting}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={checkOutBlocked || submitting || !keyReturned}
                    >
                      {submitting ? 'Đang xử lý…' : 'Confirm Check-out'}
                    </button>
                    <Link to={`/manager/bookings/${id}`} className="btn-ghost no-underline">Cancel</Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
