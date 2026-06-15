import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const ROOMS = [
  { id: 'R001', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, description: 'Stunning beachfront villa with private pool.', status: 'AVAILABLE', floorNumber: 2, propertyId: 'PR001', propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop' },
  { id: 'R002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', pricePerNight: 1200000, capacity: 2, area: 35, description: 'Modern deluxe room with city views.', status: 'OCCUPIED', floorNumber: 1, propertyId: 'PR001', propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=200&fit=crop' },
  { id: 'R003', roomNumber: 'Suite 03', roomType: 'Suite', pricePerNight: 1800000, capacity: 3, area: 55, description: 'Luxury suite with panoramic views.', status: 'MAINTENANCE', floorNumber: 3, propertyId: 'PR001', propertyName: 'Sunset Resort Đà Nẵng', primaryImageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300&h=200&fit=crop' },
];

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  AVAILABLE:   { cls: 'badge-success', l: 'Available' },
  OCCUPIED:    { cls: 'badge-error',   l: 'Occupied' },
  MAINTENANCE: { cls: 'badge-neutral', l: 'Maintenance' },
};

function StatusBadge({ s }: { s: string }) {
  const v = STATUS_MAP[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function RoomDetailMgmtPage() {
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
