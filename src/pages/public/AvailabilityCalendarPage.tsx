import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// Mock room data (same as RoomDetailPage)
const ROOM = {
  id: '1', roomNumber: 'Villa 01', roomType: 'Villa',
  pricePerNight: 2500000, capacity: 4, area: 80, status: 'AVAILABLE',
  propertyName: 'Sunset Resort Đà Nẵng', propertyAddress: '123 Nguyễn Tất Thành, Đà Nẵng',
};

// Occupied date ranges mock
const OCCUPIED_DATES = new Set(['2026-06-20','2026-06-21','2026-06-22','2026-06-28','2026-06-29','2026-07-04','2026-07-05','2026-07-06','2026-07-07']);
const PENDING_DATES   = new Set(['2026-06-17','2026-06-18']);

function CalendarMonth({ year, month, selectedRange, onDateClick }: {
  year: number; month: number;
  selectedRange: { start: string; end: string };
  onDateClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function getKey(d: number) {
    return `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  function getCellStyle(day: number | null) {
    if (!day) return {};
    const key = getKey(day);
    const today = new Date();
    const cellDate = new Date(key);
    const isPast = cellDate < today;
    const isOccupied = OCCUPIED_DATES.has(key);
    const isPending = PENDING_DATES.has(key);
    const isSelected = key === selectedRange.start || key === selectedRange.end;
    if (isPast)     return { background: 'transparent', color: 'var(--stone)', cursor: 'default' };
    if (isOccupied) return { background: '#fee2e2', color: '#dc2626', cursor: 'not-allowed' };
    if (isPending)  return { background: '#fef3c7', color: '#d97706', cursor: 'not-allowed' };
    if (isSelected) return { background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 700 };
    return { background: '#dcfce7', color: '#2b9a66', cursor: 'pointer' };
  }

  function handleClick(day: number | null) {
    if (!day) return;
    const key = getKey(day);
    const today = new Date();
    if (new Date(key) < today || OCCUPIED_DATES.has(key) || PENDING_DATES.has(key)) return;
    onDateClick(key);
  }

  return (
    <div style={{ flex: 1 }}>
      <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 12, fontSize: 15 }}>{MONTHS[month]} {year}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} onClick={() => handleClick(day)}
            style={{ textAlign: 'center', fontSize: 13, padding: '7px 4px', borderRadius: 8, transition: 'all 0.1s', ...getCellStyle(day) }}>
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AvailabilityCalendarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState({ start: '', end: '' });

  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const nextMonth = (thisMonth + 1) % 12;
  const nextYear = nextMonth === 0 ? thisYear + 1 : thisYear;

  function handleDateClick(date: string) {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: date, end: '' });
    } else {
      if (date < range.start) setRange({ start: date, end: range.start });
      else setRange({ start: range.start, end: date });
    }
  }

  const nights = range.start && range.end
    ? Math.ceil((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000)
    : 0;

  return (
    <PublicLayout>
      <div className="container-wide" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 24 }}>
          <Link to="/" className="text-primary" style={{ textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
          <span>›</span>
          <Link to={`/rooms/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>{ROOM.roomNumber}</Link>
          <span>›</span>
          <span className="text-ink" style={{ fontWeight: 600 }}>Availability</span>
        </div>

        {/* Room info bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="heading-md">{ROOM.roomNumber} — Availability Calendar</h1>
            <p className="body-sm text-charcoal">{ROOM.propertyName}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div><p className="body-sm text-charcoal">Type</p><p style={{ fontWeight: 600 }}>{ROOM.roomType}</p></div>
            <div><p className="body-sm text-charcoal">Capacity</p><p style={{ fontWeight: 600 }}>{ROOM.capacity} guests</p></div>
            <div><p className="body-sm text-charcoal">Area</p><p style={{ fontWeight: 600 }}>{ROOM.area}m²</p></div>
            <div><p className="body-sm text-charcoal">Price</p><p className="text-primary" style={{ fontWeight: 700 }}>₫{ROOM.pricePerNight.toLocaleString()}/night</p></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'flex-start' }}>
          {/* Calendar */}
          <div className="card" style={{ padding: 28 }}>
            <p className="heading-sm" style={{ marginBottom: 20 }}>Select your dates</p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <CalendarMonth year={thisYear} month={thisMonth} selectedRange={range} onDateClick={handleDateClick} />
              <CalendarMonth year={nextYear} month={nextMonth} selectedRange={range} onDateClick={handleDateClick} />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--hairline)' }}>
              {[
                { color: '#dcfce7', label: 'Available' },
                { color: '#fef3c7', label: 'Pending Deposit' },
                { color: '#fee2e2', label: 'Occupied / Reserved' },
                { color: 'var(--surface-bone)', label: 'Past / Unavailable' },
              ].map(l => (
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
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{range.start || '—'}</span>
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
                        <span style={{ fontWeight: 700 }}>₫{(nights * ROOM.pricePerNight).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="body-sm text-charcoal">Deposit (40%)</span>
                        <span className="text-primary" style={{ fontWeight: 700 }}>₫{Math.round(nights * ROOM.pricePerNight * 0.4).toLocaleString()}</span>
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
              {ROOM.status === 'AVAILABLE' && nights > 0 ? (
                <button className="btn-primary" style={{ width: '100%' }}
                  onClick={() => navigate(`/request-booking/${ROOM.id}?checkIn=${range.start}&checkOut=${range.end}`)}>
                  Book This Room
                </button>
              ) : (
                <button className="btn-primary" style={{ width: '100%' }} disabled>
                  {ROOM.status !== 'AVAILABLE' ? 'Room Unavailable' : 'Select dates to continue'}
                </button>
              )}
            </div>
            <Link to={`/rooms/${id}`} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 8 }}>
              ← Back to Room Detail
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
