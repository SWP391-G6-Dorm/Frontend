import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-22 — Viewing Appointment Booking
// Entity: ViewingAppointment
// Fields: tenant · room · appointmentDate · note · status

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const BOOKED_SLOTS = ['10:00', '14:00']; // simulate already booked

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ViewingAppointmentPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Demo room from context / params
  const room = { id: 'r-003', roomNumber: 'C-305', roomType: 'Double Room', propertyName: 'City Center Residences', address: '45 Tran Hung Dao, District 5, HCMC' };

  // Min date: tomorrow
  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  // Max date: 30 days from now
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  function validate() {
    const e: Record<string, string> = {};
    if (!selectedDate) e.date = 'Please select a date.';
    if (!selectedTime) e.time = 'Please select a time slot.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    // POST ViewingAppointment.status = PENDING
    setTimeout(() => { setLoading(false); setConfirmed(true); }, 1000);
  }

  if (confirmed) {
    return (
      <TenantLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="text-5xl mb-4">📅</div>
          <h2 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Viewing Booked!</h2>
          <div className="card w-full p-5 mb-5" style={{ textAlign: 'left' }}>
            <div className="flex flex-col gap-3">
              <div><p className="caption" style={{ color: 'var(--ash)' }}>Room</p><p className="body-sm font-semibold">{room.roomNumber} — {room.roomType}</p></div>
              <div><p className="caption" style={{ color: 'var(--ash)' }}>Date</p><p className="body-sm font-semibold">{formatDate(selectedDate)}</p></div>
              <div><p className="caption" style={{ color: 'var(--ash)' }}>Time</p><p className="body-sm font-semibold">{selectedTime}</p></div>
              <div><span className="badge badge-warning">PENDING CONFIRMATION</span></div>
            </div>
          </div>
          <div className="alert alert-info mb-5 w-full">
            The landlord will confirm your appointment within 24 hours.
          </div>
          <Link to="/tenant/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/rooms/${room.id}`} className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Schedule a Viewing</h1>
        </div>

        {/* Room info card */}
        <div className="card mb-5" style={{ padding: 20 }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>{room.roomNumber} — {room.roomType}</h3>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.propertyName}</p>
              <p className="caption flex items-center gap-1" style={{ color: 'var(--ash)' }}>📍 {room.address}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            {/* ViewingAppointment.appointmentDate — date part */}
            <div className="mb-6">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                Viewing Date <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="va-date"
                type="date"
                className="input-field-rect"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                min={minDate}
                max={maxDate}
              />
              {selectedDate && (
                <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
                  📅 {formatDate(selectedDate)}
                </p>
              )}
              {errors.date && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.date}</p>}
            </div>

            {/* ViewingAppointment.appointmentDate — time part */}
            {selectedDate && (
              <div className="mb-6">
                <label className="label-sm block mb-3" style={{ color: 'var(--ink)' }}>
                  Time Slot <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const booked = BOOKED_SLOTS.includes(slot);
                    const selected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={booked}
                        onClick={() => setSelectedTime(slot)}
                        className="rounded-lg font-semibold text-sm transition-all"
                        style={{
                          height: 44,
                          background: booked ? 'var(--surface-bone)' : selected ? 'var(--primary)' : 'var(--surface-card)',
                          color: booked ? 'var(--stone)' : selected ? '#fff' : 'var(--ink)',
                          border: selected ? 'none' : '1px solid var(--hairline)',
                          cursor: booked ? 'not-allowed' : 'pointer',
                          textDecoration: booked ? 'line-through' : 'none',
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                <p className="caption mt-2" style={{ color: 'var(--ash)' }}>
                  Strikethrough = already booked
                </p>
                {errors.time && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.time}</p>}
              </div>
            )}

            {/* ViewingAppointment.note */}
            <div className="mb-6">
              <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Notes for Landlord</label>
              <textarea
                id="va-note"
                className="textarea-field"
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any questions or special requirements…"
              />
            </div>

            {/* Summary preview */}
            {selectedDate && selectedTime && (
              <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--surface-bone)' }}>
                <p className="label-sm mb-2" style={{ color: 'var(--charcoal)' }}>BOOKING SUMMARY</p>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between body-sm"><span style={{ color: 'var(--ash)' }}>Room:</span><span style={{ color: 'var(--ink)', fontWeight: 600 }}>{room.roomNumber}</span></div>
                  <div className="flex justify-between body-sm"><span style={{ color: 'var(--ash)' }}>Date:</span><span style={{ color: 'var(--ink)', fontWeight: 600 }}>{formatDate(selectedDate)}</span></div>
                  <div className="flex justify-between body-sm"><span style={{ color: 'var(--ash)' }}>Time:</span><span style={{ color: 'var(--ink)', fontWeight: 600 }}>{selectedTime}</span></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                id="va-submit"
                type="submit"
                className="btn-primary"
                style={{ height: 48, padding: '0 28px', fontSize: 15 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Booking…
                  </span>
                ) : '📅 Confirm Booking'}
              </button>
              <Link to="/rooms" className="btn-outline" style={{ height: 48, padding: '0 20px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}
