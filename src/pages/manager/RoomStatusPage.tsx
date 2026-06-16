import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const ROOMS = [
  { id: 'R001', roomNumber: 'Villa 01', status: 'AVAILABLE' },
  { id: 'R002', roomNumber: 'Deluxe 05', status: 'OCCUPIED' },
  { id: 'R003', roomNumber: 'Suite 03', status: 'MAINTENANCE' },
];

const STATUS_META: Record<string, { color: string; desc: string }> = {
  AVAILABLE:       { color: 'var(--success)', desc: 'Room is ready for new bookings' },
  PENDING_DEPOSIT: { color: 'var(--warning)', desc: 'Waiting for deposit payment' },
  RESERVED:        { color: 'var(--info)',    desc: 'Booked and confirmed' },
  OCCUPIED:        { color: 'var(--error)',   desc: 'Guest is currently checked in' },
  MAINTENANCE:     { color: 'var(--charcoal)', desc: 'Under maintenance, cannot be booked' },
};

export default function RoomStatusPage() {
  const { id } = useParams();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const [status, setStatus] = useState(r.status);
  const [saving, setSaving] = useState(false);

  const STATUSES = ['AVAILABLE', 'PENDING_DEPOSIT', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'];

  async function handleSave() {
    setSaving(true);
    // TODO: await roomApi.updateStatus(r.id, status);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
  }

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to={`/manager/rooms/${r.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{r.roomNumber}</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Status Management</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Room Status: {r.roomNumber}</h1>

      <div style={{ maxWidth: 480 }}>
        <div className="card-lg" style={{ padding: 28 }}>
          <p className="heading-sm" style={{ marginBottom: 20 }}>Select Room Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {STATUSES.map(s => {
              const meta = STATUS_META[s];
              return (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: `1.5px solid ${status === s ? meta.color : 'var(--hairline)'}`, borderRadius: 10, cursor: 'pointer', background: status === s ? `${meta.color}12` : 'var(--surface-card)', transition: 'all 0.15s' }}>
                  <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} style={{ accentColor: meta.color }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{s.replace('_', ' ')}</p>
                    <p className="body-sm text-charcoal">{meta.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Update Status'}</button>
        </div>
      </div>
    </ManagerLayout>
  );
}
