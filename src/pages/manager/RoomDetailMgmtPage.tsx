import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import {
  fetchRoomById,
  fetchRoomBookings,
  RoomDetail,
  RoomBookingSummary,
} from '../../api/roomsApi';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROOM_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE:       { label: 'Available',       color: '#fff',    bg: '#2b9a66' },
  PENDING_DEPOSIT: { label: 'Pending Deposit', color: '#202020', bg: '#F59E0B' },
  RESERVED:        { label: 'Reserved',        color: '#fff',    bg: '#2563EB' },
  OCCUPIED:        { label: 'Occupied',        color: '#fff',    bg: '#DC2626' },
  MAINTENANCE:     { label: 'Maintenance',     color: '#fff',    bg: '#6B7280' },
};

const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_DEPOSIT: { label: 'Pending Deposit', color: '#202020', bg: '#FEF3C7' },
  CONFIRMED:       { label: 'Confirmed',       color: '#fff',    bg: '#2b9a66' },
  CHECKED_IN:      { label: 'Checked In',      color: '#fff',    bg: '#2563EB' },
  CHECKED_OUT:     { label: 'Checked Out',     color: '#fff',    bg: '#7C3AED' },
  CANCELLED:       { label: 'Cancelled',       color: '#fff',    bg: '#DC2626' },
};

const ACTIVE_BOOKING_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'PENDING_DEPOSIT']);

function fmt(n: number) {
  return '₫' + n.toLocaleString('vi-VN');
}

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoomStatusBadge({ status, large = false }: { status: string; large?: boolean }) {
  const s = ROOM_STATUS[status] || { label: status, color: '#fff', bg: '#6B7280' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: s.bg,
        color: s.color,
        borderRadius: 9999,
        padding: large ? '8px 20px' : '4px 12px',
        fontSize: large ? 16 : 13,
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const s = BOOKING_STATUS[status] || { label: status, color: '#fff', bg: '#6B7280' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: s.bg,
        color: s.color,
        borderRadius: 9999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 0',
        borderBottom: '1px solid var(--hairline)',
        gap: 12,
      }}
    >
      <span className="body-sm" style={{ color: 'var(--charcoal)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function CardBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={{ padding: 24, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="heading-sm" style={{ marginBottom: 16 }}>{children}</h2>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function PageSkeleton() {
  const pulse = {
    background: 'var(--surface-bone)',
    borderRadius: 8,
    animation: 'pulse 1.4s ease-in-out infinite',
  } as React.CSSProperties;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ ...pulse, height: 20, width: '40%', marginBottom: 16 }} />
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ ...pulse, height: 14, width: '30%' }} />
              <div style={{ ...pulse, height: 14, width: '25%' }} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ ...pulse, height: 20, width: '30%', marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...pulse, height: 120, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div style={{ ...pulse, height: 16, width: '60%', marginBottom: 12 }} />
            <div style={{ ...pulse, height: 36, borderRadius: 9999 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gallery Card ───────────────────────────────────────────────────────────────

function GalleryCard({ room }: { room: RoomDetail }) {
  const images = (room.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <CardBox>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SectionTitle>Gallery</SectionTitle>
        <Link
          to={`/manager/rooms/${room.id}/gallery`}
          className="btn-ghost btn-sm"
        >
          Manage Gallery →
        </Link>
      </div>

      {images.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-bone)',
            borderRadius: 10,
            padding: '32px 20px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🖼️</span>
          <p className="body-sm" style={{ color: 'var(--charcoal)', marginBottom: 8 }}>
            No images uploaded yet
          </p>
          <Link to={`/manager/rooms/${room.id}/gallery`} className="btn-outline btn-sm">
            + Upload Images
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {images.slice(0, 6).map(img => (
            <div
              key={img.id}
              style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1' }}
            >
              <img
                src={img.imageUrl}
                alt="Room"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop';
                }}
              />
              {img.isPrimary && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    letterSpacing: 0.5,
                  }}
                >
                  PRIMARY
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 6 && (
        <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 10, textAlign: 'right' }}>
          +{images.length - 6} more · <Link to={`/manager/rooms/${room.id}/gallery`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>Manage all</Link>
        </p>
      )}
    </CardBox>
  );
}

// ── Active Booking Banner ──────────────────────────────────────────────────────

function ActiveBookingBanner({ booking }: { booking: RoomBookingSummary }) {
  return (
    <div
      style={{
        background: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
      <div>
        <p style={{ fontWeight: 700, color: '#92400E', fontSize: 14, marginBottom: 2 }}>
          Active Booking — {booking.customerName}
        </p>
        <p className="body-sm" style={{ color: '#92400E' }}>
          {fmtDate(booking.checkInDate)} → {fmtDate(booking.checkOutDate)} ·{' '}
          <BookingStatusBadge status={booking.status} />
        </p>
        <Link
          to={`/manager/bookings/${booking.id}`}
          style={{ color: '#92400E', fontSize: 13, fontWeight: 600, textDecoration: 'underline', marginTop: 4, display: 'inline-block' }}
        >
          View Booking →
        </Link>
      </div>
    </div>
  );
}

// ── Booking History Table ──────────────────────────────────────────────────────

interface BookingHistoryProps {
  roomId: string;
  bookings: RoomBookingSummary[];
  total: number;
  page: number;
  loading: boolean;
  onPageChange: (p: number) => void;
}

function BookingHistoryCard({ roomId: _roomId, bookings, total, page, loading, onPageChange }: BookingHistoryProps) {
  const totalPages = Math.ceil(total / 5);

  const activeBooking = bookings.find(b => ACTIVE_BOOKING_STATUSES.has(b.status));

  return (
    <CardBox>
      <SectionTitle>Booking History</SectionTitle>

      {activeBooking && <ActiveBookingBanner booking={activeBooking} />}

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--charcoal)' }}>
          <div className="spinner" style={{ margin: '0 auto 8px' }} />
          Loading bookings…
        </div>
      ) : bookings.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-bone)',
            borderRadius: 10,
            padding: '32px 20px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📋</span>
          <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
            No bookings yet for this room
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{b.customerName}</p>
                      <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{b.customerEmail}</p>
                    </td>
                    <td className="body-sm">{fmtDate(b.checkInDate)}</td>
                    <td className="body-sm">{fmtDate(b.checkOutDate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(b.totalAmount)}</td>
                    <td><BookingStatusBadge status={b.status} /></td>
                    <td>
                      <Link to={`/manager/bookings/${b.id}`} className="btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 16,
              }}
            >
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
                {total} booking{total !== 1 ? 's' : ''} total
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn-ghost btn-sm"
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                >
                  ← Prev
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--charcoal)' }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="btn-ghost btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </CardBox>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RoomDetailMgmtPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Room detail state
  const [room, setRoom]       = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // ── Booking history state
  const [bookings, setBookings]             = useState<RoomBookingSummary[]>([]);
  const [bookingsTotal, setBookingsTotal]   = useState(0);
  const [bookingPage, setBookingPage]       = useState(0);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ── Load room detail ──────────────────────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchRoomById(id);
      setRoom(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setError('Room not found. It may have been deleted.');
      } else {
        setError(err?.response?.data?.message ?? 'Failed to load room. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Load booking history ──────────────────────────────────────────────────────
  const loadBookings = useCallback(async (page: number) => {
    if (!id) return;
    setBookingsLoading(true);
    try {
      const data = await fetchRoomBookings(id, page, 5);
      setBookings(data.content ?? []);
      setBookingsTotal(data.totalElements ?? 0);
    } catch {
      // Non-critical — room detail still shows
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  useEffect(() => {
    if (room) loadBookings(bookingPage);
  }, [room, bookingPage, loadBookings]);

  // ── Error / Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ManagerLayout>
        {/* Breadcrumb skeleton */}
        <div style={{ height: 20, width: 200, background: 'var(--surface-bone)', borderRadius: 6, marginBottom: 24, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <PageSkeleton />
      </ManagerLayout>
    );
  }

  if (error || !room) {
    return (
      <ManagerLayout>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
          <span>›</span>
          <span>Room Detail</span>
        </div>
        <div
          className="card"
          style={{
            padding: 48,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h2 className="heading-sm">{error || 'Room not found'}</h2>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn-primary" onClick={loadRoom}>Retry</button>
            <Link to="/manager/rooms" className="btn-outline">Back to Rooms</Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const primaryImage = room.images?.find(img => img.isPrimary) ?? room.images?.[0];
  const roomStatusConfig = ROOM_STATUS[room.status] ?? { label: room.status, color: '#fff', bg: '#6B7280' };
  const isOccupied = ['OCCUPIED', 'CHECKED_IN', 'RESERVED', 'PENDING_DEPOSIT'].includes(room.status);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <ManagerLayout>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 body-sm" style={{ marginBottom: 20, color: 'var(--charcoal)' }}>
        <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
        <span style={{ color: 'var(--stone)' }}>›</span>
        {room.propertyName && (
          <>
            <span style={{ color: 'var(--charcoal)' }}>{room.propertyName}</span>
            <span style={{ color: 'var(--stone)' }}>›</span>
          </>
        )}
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{room.roomNumber}</span>
      </div>

      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className="heading-md" style={{ marginBottom: 6 }}>
            {room.roomNumber}
            <span style={{ color: 'var(--charcoal)', fontWeight: 400, marginLeft: 8 }}>— {room.roomType}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <RoomStatusBadge status={room.status} />
            {room.averageRating > 0 && (
              <span className="body-sm" style={{ color: 'var(--charcoal)' }}>
                ⭐ {room.averageRating.toFixed(1)} ({room.totalReviews} review{room.totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        {/* Header action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to={`/manager/rooms/${room.id}/edit`} className="btn-primary btn-sm">
            ✏️ Edit Room
          </Link>
          <Link to={`/manager/rooms/${room.id}/gallery`} className="btn-outline btn-sm">
            🖼️ Gallery
          </Link>
          <Link to={`/manager/rooms/${room.id}/status`} className="btn-ghost btn-sm">
            🔄 Status
          </Link>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Primary hero image */}
          {primaryImage && (
            <div style={{ borderRadius: 14, overflow: 'hidden', height: 280, background: 'var(--surface-bone)' }}>
              <img
                src={primaryImage.imageUrl}
                alt={room.roomNumber}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=400&fit=crop';
                }}
              />
            </div>
          )}

          {/* Room Profile Card */}
          <CardBox>
            <SectionTitle>Room Profile</SectionTitle>
            <InfoRow label="Property" value={room.propertyName} />
            <InfoRow label="Address"  value={room.propertyAddress || '—'} />
            <InfoRow label="Floor"    value={`Floor ${room.floorNumber}`} />
            <InfoRow label="Type"     value={room.roomType} />
            <InfoRow label="Capacity" value={`${room.capacity} guests`} />
            <InfoRow label="Area"     value={`${room.area} m²`} />
            <InfoRow label="Price / Night" value={
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {fmt(room.pricePerNight)}
              </span>
            } />

            {room.description && (
              <div style={{ marginTop: 16 }}>
                <p className="body-sm" style={{ color: 'var(--charcoal)', marginBottom: 6 }}>Description</p>
                <p className="body-md" style={{ color: 'var(--body)', lineHeight: 1.6 }}>{room.description}</p>
              </div>
            )}

            {room.amenities && room.amenities.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p className="body-sm" style={{ color: 'var(--charcoal)', marginBottom: 8 }}>Amenities</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {room.amenities.map(a => (
                    <span
                      key={a}
                      style={{
                        background: 'var(--surface-bone)',
                        borderRadius: 9999,
                        padding: '3px 10px',
                        fontSize: 12,
                        color: 'var(--charcoal)',
                        fontWeight: 500,
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardBox>

          {/* Gallery Card */}
          <GalleryCard room={room} />

          {/* Booking History */}
          <BookingHistoryCard
            roomId={room.id}
            bookings={bookings}
            total={bookingsTotal}
            page={bookingPage}
            loading={bookingsLoading}
            onPageChange={p => setBookingPage(p)}
          />
        </div>

        {/* ── RIGHT COLUMN (sticky) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>

          {/* Status Card */}
          <CardBox>
            <p className="body-sm" style={{ color: 'var(--charcoal)', marginBottom: 12 }}>Current Status</p>
            <div style={{ marginBottom: 16 }}>
              <RoomStatusBadge status={room.status} large />
            </div>

            {isOccupied && (
              <div
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 14,
                }}
              >
                <p className="body-sm" style={{ color: '#92400E' }}>
                  ⚠️ Room is currently in use
                </p>
              </div>
            )}

            <Link
              to={`/manager/rooms/${room.id}/status`}
              className="btn-outline"
              style={{ display: 'block', textAlign: 'center', width: '100%' }}
            >
              Update Status
            </Link>
          </CardBox>

          {/* Room Stats */}
          <CardBox>
            <p className="body-sm" style={{ color: 'var(--charcoal)', marginBottom: 14 }}>Room Stats</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Total Bookings</span>
                <span style={{ fontWeight: 700 }}>{bookingsTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Reviews</span>
                <span style={{ fontWeight: 700 }}>{room.totalReviews ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Avg Rating</span>
                <span style={{ fontWeight: 700 }}>
                  {room.averageRating > 0 ? `⭐ ${room.averageRating.toFixed(1)}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Images</span>
                <span style={{ fontWeight: 700 }}>{room.images?.length ?? 0}</span>
              </div>
            </div>
          </CardBox>

          {/* Actions Card */}
          <CardBox>
            <p className="body-sm" style={{ color: 'var(--charcoal)', marginBottom: 14 }}>Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                to={`/manager/rooms/${room.id}/edit`}
                className="btn-primary"
                style={{ display: 'block', textAlign: 'center' }}
              >
                ✏️ Edit Room
              </Link>
              <Link
                to={`/manager/rooms/${room.id}/gallery`}
                className="btn-outline"
                style={{ display: 'block', textAlign: 'center' }}
              >
                🖼️ Manage Gallery
              </Link>
              <Link
                to={`/manager/rooms/${room.id}/status`}
                className="btn-ghost"
                style={{ display: 'block', textAlign: 'center' }}
              >
                🔄 Update Status
              </Link>
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 8, marginTop: 4 }}>
                <button
                  className="btn-ghost btn-sm"
                  style={{ width: '100%', color: 'var(--charcoal)' }}
                  onClick={() => navigate(-1)}
                >
                  ← Back
                </button>
              </div>
            </div>
          </CardBox>

          {/* Meta info */}
          <div style={{ padding: '8px 0' }}>
            <p className="body-sm" style={{ color: 'var(--stone)' }}>
              Room ID: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{room.id.slice(0, 8)}…</span>
            </p>
            {room.createdAt && (
              <p className="body-sm" style={{ color: 'var(--stone)', marginTop: 4 }}>
                Created: {new Date(room.createdAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
