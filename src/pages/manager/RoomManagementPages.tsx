// ─── RoomManagementPages.tsx — SCR-37 through 44 ─────────────────────────────
// Exports: StructureTreePage, FloorManagementPage, RoomListPage, RoomDetailMgmtPage,
//          AddRoomPage, EditRoomPage, RoomGalleryPage, RoomStatusPage

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

// SCR-37: Re-export from dedicated file (real API implementation)
export { default as StructureTreePage } from './StructureTreePage';

const PROPERTIES = [
  { id: 'PR001', name: 'Sunset Resort Đà Nẵng' },
  { id: 'PR002', name: 'Mountain View Homestay' },
  { id: 'PR003', name: 'Hội An Garden Villa' },
];

const FLOORS = [
  { id: 'F001', propertyId: 'PR001', floorNumber: 1, description: 'Ground Floor', roomCount: 5 },
  { id: 'F002', propertyId: 'PR001', floorNumber: 2, description: 'Sea View Floor', roomCount: 6 },
  { id: 'F003', propertyId: 'PR001', floorNumber: 3, description: 'Penthouse', roomCount: 4 },
  { id: 'F004', propertyId: 'PR002', floorNumber: 1, description: 'Mountain View', roomCount: 4 },
  { id: 'F005', propertyId: 'PR002', floorNumber: 2, description: 'Forest View', roomCount: 4 },
];


const ROOMS = [
  { id: 'R001', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, description: 'Stunning beachfront villa with private pool.', status: 'AVAILABLE', floorId: 'F002', floorNumber: 2, propertyId: 'PR001', propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop' },
  { id: 'R002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', pricePerNight: 1200000, capacity: 2, area: 35, description: 'Modern deluxe room with city views.', status: 'OCCUPIED', floorId: 'F001', floorNumber: 1, propertyId: 'PR001', propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=200&fit=crop' },
  { id: 'R003', roomNumber: 'Suite 03', roomType: 'Suite', pricePerNight: 1800000, capacity: 3, area: 55, description: 'Luxury suite with panoramic views.', status: 'MAINTENANCE', floorId: 'F003', floorNumber: 3, propertyId: 'PR001', propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300&h=200&fit=crop' },
];

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    AVAILABLE:       { cls: 'badge-success', l: 'Available' },
    PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending' },
    RESERVED:        { cls: 'badge-info',    l: 'Reserved' },
    OCCUPIED:        { cls: 'badge-error',   l: 'Occupied' },
    MAINTENANCE:     { cls: 'badge-neutral', l: 'Maintenance' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

// SCR-38: Re-export from dedicated file (real API implementation)
export { default as FloorManagementPage } from './FloorManagementPage';

// SCR-39: Re-export from dedicated file (real API implementation)
export { default as RoomListPage } from './RoomListPage';

// ── SCR-40: Room Detail (Manager) ─────────────────────────────────────────────
export function RoomDetailMgmtPage() {
  const { id } = useParams();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>{r.roomNumber}</span>
      </div>

      <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">{r.roomNumber} — {r.roomType}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge s={r.status} />
          <Link to={`/manager/rooms/${r.id}/edit`} className="btn-outline btn-sm">Edit</Link>
          <Link to={`/manager/rooms/${r.id}/gallery`} className="btn-ghost btn-sm">Gallery</Link>
          <Link to={`/manager/rooms/${r.id}/status`} className="btn-ghost btn-sm">Status</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          <img src={r.primaryImageUrl} alt={r.roomNumber} style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>About</h2>
            <p className="body-md text-body">{r.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { l: 'Property', v: r.propertyName },
            { l: 'Floor', v: `Floor ${r.floorNumber}` },
            { l: 'Type', v: r.roomType },
            { l: 'Capacity', v: `${r.capacity} guests` },
            { l: 'Area', v: `${r.area} m²` },
            { l: 'Price/Night', v: `₫${r.pricePerNight.toLocaleString()}` },
          ].map(item => (
            <div key={item.l} className="card" style={{ padding: '12px 16px' }}>
              <p className="body-sm text-charcoal">{item.l}</p>
              <p style={{ fontWeight: 600, marginTop: 2 }}>{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-41: Add Room ──────────────────────────────────────────────────────────
export function AddRoomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ roomNumber: '', roomType: 'Standard', pricePerNight: '', capacity: '', area: '', description: '', floorId: 'F001' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
                {['Studio','Standard','Deluxe','Suite','Villa'].map(t => <option key={t} value={t}>{t}</option>)}
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

// ── SCR-42: Edit Room ─────────────────────────────────────────────────────────
export function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const [form, setForm] = useState({ roomNumber: r.roomNumber, roomType: r.roomType, pricePerNight: String(r.pricePerNight), capacity: String(r.capacity), area: String(r.area), description: r.description, floorId: r.floorId });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
            <div><label className="form-label">Room Type</label><select className="select" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>{['Studio','Standard','Deluxe','Suite','Villa'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
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

// ── SCR-43: Room Gallery ──────────────────────────────────────────────────────
export function RoomGalleryPage() {
  const { id } = useParams();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const mockImages = [r.primaryImageUrl, 'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=200&h=140&fit=crop', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&h=140&fit=crop'];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to={`/manager/rooms/${r.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{r.roomNumber}</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Gallery</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Room Gallery: {r.roomNumber}</h1>
        <button className="btn-primary btn-sm">+ Upload Images</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockImages.map((img, i) => (
          <div key={i} className="card" style={{ overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
            <img src={img} alt={`Room image ${i+1}`} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 6, right: 6 }}>
              <button style={{ background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            {i === 0 && <div style={{ position: 'absolute', bottom: 6, left: 6 }}><span className="badge badge-success" style={{ fontSize: 10 }}>Primary</span></div>}
          </div>
        ))}
        {/* Upload placeholder */}
        <div style={{ border: '2px dashed var(--hairline)', borderRadius: 10, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-bone)', color: 'var(--ash)' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>+</div>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Add Photo</p>
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-44: Room Status ───────────────────────────────────────────────────────
export function RoomStatusPage() {
  const { id } = useParams();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const [status, setStatus] = useState(r.status);
  const [saving, setSaving] = useState(false);
  const STATUSES = ['AVAILABLE','PENDING_DEPOSIT','RESERVED','OCCUPIED','MAINTENANCE'];

  async function handleSave() {
    setSaving(true);
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
              const m: Record<string, { color: string; desc: string }> = {
                AVAILABLE:       { color: 'var(--success)', desc: 'Room is ready for new bookings' },
                PENDING_DEPOSIT: { color: 'var(--warning)', desc: 'Waiting for deposit payment' },
                RESERVED:        { color: 'var(--info)',    desc: 'Booked and confirmed' },
                OCCUPIED:        { color: 'var(--error)',   desc: 'Guest is currently checked in' },
                MAINTENANCE:     { color: 'var(--charcoal)', desc: 'Under maintenance, cannot be booked' },
              };
              const meta = m[s];
              return (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: `1.5px solid ${status === s ? meta.color : 'var(--hairline)'}`, borderRadius: 10, cursor: 'pointer', background: status === s ? `${meta.color}12` : 'var(--surface-card)', transition: 'all 0.15s' }}>
                  <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} style={{ accentColor: meta.color }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{s.replace('_',' ')}</p>
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
