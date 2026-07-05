import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { fetchRoomById, fetchRoomCalendar, type RoomDetail, type BookedRange } from '../../api/roomsApi';

// Expand a date range [checkIn, checkOut) into a Set of 'YYYY-MM-DD' strings
function expandRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const cur = new Date(checkIn);
  const end = new Date(checkOut);
  while (cur < end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function buildDateSets(bookedRanges: BookedRange[]) {
  const occupied = new Set<string>();
  const pending = new Set<string>();
  for (const r of bookedRanges) {
    const dates = expandRange(r.checkIn, r.checkOut);
    if (r.bookingStatus === 'PENDING_DEPOSIT') {
      dates.forEach((d) => pending.add(d));
    } else {
      dates.forEach((d) => occupied.add(d));
    }
  }
  return { occupied, pending };
}

function CalendarMonth({
  year, month, selectedRange, onDateClick, occupiedDates, pendingDates,
}: {
  year: number; month: number;
  selectedRange: { start: string; end: string };
  onDateClick: (date: string) => void;
  occupiedDates: Set<string>;
  pendingDates: Set<string>;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function getKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function getCellStyle(day: number | null) {
    if (!day) return {};
    const key = getKey(day);
    const isPast = new Date(key) < new Date(new Date().toISOString().slice(0, 10));
    const isOccupied = occupiedDates.has(key);
    const isPending = pendingDates.has(key);
    const isStart = key === selectedRange.start;
    const isEnd = key === selectedRange.end;
    const inRange =
      selectedRange.start && selectedRange.end && key > selectedRange.start && key < selectedRange.end;
    if (isPast)     return { background: 'transparent', color: 'var(--stone)', cursor: 'default' };
    if (isOccupied) return { background: '#fee2e2', color: '#dc2626', cursor: 'not-allowed' };
    if (isPending)  return { background: '#fef3c7', color: '#d97706', cursor: 'not-allowed' };
    if (isStart || isEnd) return { background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, borderRadius: 8 };
    if (inRange)    return { background: 'rgba(15,118,110,0.12)', color: 'var(--primary)', cursor: 'pointer' };
    return { background: '#dcfce7', color: '#2b9a66', cursor: 'pointer' };
  }

  function handleClick(day: number | null) {
    if (!day) return;
    const key = getKey(day);
    const isPast = new Date(key) < new Date(new Date().toISOString().slice(0, 10));
    if (isPast || occupiedDates.has(key) || pendingDates.has(key)) return;
    onDateClick(key);
  }

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 12, fontSize: 15 }}>{MONTHS[month]} {year}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            onClick={() => handleClick(day)}
            style={{ textAlign: 'center', fontSize: 13, padding: '7px 4px', borderRadius: 8, transition: 'all 0.1s', ...getCellStyle(day) }}
          >
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AvailabilityCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState({ start: '', end: '' });

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const nextMonth = (thisMonth + 1) % 12;
  const nextYear = nextMonth === 0 ? thisYear + 1 : thisYear;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [roomData, calendarData] = await Promise.all([
          fetchRoomById(id!),
          fetchRoomCalendar(id!),
        ]);
        if (cancelled) return;
        setRoom(roomData);
        const { occupied, pending } = buildDateSets(calendarData.bookedRanges);
        setOccupiedDates(occupied);
        setPendingDates(pending);
      } catch {
        if (!cancelled) setError('Không thể tải dữ liệu phòng. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  function handleDateClick(date: string) {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: date, end: '' });
    } else {
      if (date < range.start) setRange({ start: date, end: range.start });
      else setRange({ start: range.start, end: date });
    }
  }

  const nights =
    range.start && range.end
      ? Math.ceil((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000)
      : 0;

  const pricePerNight = room?.pricePerNight ?? 0;
  const isAvailable = room?.status === 'AVAILABLE';

  if (loading) {
    return (
      <PublicLayout>
        <div className="container-wide" style={{ paddingTop: 64, textAlign: 'center' }}>
          <div className="card" style={{ padding: 48, display: 'inline-block' }}>
            <p className="body-md text-charcoal">Đang tải lịch trống...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !room) {
    return (
      <PublicLayout>
        <div className="container-wide" style={{ paddingTop: 64, textAlign: 'center' }}>
          <div className="card" style={{ padding: 48 }}>
            <p className="body-md" style={{ color: 'var(--error)', marginBottom: 16 }}>{error || 'Không tìm thấy phòng.'}</p>
            <Link to="/rooms" className="btn-primary">Quay lại danh sách phòng</Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container-wide" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 24 }}>
          <Link to="/" className="text-primary" style={{ textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
          <span>›</span>
          <Link to={`/rooms/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>{room.roomNumber}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Availability</span>
        </div>

        {/* Room info bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="heading-md">{room.roomNumber} — Availability Calendar</h1>
            <p className="body-sm text-charcoal">{room.propertyName}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div><p className="body-sm text-charcoal">Type</p><p style={{ fontWeight: 600 }}>{room.roomType}</p></div>
            <div><p className="body-sm text-charcoal">Capacity</p><p style={{ fontWeight: 600 }}>{room.capacity} guests</p></div>
            <div><p className="body-sm text-charcoal">Area</p><p style={{ fontWeight: 600 }}>{room.area}m²</p></div>
            <div>
              <p className="body-sm text-charcoal">Price</p>
              <p className="text-primary" style={{ fontWeight: 700 }}>₫{Number(pricePerNight).toLocaleString()}/night</p>
            </div>
            {!isAvailable && (
              <div>
                <p className="body-sm text-charcoal">Status</p>
                <span className="badge badge-warning">{room.status}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'flex-start' }}>
          {/* Calendar */}
          <div className="card" style={{ padding: 28 }}>
            <p className="heading-sm" style={{ marginBottom: 20 }}>Select your dates</p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <CalendarMonth
                year={thisYear} month={thisMonth}
                selectedRange={range} onDateClick={handleDateClick}
                occupiedDates={occupiedDates} pendingDates={pendingDates}
              />
              <CalendarMonth
                year={nextYear} month={nextMonth}
                selectedRange={range} onDateClick={handleDateClick}
                occupiedDates={occupiedDates} pendingDates={pendingDates}
              />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--hairline)' }}>
              {[
                { color: '#dcfce7', label: 'Available' },
                { color: '#fef3c7', label: 'Pending Deposit' },
                { color: '#fee2e2', label: 'Occupied / Reserved' },
                { color: 'var(--surface-bone)', label: 'Past / Unavailable' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color, border: '1px solid var(--hairline)' }} />
                  <span className="body-sm text-charcoal">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking summary */}
          <div className="card-lg" style={{ padding: 24 }}>
            <h3 className="heading-sm" style={{ marginBottom: 16 }}>Booking Summary</h3>

            {range.start ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="body-sm text-charcoal">Check-in</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{range.start}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="body-sm text-charcoal">Check-out</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{range.end || 'Select end date'}</span>
                </div>
                {nights > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="body-sm text-charcoal">Nights</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{nights}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 12, marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="body-sm text-charcoal">Total amount</span>
                        <span style={{ fontWeight: 700 }}>₫{(nights * pricePerNight).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="body-sm text-charcoal">Deposit (40%)</span>
                        <span className="text-primary" style={{ fontWeight: 700 }}>
                          ₫{Math.round(nights * pricePerNight * 0.4).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--charcoal)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <p className="body-sm">Click on the calendar to select check-in date</p>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              {isAvailable && nights > 0 ? (
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => navigate(`/request-booking/${id}?checkIn=${range.start}&checkOut=${range.end}`)}
                >
                  Book This Room
                </button>
              ) : (
                <button className="btn-primary" style={{ width: '100%' }} disabled>
                  {!isAvailable ? `Room ${room.status}` : 'Select dates to continue'}
                </button>
              )}
            </div>
            <Link
              to={`/rooms/${id}`}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 8 }}
            >
              ← Back to Room Detail
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
