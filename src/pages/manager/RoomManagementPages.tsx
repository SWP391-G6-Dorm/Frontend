// ─── RoomManagementPages.tsx — SCR-37 through 44 ─────────────────────────────
// Exports: StructureTreePage, FloorManagementPage, RoomListPage, RoomDetailMgmtPage,
//          AddRoomPage, EditRoomPage, RoomGalleryPage, RoomStatusPage

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

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

// ── SCR-37: Structure Tree ────────────────────────────────────────────────────
export function StructureTreePage() {
  const [selectedProp, setSelectedProp] = useState(PROPERTIES[0].id);
  const prop = PROPERTIES.find(p => p.id === selectedProp)!;
  const floors = FLOORS.filter(f => f.propertyId === selectedProp);

  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Property Structure</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Property list */}
        <div className="card" style={{ padding: 16 }}>
          <h3 className="heading-sm" style={{ marginBottom: 12 }}>Properties</h3>
          {PROPERTIES.map(p => (
            <button key={p.id} onClick={() => setSelectedProp(p.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                background: selectedProp === p.id ? '#fff1ee' : 'transparent',
                color: selectedProp === p.id ? 'var(--primary)' : 'var(--ink)',
                fontWeight: selectedProp === p.id ? 700 : 500, fontSize: 13,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}>
              🏠 {p.name}
            </button>
          ))}
          <Link to="/manager/properties/add" className="btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Property</Link>
        </div>

        {/* Structure tree */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-sm">{prop.name}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/manager/properties/${selectedProp}`} className="btn-ghost btn-sm">View Property</Link>
              <button className="btn-outline btn-sm">+ Add Floor</button>
            </div>
          </div>

          {floors.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <p className="body-md text-charcoal">No floors found. Add a floor to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {floors.map(floor => {
                const rooms = ROOMS.filter(r => r.floorId === floor.id);
                return (
                  <div key={floor.id} className="card" style={{ padding: 20 }}>
                    <div className="flex items-center gap-12" style={{ marginBottom: rooms.length > 0 ? 12 : 0 }}>
                      <div style={{ width: 36, height: 36, background: 'var(--surface-bone)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>F{floor.floorNumber}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>Floor {floor.floorNumber} — {floor.description}</p>
                        <p className="body-sm text-charcoal">{floor.roomCount} rooms</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/manager/rooms?floorId=${floor.id}`} className="btn-ghost btn-sm">Rooms</Link>
                        <button className="btn-outline btn-sm">+ Room</button>
                      </div>
                    </div>
                    {rooms.length > 0 && (
                      <div style={{ paddingLeft: 48, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {rooms.map(r => (
                          <Link key={r.id} to={`/manager/rooms/${r.id}`} style={{
                            textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
                            border: '1px solid var(--hairline)', fontSize: 13, fontWeight: 600,
                            color: 'var(--ink)', background: 'var(--surface-card)', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-card)')}>
                            <StatusBadge s={r.status} />
                            {r.roomNumber}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-38: Floor Management ──────────────────────────────────────────────────
export function FloorManagementPage() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ floorNumber: '', description: '', propertyId: 'PR001' });

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Floor Management</h1>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Floor</button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setModal(false)}>
          <div className="card-lg" style={{ padding: 28, width: 440, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h2 className="heading-sm" style={{ marginBottom: 20 }}>Add New Floor</h2>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Property</label>
              <select className="select" value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))}>
                {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label form-label-required">Floor Number</label>
              <input type="number" min={1} className="input" placeholder="e.g., 1" value={form.floorNumber} onChange={e => setForm(p => ({ ...p, floorNumber: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Description</label>
              <input className="input" placeholder="e.g., Sea View Floor" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setModal(false)}>Add Floor</button>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Floor</th>
              <th>Property</th>
              <th>Description</th>
              <th>Rooms</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {FLOORS.map(f => {
              const prop = PROPERTIES.find(p => p.id === f.propertyId);
              return (
                <tr key={f.id}>
                  <td style={{ fontWeight: 700 }}>Floor {f.floorNumber}</td>
                  <td>{prop?.name}</td>
                  <td className="text-charcoal">{f.description}</td>
                  <td><span className="badge badge-neutral">{f.roomCount} rooms</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm">Edit</button>
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--error)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-39: Room List ─────────────────────────────────────────────────────────
export function RoomListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const STATUSES = ['ALL', 'AVAILABLE', 'PENDING_DEPOSIT', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'];

  const list = ROOMS.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.propertyName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Room Management</h1>
        <Link to="/manager/rooms/add" className="btn-primary btn-sm">+ Add Room</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
          {STATUSES.map(s => (
            <button key={s} className={`tab-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)} style={{ fontSize: 12 }}>
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Property</th>
              <th>Floor</th>
              <th>Capacity</th>
              <th>Price/Night</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700 }}>{r.roomNumber}</td>
                <td className="text-charcoal">{r.roomType}</td>
                <td className="text-charcoal">{r.propertyName}</td>
                <td className="text-charcoal">F{r.floorNumber}</td>
                <td>{r.capacity} guests</td>
                <td style={{ fontWeight: 600 }}>₫{r.pricePerNight.toLocaleString()}</td>
                <td><StatusBadge s={r.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link to={`/manager/rooms/${r.id}`} className="btn-ghost btn-sm">View</Link>
                    <Link to={`/manager/rooms/${r.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}

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
