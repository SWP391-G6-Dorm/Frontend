import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const ROOMS = [
  { id: 'R001', roomNumber: 'Villa 01', primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop' },
  { id: 'R002', roomNumber: 'Deluxe 05', primaryImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=200&fit=crop' },
];

export default function RoomGalleryPage() {
  const { id } = useParams();
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const mockImages = [
    r.primaryImageUrl,
    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=200&h=140&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&h=140&fit=crop',
  ];

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
            <img src={img} alt={`Room image ${i + 1}`} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 6, right: 6 }}>
              <button style={{ background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            {i === 0 && <div style={{ position: 'absolute', bottom: 6, left: 6 }}><span className="badge badge-success" style={{ fontSize: 10 }}>Primary</span></div>}
          </div>
        ))}
        <div style={{ border: '2px dashed var(--hairline)', borderRadius: 10, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-bone)', color: 'var(--ash)' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>+</div>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Add Photo</p>
        </div>
      </div>
    </ManagerLayout>
  );
}
