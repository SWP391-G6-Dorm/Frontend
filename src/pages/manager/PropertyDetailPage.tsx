import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const PROPERTIES = [
  { id: 'PR001', name: 'Sunset Resort Đà Nẵng', address: '123 Nguyễn Tất Thành, Đà Nẵng', description: 'Beachfront resort with stunning Pacific ocean views.', roomCount: 15, availableCount: 8, totalRevenue: 450000000, createdAt: '2025-01-10', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop' },
  { id: 'PR002', name: 'Mountain View Homestay', address: '456 Trần Phú, Đà Lạt', description: 'Cozy mountain homestay surrounded by pine forests.', roomCount: 8, availableCount: 5, totalRevenue: 220000000, createdAt: '2025-03-15', image: 'https://images.unsplash.com/photo-1587874522487-fe10e954d035?w=400&h=250&fit=crop' },
  { id: 'PR003', name: 'Hội An Garden Villa', address: '78 Phan Bội Châu, Hội An', description: 'Heritage villa with beautiful ancient town gardens.', roomCount: 12, availableCount: 9, totalRevenue: 380000000, createdAt: '2025-02-20', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop' },
];

export default function PropertyDetailPage() {
  const { id } = useParams();
  const p = PROPERTIES.find(x => x.id === id) || PROPERTIES[0];

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/properties" className="text-primary" style={{ textDecoration: 'none' }}>Properties</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>{p.name}</span>
      </div>

      <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">{p.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/manager/properties/${p.id}/edit`} className="btn-outline btn-sm">Edit</Link>
          <Link to={`/manager/structure?propertyId=${p.id}`} className="btn-ghost btn-sm">Structure Tree</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'flex-start' }}>
        <div>
          <img src={p.image} alt={p.name} style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>About</h2>
            <p className="body-md text-body" style={{ lineHeight: 1.7 }}>{p.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="kpi-card">
            <span style={{ fontSize: 24 }}>🛏️</span>
            <div className="kpi-value">{p.roomCount}</div>
            <div className="kpi-label">Total Rooms</div>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: 24 }}>✅</span>
            <div className="kpi-value" style={{ color: 'var(--success)' }}>{p.availableCount}</div>
            <div className="kpi-label">Available</div>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: 24 }}>💰</span>
            <div className="kpi-value" style={{ fontSize: 22 }}>₫{(p.totalRevenue / 1000000).toFixed(0)}M</div>
            <div className="kpi-label">Total Revenue</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <p className="body-sm text-charcoal">Address</p>
            <p style={{ fontWeight: 600, marginTop: 4 }}>📍 {p.address}</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <p className="body-sm text-charcoal">Added On</p>
            <p style={{ fontWeight: 600, marginTop: 4 }}>{new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link to={`/manager/rooms?propertyId=${p.id}`} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>View All Rooms →</Link>
        </div>
      </div>
    </ManagerLayout>
  );
}
