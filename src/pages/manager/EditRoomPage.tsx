import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const FLOORS = [
  { id: 'F001', floorNumber: 1, description: 'Ground Floor' },
  { id: 'F002', floorNumber: 2, description: 'Sea View Floor' },
  { id: 'F003', floorNumber: 3, description: 'Penthouse' },
];

const ROOMS = [
  { id: 'R001', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, description: 'Stunning beachfront villa with private pool.', floorId: 'F002' },
  { id: 'R002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', pricePerNight: 1200000, capacity: 2, area: 35, description: 'Modern deluxe room with city views.', floorId: 'F001' },
];

export default function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const [form, setForm] = useState({ roomNumber: r.roomNumber, roomType: r.roomType, pricePerNight: String(r.pricePerNight), capacity: String(r.capacity), area: String(r.area), description: r.description, floorId: r.floorId });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: await roomApi.update(id, form);
    await new Promise(r => setTimeout(r, 800));
    navigate(`/manager/rooms/${id}`);
  }

  return (
    <ManagerLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={`/manager/rooms/${r.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{r.roomNumber}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Edit</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Edit Room: {r.roomNumber}</h1>
        <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label className="form-label form-label-required">Room Number</label><input className="input" value={form.roomNumber} onChange={e => setForm(p => ({ ...p, roomNumber: e.target.value }))} /></div>
            <div><label className="form-label">Room Type</label><select className="select" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>{['Studio', 'Standard', 'Deluxe', 'Suite', 'Villa'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="form-label">Price / Night (₫)</label><input type="number" className="input" value={form.pricePerNight} onChange={e => setForm(p => ({ ...p, pricePerNight: e.target.value }))} /></div>
            <div><label className="form-label">Capacity</label><input type="number" min={1} className="input" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
            <div><label className="form-label">Area (m²)</label><input type="number" className="input" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
            <div><label className="form-label">Floor</label><select className="select" value={form.floorId} onChange={e => setForm(p => ({ ...p, floorId: e.target.value }))}>{FLOORS.map(f => <option key={f.id} value={f.id}>F{f.floorNumber} — {f.description}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 24 }}><label className="form-label">Description</label><textarea className="textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            <Link to={`/manager/rooms/${id}`} className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}
