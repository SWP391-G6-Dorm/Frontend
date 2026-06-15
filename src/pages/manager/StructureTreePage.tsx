import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  { id: 'R001', roomNumber: 'Villa 01', status: 'AVAILABLE', floorId: 'F002' },
  { id: 'R002', roomNumber: 'Deluxe 05', status: 'OCCUPIED', floorId: 'F001' },
  { id: 'R003', roomNumber: 'Suite 03', status: 'MAINTENANCE', floorId: 'F003' },
];

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    AVAILABLE:   { cls: 'badge-success', l: 'Available' },
    OCCUPIED:    { cls: 'badge-error',   l: 'Occupied' },
    MAINTENANCE: { cls: 'badge-neutral', l: 'Maintenance' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function StructureTreePage() {
  const [selectedProp, setSelectedProp] = useState(PROPERTIES[0].id);
  const prop = PROPERTIES.find(p => p.id === selectedProp)!;
  const floors = FLOORS.filter(f => f.propertyId === selectedProp);

  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Property Structure</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 className="heading-sm" style={{ marginBottom: 12 }}>Properties</h3>
          {PROPERTIES.map(p => (
            <button key={p.id} onClick={() => setSelectedProp(p.id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, marginBottom: 4, background: selectedProp === p.id ? '#fff1ee' : 'transparent', color: selectedProp === p.id ? 'var(--primary)' : 'var(--ink)', fontWeight: selectedProp === p.id ? 700 : 500, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
              🏠 {p.name}
            </button>
          ))}
          <Link to="/manager/properties/add" className="btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Property</Link>
        </div>

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
                          <Link key={r.id} to={`/manager/rooms/${r.id}`} style={{ textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--hairline)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', background: 'var(--surface-card)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
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
