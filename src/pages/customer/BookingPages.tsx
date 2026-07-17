// ─── BookingPages.tsx — SCR-17, 18, 19, 20 ──────────────────────────────────
// Exports: BookingFormPage, BookingListPage, BookingDetailPage, BookingCancellationPage

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import { fetchRoomById, checkRoomAvailability, type RoomDetail } from '../../api/roomsApi';
import { bookingApi, type BookingSummaryResponse } from '../../api/bookingApi';
import SafeImage from '../../components/ui/SafeImage';
import Pagination from '../../components/ui/Pagination';

export const formatBookingId = (uuid: string): string => {
  if (!uuid) return '';
  if (uuid.startsWith('b00') && uuid.length === 36) {
    const match = uuid.match(/^b00([0-9])0000-/);
    if (match) return `B00${match[1]}`;
  }
  return uuid.split('-')[0].toUpperCase();
};

function extractApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: Record<string, unknown>; status?: number } })?.response?.data;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error === 'string' && data.error) return data.error;
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  return fallback;
}

const BOOKINGS_MOCK = [
  { id: 'B001', roomNumber: 'Villa 01', roomType: 'Villa', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', guestCount: 2, totalAmount: 7500000, status: 'CONFIRMED', specialRequests: 'Late checkout if possible', createdAt: '2026-06-01' },
  { id: 'B002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', guestCount: 1, totalAmount: 2400000, status: 'PENDING_DEPOSIT', specialRequests: '', createdAt: '2026-06-10' },
  { id: 'B003', roomNumber: 'Suite 03', roomType: 'Suite', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', guestCount: 2, totalAmount: 5400000, status: 'CHECKED_OUT', specialRequests: '', createdAt: '2026-03-20' },
  { id: 'B004', roomNumber: 'Standard 12', roomType: 'Standard', propertyName: 'Phú Quốc Beach House', checkInDate: '2026-03-15', checkOutDate: '2026-03-17', guestCount: 1, totalAmount: 1500000, status: 'CANCELLED', specialRequests: '', createdAt: '2026-03-01' },
];

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Chờ cọc' },
    CONFIRMED:       { cls: 'badge-success', l: 'Đã xác nhận' },
    CHECKED_IN:      { cls: 'badge-info',    l: 'Đang ở' },
    CHECKED_OUT:     { cls: 'badge-purple',  l: 'Đã trả phòng' },
    CANCELLED:       { cls: 'badge-error',   l: 'Đã hủy' },
  };
  const s = m[status] || { cls: 'badge-neutral', l: status };
  return <span className={`badge ${s.cls}`}>{s.l}</span>;
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatVndList(n: number) {
  return `₫${Number(n).toLocaleString('vi-VN')}`;
}

function formatVnd(n: number) {
  return `₫${Number(n).toLocaleString('vi-VN')}`;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── SCR-17: Booking Form ────────────────────────────────────────────────────
export function BookingFormPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    checkInDate:  params.get('checkIn')  || '',
    checkOutDate: params.get('checkOut') || '',
    guestCount:   Number(params.get('guests')) || 1,
    specialRequests: '',
  });

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availChecking, setAvailChecking] = useState(false);
  const [datesAvailable, setDatesAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    async function load() {
      setRoomLoading(true);
      setRoomError('');
      try {
        const data = await fetchRoomById(roomId!);
        if (!cancelled) {
          setRoom(data);
          setForm(p => ({ ...p, guestCount: Math.min(Math.max(1, p.guestCount), data.capacity) }));
        }
      } catch {
        if (!cancelled) setRoomError('Không tải được thông tin phòng. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setRoomLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [roomId]);

  // Kiểm tra phòng trống khi đổi ngày
  useEffect(() => {
    if (!roomId || !form.checkInDate || !form.checkOutDate) {
      setDatesAvailable(null);
      return;
    }
    if (form.checkOutDate <= form.checkInDate) {
      setDatesAvailable(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setAvailChecking(true);
      try {
        const avail = await checkRoomAvailability(roomId, form.checkInDate, form.checkOutDate);
        if (!cancelled) setDatesAvailable(avail.available);
      } catch {
        if (!cancelled) setDatesAvailable(null);
      } finally {
        if (!cancelled) setAvailChecking(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [roomId, form.checkInDate, form.checkOutDate]);

  const pricePerNight = room?.pricePerNight ?? 0;
  const capacity = room?.capacity ?? 1;

  const nights = form.checkInDate && form.checkOutDate && form.checkOutDate > form.checkInDate
    ? Math.ceil((new Date(form.checkOutDate + 'T00:00:00').getTime() - new Date(form.checkInDate + 'T00:00:00').getTime()) / 86400000)
    : 0;
  const totalAmount = nights * pricePerNight;
  const depositAmount = Math.round(totalAmount * 0.4);
  const remainingAmount = totalAmount - depositAmount;

  function adjustGuests(delta: number) {
    setForm(p => ({ ...p, guestCount: Math.min(capacity, Math.max(1, p.guestCount + delta)) }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.checkInDate) e.checkInDate = 'Vui lòng chọn ngày check-in';
    if (!form.checkOutDate) e.checkOutDate = 'Vui lòng chọn ngày check-out';
    if (form.checkInDate && form.checkInDate < todayStr())
      e.checkInDate = 'Ngày check-in không được trong quá khứ';
    if (form.checkInDate && form.checkOutDate && form.checkOutDate <= form.checkInDate)
      e.checkOutDate = 'Ngày check-out phải sau ngày check-in';
    if (form.guestCount < 1) e.guestCount = 'Cần ít nhất 1 khách';
    if (form.guestCount > capacity) e.guestCount = `Tối đa ${capacity} khách`;
    if (form.specialRequests.length > 500) e.specialRequests = 'Ghi chú tối đa 500 ký tự';
    if (room && room.status !== 'AVAILABLE')
      e._ = 'Phòng hiện không khả dụng để đặt. Vui lòng chọn phòng khác.';
    if (datesAvailable === false)
      e._ = 'Phòng đã được đặt trong khoảng ngày này. Vui lòng chọn ngày khác.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const avail = await checkRoomAvailability(roomId, form.checkInDate, form.checkOutDate);
      if (!avail.available) {
        setErrors({ _: 'Phòng đã được đặt trong khoảng ngày này. Vui lòng chọn ngày khác.' });
        setDatesAvailable(false);
        return;
      }

      const res = await bookingApi.createBooking({
        roomId,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        guestCount: form.guestCount,
        specialRequests: form.specialRequests.trim() || undefined,
      });
      navigate(`/customer/payments/${res.data.id}/pay`);
    } catch (err: unknown) {
      setErrors({ _: extractApiError(err, 'Tạo booking thất bại. Vui lòng thử lại.') });
    } finally {
      setLoading(false);
    }
  }

  const primaryImage = room?.images?.find(i => i.isPrimary)?.imageUrl
    ?? room?.images?.[0]?.imageUrl
    ?? null;

  const canSubmit = !loading && nights > 0 && room?.status === 'AVAILABLE' && datesAvailable !== false;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          <Link to="/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Danh sách phòng</Link>
          {room && (
            <>
              <span>›</span>
              <Link to={`/rooms/${roomId}`} className="text-primary" style={{ textDecoration: 'none' }}>{room.roomNumber}</Link>
            </>
          )}
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>Đặt phòng</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 8 }}>Đặt phòng</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
          Chọn ngày, số khách và ghi chú — tổng tiền cập nhật theo thời gian thực.
        </p>

        {roomLoading ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p className="body-md text-charcoal">Đang tải thông tin phòng...</p>
          </div>
        ) : roomError || !room ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p className="body-md" style={{ color: 'var(--error)', marginBottom: 16 }}>{roomError || 'Không tìm thấy phòng.'}</p>
            <Link to="/rooms" className="btn-primary">Quay lại danh sách phòng</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>
            <div>
              {errors._ && <div className="alert alert-error" style={{ marginBottom: 16 }}>{errors._}</div>}
              {room.status !== 'AVAILABLE' && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  Phòng đang ở trạng thái <strong>{room.status}</strong> — không thể đặt lúc này.
                  <Link to="/rooms" className="text-primary" style={{ marginLeft: 8 }}>Chọn phòng khác →</Link>
                </div>
              )}

              {/* Phòng đã chọn */}
              <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--surface-bone)', display: 'flex', gap: 14, alignItems: 'center' }}>
                <SafeImage src={primaryImage} alt={room.roomNumber} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="body-sm text-charcoal">{room.propertyName}</p>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{room.roomNumber} — {room.roomType}</p>
                  <p className="body-sm text-charcoal">{formatVnd(pricePerNight)}/đêm · 👥 tối đa {capacity} · 📐 {room.area}m²</p>
                </div>
                <Link to="/rooms" className="btn-ghost btn-sm" style={{ flexShrink: 0 }}>Đổi phòng</Link>
              </div>

              <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <h2 className="heading-sm" style={{ marginBottom: 16 }}>Thông tin đặt phòng</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="form-label form-label-required">Ngày check-in</label>
                    <input type="date" className={`input ${errors.checkInDate ? 'input-error' : ''}`}
                      min={todayStr()}
                      value={form.checkInDate}
                      onChange={e => setForm(p => ({ ...p, checkInDate: e.target.value }))} />
                    {errors.checkInDate && <p className="form-error">{errors.checkInDate}</p>}
                  </div>
                  <div>
                    <label className="form-label form-label-required">Ngày check-out</label>
                    <input type="date" className={`input ${errors.checkOutDate ? 'input-error' : ''}`}
                      min={form.checkInDate || todayStr()}
                      value={form.checkOutDate}
                      onChange={e => setForm(p => ({ ...p, checkOutDate: e.target.value }))} />
                    {errors.checkOutDate && <p className="form-error">{errors.checkOutDate}</p>}
                  </div>
                </div>

                {form.checkInDate && form.checkOutDate && form.checkOutDate > form.checkInDate && (
                  <div style={{ marginBottom: 16 }}>
                    {availChecking ? (
                      <p className="body-sm text-charcoal">Đang kiểm tra phòng trống...</p>
                    ) : datesAvailable === true ? (
                      <p className="body-sm" style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Phòng còn trống trong khoảng ngày đã chọn</p>
                    ) : datesAvailable === false ? (
                      <p className="body-sm" style={{ color: 'var(--error)', fontWeight: 600 }}>✕ Phòng đã có người đặt — vui lòng chọn ngày khác</p>
                    ) : null}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label form-label-required">Số khách</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 200 }}>
                    <button type="button" className="btn-outline btn-sm" style={{ width: 36, padding: 0 }}
                      onClick={() => adjustGuests(-1)} disabled={form.guestCount <= 1}>−</button>
                    <input type="number" min={1} max={capacity} readOnly
                      className={`input ${errors.guestCount ? 'input-error' : ''}`}
                      style={{ textAlign: 'center' }}
                      value={form.guestCount} />
                    <button type="button" className="btn-outline btn-sm" style={{ width: 36, padding: 0 }}
                      onClick={() => adjustGuests(1)} disabled={form.guestCount >= capacity}>+</button>
                  </div>
                  {errors.guestCount && <p className="form-error">{errors.guestCount}</p>}
                  <p className="form-hint">Sức chứa tối đa: {capacity} khách</p>
                </div>

                <div>
                  <label className="form-label">Ghi chú / yêu cầu đặc biệt (tuỳ chọn)</label>
                  <textarea className={`textarea ${errors.specialRequests ? 'input-error' : ''}`} rows={4}
                    maxLength={500}
                    placeholder="VD: Phòng tầng cao, check-in muộn, yêu cầu ăn chay..."
                    value={form.specialRequests}
                    onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} />
                  {errors.specialRequests && <p className="form-error">{errors.specialRequests}</p>}
                  <p className="form-hint">{form.specialRequests.length}/500 ký tự</p>
                </div>
              </div>

              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>Quy trình đặt phòng</p>
                  <p className="body-sm">Gửi yêu cầu → thanh toán cọc 40% để xác nhận → hợp đồng được gửi qua email.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn-primary" disabled={!canSubmit}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
                </button>
                <Link to={`/rooms/${roomId}`} className="btn-ghost">Huỷ</Link>
              </div>
            </div>

            {/* Tổng tiền — sticky */}
            <div className="card-lg" style={{ padding: 22, position: 'sticky', top: 88 }}>
              <h2 className="heading-sm" style={{ marginBottom: 14 }}>Tổng tiền</h2>
              <SafeImage src={primaryImage} alt={room.roomNumber} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
              <p className="body-sm text-charcoal">{room.propertyName}</p>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 12px' }}>{room.roomNumber} — {room.roomType}</p>
              <p className="body-sm text-charcoal" style={{ marginBottom: 14 }}>{formatVnd(pricePerNight)}/đêm</p>
              <div className="divider" style={{ marginBottom: 14 }} />

              {nights > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">{formatVnd(pricePerNight)} × {nights} đêm</span>
                    <span style={{ fontWeight: 600 }}>{formatVnd(totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="body-sm text-charcoal">Số khách</span>
                    <span style={{ fontWeight: 600 }}>{form.guestCount}</span>
                  </div>
                  <div className="divider" style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700 }}>Tổng cộng</span>
                    <span className="heading-sm" style={{ fontWeight: 800, color: 'var(--ink)' }}>{formatVnd(totalAmount)}</span>
                  </div>
                  <div style={{ background: 'rgba(15,118,110,0.08)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>Cọc (40%)</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatVnd(depositAmount)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="body-sm text-charcoal">Còn lại (60%)</span>
                    <span style={{ fontWeight: 600 }}>{formatVnd(remainingAmount)}</span>
                  </div>
                  <p className="body-sm text-charcoal" style={{ marginTop: 12, fontSize: 12 }}>
                    Thanh toán cọc ngay sau khi xác nhận để giữ phòng.
                  </p>
                </>
              ) : (
                <p className="body-sm text-charcoal" style={{ textAlign: 'center', padding: '20px 0' }}>
                  Chọn ngày check-in và check-out để xem tổng tiền
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </CustomerLayout>
  );
}

// ── SCR-18: Booking List ────────────────────────────────────────────────────
const BOOKING_STATUS_TABS = ['ALL', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const;
const BOOKING_STATUS_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  PENDING_DEPOSIT: 'Chờ cọc',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang ở',
  CHECKED_OUT: 'Đã trả phòng',
  CANCELLED: 'Đã hủy',
};
const PAGE_SIZE = 10;

export function BookingListPage() {
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await bookingApi.getAllBookings({
          page,
          size: PAGE_SIZE,
          sort: 'createdAt,desc',
          ...(filter !== 'ALL' ? { status: filter } : {}),
        });
        if (!cancelled) {
          setBookings(res.data.content ?? []);
          setTotalElements(res.data.totalElements ?? 0);
          setTotalPages(res.data.totalPages ?? 0);
        }
      } catch {
        if (!cancelled) setError('Không tải được danh sách booking. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filter, page]);

  function handleFilterChange(tab: string) {
    setFilter(tab);
    setPage(0);
  }

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: 4 }}>Lịch sử đặt phòng</h1>
          <p className="body-md text-charcoal">Xem và quản lý tất cả booking của bạn</p>
        </div>
        <Link to="/rooms" className="btn-primary btn-sm">+ Đặt phòng mới</Link>
      </div>

      {/* Filter trạng thái */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {BOOKING_STATUS_TABS.map(tab => (
          <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => handleFilterChange(tab)}>
            {BOOKING_STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <p className="body-md text-charcoal">Đang tải...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>
            {filter === 'ALL' ? 'Chưa có booking nào' : `Không có booking "${BOOKING_STATUS_LABELS[filter]}"`}
          </h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>
            {filter === 'ALL' ? 'Khám phá homestay & resort để bắt đầu!' : 'Thử chọn trạng thái khác.'}
          </p>
          <Link to="/rooms" className="btn-primary">Tìm phòng</Link>
        </div>
      ) : (
        <>
          <p className="body-sm text-charcoal" style={{ marginBottom: 12 }}>
            Hiển thị {from}–{to} / {totalElements} booking
          </p>

          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-bone)', borderBottom: '1px solid var(--hairline)' }}>
                    {['Phòng', 'Homestay', 'Ngày ở', 'Khách', 'Tổng tiền', 'Trạng thái', ''].map(h => (
                      <th key={h || 'actions'} className="body-sm text-charcoal" style={{
                        padding: '12px 16px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{b.roomNumber}</div>
                        <div className="body-sm text-charcoal">{b.roomType}</div>
                      </td>
                      <td className="body-sm text-charcoal" style={{ padding: '14px 16px', maxWidth: 180 }}>
                        {b.propertyName}
                      </td>
                      <td className="body-sm" style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </td>
                      <td className="body-sm" style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {b.guestCount}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatVndList(b.totalAmount)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={b.status} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {b.status === 'PENDING_DEPOSIT' && (
                            <Link to={`/customer/payments/${b.id}/pay`} className="btn-primary btn-sm">Thanh toán cọc</Link>
                          )}
                          {b.status === 'CHECKED_OUT' && !b.isReviewed && (
                            <Link to={`/customer/reviews/create?bookingId=${b.id}`} className="btn-outline btn-sm">Đánh giá</Link>
                          )}
                          <Link to={`/customer/bookings/${b.id}`} className="btn-outline btn-sm">Chi tiết</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </CustomerLayout>
  );
}

// ── SCR-19: Booking Detail ────────────────────────────────────────────────────
const STATUS_BANNER: Record<string, { bg: string; border: string; icon: string; title: string }> = {
  PENDING_DEPOSIT: { bg: '#fff7ed', border: '#fed7aa', icon: '⏳', title: 'Chờ thanh toán cọc' },
  CONFIRMED:       { bg: '#f0fdf4', border: '#bbf7d0', icon: '✓',  title: 'Đã xác nhận' },
  CHECKED_IN:      { bg: '#eff6ff', border: '#bfdbfe', icon: '🏠', title: 'Đang lưu trú' },
  CHECKED_OUT:     { bg: '#f5f3ff', border: '#ddd6fe', icon: '👋', title: 'Đã trả phòng' },
  CANCELLED:       { bg: '#fef2f2', border: '#fecaca', icon: '✕',  title: 'Đã hủy' },
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
};

function bookingCode(id: string) {
  return id.substring(0, 8).toUpperCase();
}

function paymentBadgeCls(status: string) {
  if (status === 'PAID') return 'badge-success';
  if (status === 'FAILED') return 'badge-error';
  return 'badge-warning';
}

export function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<import('../../api/bookingApi').BookingDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoadingDetail(true);
    setDetailError('');
    bookingApi.getMyBookingDetail(id)
      .then(res => setBooking(res.data))
      .catch((err) => setDetailError(extractApiError(err, 'Không tải được thông tin booking.')))
      .finally(() => setLoadingDetail(false));
  }, [id]);

  if (loadingDetail) {
    return (
      <CustomerLayout>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <p className="body-md text-charcoal">Đang tải...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (detailError || !booking) {
    return (
      <CustomerLayout>
        <div style={{ margin: 24 }}>
          <Alert variant="error" message={detailError || 'Không tìm thấy booking.'} />
          <Link to="/customer/bookings" className="btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
            ← Quay lại danh sách
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOutDate + 'T00:00:00').getTime() - new Date(booking.checkInDate + 'T00:00:00').getTime()) / 86400000
  );
  const depositAmount = Number(booking.depositAmount);
  const remainingAmount = Number(booking.remainingAmount);
  const payments = booking.payments ?? [];

  const depositPayment = payments.find(p => p.type === 'DEPOSIT');
  const remainingPayment = payments.find(p => p.type === 'REMAINING_BALANCE');

  const depositPaid = depositPayment?.status === 'PAID' || booking.status !== 'PENDING_DEPOSIT';
  const remainingPaid = remainingPayment?.status === 'PAID';

  const depositDisplayStatus = depositPayment?.status ?? (depositPaid ? 'PAID' : 'PENDING');
  const remainingDisplayStatus = remainingPayment?.status ?? (remainingPaid ? 'PAID' : 'PENDING');

  const canCancel = ['PENDING_DEPOSIT', 'CONFIRMED'].includes(booking.status);
  const showPayDeposit = booking.status === 'PENDING_DEPOSIT';
  const showPayRemaining = booking.status === 'CONFIRMED' && !remainingPaid;

  const banner = STATUS_BANNER[booking.status] ?? STATUS_BANNER.PENDING_DEPOSIT;

  return (
    <CustomerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/customer/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Lịch sử đặt phòng</Link>
        <span>›</span>
        <span className="text-ink" style={{ fontWeight: 600 }}>#{bookingCode(booking.id)}</span>
      </div>

      {/* Status banner */}
      <div style={{
        background: banner.bg, border: `1px solid ${banner.border}`, borderRadius: 12,
        padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 28 }}>{banner.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{banner.title}</p>
          <p className="body-sm text-charcoal">
            Booking #{bookingCode(booking.id)} · Tạo ngày {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Thông tin booking */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Thông tin đặt phòng</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Phòng', value: `${booking.roomNumber} — ${booking.roomType}` },
                { label: 'Homestay / Resort', value: booking.propertyName },
                { label: 'Check-in', value: formatDate(booking.checkInDate) },
                { label: 'Check-out', value: formatDate(booking.checkOutDate) },
                { label: 'Số đêm', value: `${nights} đêm` },
                { label: 'Số khách', value: `${booking.guestCount} khách` },
              ].map(item => (
                <div key={item.label}>
                  <p className="body-sm text-charcoal">{item.label}</p>
                  <p style={{ fontWeight: 600, marginTop: 2 }}>{item.value}</p>
                </div>
              ))}
            </div>
            {booking.specialRequests && (
              <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p className="body-sm text-charcoal">Ghi chú / yêu cầu</p>
                <p className="body-md" style={{ marginTop: 2 }}>{booking.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Thanh toán */}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Trạng thái thanh toán</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: depositPaid ? '#f0fdf4' : 'var(--surface-bone)', borderRadius: 10,
                border: `1px solid ${depositPaid ? '#bbf7d0' : 'var(--hairline)'}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: depositPaid ? '#2b9a66' : 'var(--stone)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {depositPaid ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>1</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Cọc (40%)</p>
                  <p className="body-sm text-charcoal">{formatVndList(depositAmount)}</p>
                  {depositPayment?.paidAt && (
                    <p className="body-sm text-charcoal" style={{ fontSize: 11 }}>
                      Thanh toán: {new Date(depositPayment.paidAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <span className={`badge ${paymentBadgeCls(depositDisplayStatus)}`}>
                  {PAYMENT_STATUS_LABEL[depositDisplayStatus] ?? depositDisplayStatus}
                </span>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: remainingPaid ? '#f0fdf4' : 'var(--surface-bone)', borderRadius: 10,
                border: `1px solid ${remainingPaid ? '#bbf7d0' : 'var(--hairline)'}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: remainingPaid ? '#2b9a66' : 'var(--stone)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {remainingPaid ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>2</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Phần còn lại (60%)</p>
                  <p className="body-sm text-charcoal">{formatVndList(remainingAmount)}</p>
                  {remainingPayment?.paidAt && (
                    <p className="body-sm text-charcoal" style={{ fontSize: 11 }}>
                      Thanh toán: {new Date(remainingPayment.paidAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <span className={`badge ${paymentBadgeCls(remainingDisplayStatus)}`}>
                  {PAYMENT_STATUS_LABEL[remainingDisplayStatus] ?? remainingDisplayStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions panel */}
        <div>
          <div className="card-lg" style={{ padding: 24, marginBottom: 16 }}>
            <h3 className="heading-sm" style={{ marginBottom: 16 }}>Tổng tiền</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">Giá phòng × {nights} đêm</span>
              <span style={{ fontWeight: 600 }}>{formatVndList(booking.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="body-sm text-charcoal">Cọc (40%)</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatVndList(depositAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">Còn lại (60%)</span>
              <span style={{ fontWeight: 600 }}>{formatVndList(remainingAmount)}</span>
            </div>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700 }}>Tổng cộng</span>
              <span style={{ fontWeight: 800, fontSize: 18 }}>{formatVndList(booking.totalAmount)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {showPayDeposit && (
                <Link to={`/customer/payments/${booking.id}/pay`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Thanh toán cọc ({formatVndList(depositAmount)})
                </Link>
              )}
              {showPayRemaining && (
                <Link to={`/customer/payments/${booking.id}/remaining`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Thanh toán phần còn lại ({formatVndList(remainingAmount)})
                </Link>
              )}
              {booking.status === 'CHECKED_OUT' && !booking.isReviewed && (
                <Link to={`/customer/reviews/create?bookingId=${booking.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  ⭐ Viết đánh giá
                </Link>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to={`/customer/contracts?bookingId=${booking.id}`} className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              Xem hợp đồng
            </Link>
            {canCancel && (
              <Link to={`/customer/bookings/${booking.id}/cancel`} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--error)', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Hủy booking
              </Link>
            )}
          </div>

          {showPayDeposit && (
            <div style={{ marginTop: 16 }}>
              <Alert
                variant="warning"
                message="Vui lòng thanh toán cọc trong thời gian quy định để giữ phòng."
              />
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-19: Booking Cancellation ─────────────────────────────────────────────
const NON_CANCELLABLE_STATUSES = new Set(['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']);

export function BookingCancellationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<import('../../api/bookingApi').BookingDetailResponse | null>(null);
  const [preview, setPreview] = useState<import('../../api/bookingApi').CancellationPreview | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoadingDetail(true);
    setDetailError('');
    setPreviewError('');
    Promise.all([
      bookingApi.getMyBookingDetail(id),
      bookingApi.getCancellationPreview(id).catch((err) => {
        setPreviewError(extractApiError(err, 'Không tải được chính sách hủy.'));
        return null;
      }),
    ])
      .then(([bookingRes, previewRes]) => {
        setBooking(bookingRes.data);
        if (previewRes) setPreview(previewRes.data);
      })
      .catch((err) => setDetailError(extractApiError(err, 'Không tải được thông tin booking.')))
      .finally(() => setLoadingDetail(false));
  }, [id]);

  async function handleCancel() {
    if (!id) return;
    setLoading(true);
    setCancelError('');
    try {
      await bookingApi.cancelMyBooking(id);
      navigate('/customer/bookings');
    } catch (err: unknown) {
      setCancelError(extractApiError(err, 'Hủy booking thất bại.'));
      setLoading(false);
    }
  }

  if (loadingDetail) {
    return (
      <CustomerLayout>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <p className="body-md text-charcoal">Đang tải...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (detailError || !booking) {
    return (
      <CustomerLayout>
        <div style={{ margin: 24 }}>
          <Alert variant="error" message={detailError || 'Không tìm thấy booking.'} />
          <Link to="/customer/bookings" className="btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
            ← Quay lại danh sách
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  if (NON_CANCELLABLE_STATUSES.has(booking.status)) {
    return (
      <CustomerLayout>
        <div style={{ margin: 24, maxWidth: 560 }}>
          <Alert variant="error" message="Booking không thể hủy ở trạng thái hiện tại." />
          <Link to={`/customer/bookings/${id}`} className="btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
            ← Quay lại chi tiết booking
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const refundPercent = preview?.refundPercent ?? 0;
  const policyVariant = refundPercent === 0 ? 'error' : refundPercent < 100 ? 'warning' : 'info';

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={`/customer/bookings/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>
            Booking #{bookingCode(booking.id)}
          </Link>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>Hủy đặt phòng</span>
        </div>

        <div className="card-lg" style={{ padding: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>

          <h1 className="heading-md" style={{ marginBottom: 8 }}>Hủy đặt phòng</h1>
          <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>
            Bạn sắp hủy đặt phòng <strong>{booking.roomNumber}</strong> tại {booking.propertyName}.
          </p>

          <div style={{ background: 'var(--surface-bone)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">Check-in / Check-out</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-charcoal">Còn lại đến check-in</span>
              <span style={{ fontWeight: 600 }}>{preview?.daysUntilCheckIn ?? '—'} ngày</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="body-sm text-charcoal">Tổng tiền</span>
              <span style={{ fontWeight: 600 }}>{formatVndList(booking.totalAmount)}</span>
            </div>
          </div>

          {previewError && (
            <div style={{ marginBottom: 16 }}>
              <Alert variant="error" message={previewError} />
            </div>
          )}

          {preview && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant={policyVariant} message={preview.policyText} />
              <p className="body-sm" style={{ marginTop: 12, fontWeight: 600 }}>
                Số tiền hoàn dự kiến: {formatVndList(preview.refundAmount)}
                {preview.forfeitAmount > 0 && (
                  <span className="text-charcoal" style={{ fontWeight: 400 }}>
                    {' '}(khấu trừ {formatVndList(preview.forfeitAmount)})
                  </span>
                )}
              </p>
            </div>
          )}

          {cancelError && (
            <div style={{ marginBottom: 16 }}>
              <Alert variant="error" message={cancelError} closeable onClose={() => setCancelError('')} />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--error)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
            />
            <span className="body-sm">
              Tôi hiểu hành động này không thể hoàn tác
              {preview && preview.refundPercent < 100
                ? preview.refundPercent === 0
                  ? ' và tiền cọc sẽ không được hoàn trả'
                  : ` và chỉ được hoàn ${preview.refundPercent}% tiền cọc`
                : ''}
              .
            </span>
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn-danger"
              style={{ flex: 1 }}
              onClick={handleCancel}
              disabled={!confirmed || loading || !!previewError}
            >
              {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
            </button>
            <Link to={`/customer/bookings/${id}`} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              Giữ lại
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
