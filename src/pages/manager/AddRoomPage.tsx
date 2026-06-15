import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const FLOORS = [
  { id: 'F001', propertyId: 'PR001', floorNumber: 1, description: 'Ground Floor' },
  { id: 'F002', propertyId: 'PR001', floorNumber: 2, description: 'Sea View Floor' },
  { id: 'F003', propertyId: 'PR001', floorNumber: 3, description: 'Penthouse' },
];

export default function AddRoomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ roomNumber: '', roomType: 'Standard', pricePerNight: '', capacity: '', area: '', description: '', floorId: 'F001' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: await roomApi.create(form);
    await new Promise(r => setTimeout(r, 800));
    navigate('/manager/rooms');
  }

  return (
    <ManagerLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Add Room</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Add New Room</h1>
        <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label form-label-required">Room Number</label>
              <input className="input" placeholder="e.g., Villa 01" value={form.roomNumber} onChange={e => setForm(p => ({ ...p, roomNumber: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Room Type</label>
              <select className="select" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>
                {['Studio', 'Standard', 'Deluxe', 'Suite', 'Villa'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label form-label-required">Price / Night (₫)</label>
              <input type="number" className="input" placeholder="e.g., 1500000" value={form.pricePerNight} onChange={e => setForm(p => ({ ...p, pricePerNight: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label form-label-required">Capacity (guests)</label>
              <input type="number" min={1} max={20} className="input" placeholder="e.g., 2" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Area (m²)</label>
              <input type="number" className="input" placeholder="e.g., 35" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
            </div>
            <div>
              <label className="form-label form-label-required">Floor</label>
              <select className="select" value={form.floorId} onChange={e => setForm(p => ({ ...p, floorId: e.target.value }))}>
                {FLOORS.map(f => <option key={f.id} value={f.id}>F{f.floorNumber} — {f.description}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Description</label>
            <textarea className="textarea" rows={3} placeholder="Describe the room..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add Room'}</button>
            <Link to="/manager/rooms" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}
