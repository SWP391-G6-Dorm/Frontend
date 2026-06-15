import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const PROPERTIES = [
  { id: 'PR001', name: 'Sunset Resort Đà Nẵng', address: '123 Nguyễn Tất Thành, Đà Nẵng', roomCount: 15, availableCount: 8, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop' },
  { id: 'PR002', name: 'Mountain View Homestay', address: '456 Trần Phú, Đà Lạt', roomCount: 8, availableCount: 5, image: 'https://images.unsplash.com/photo-1587874522487-fe10e954d035?w=400&h=250&fit=crop' },
  { id: 'PR003', name: 'Hội An Garden Villa', address: '78 Phan Bội Châu, Hội An', roomCount: 12, availableCount: 9, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop' },
];

export default function PropertyListPage() {
  const [search, setSearch] = useState('');
  const list = PROPERTIES.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Properties</h1>
        <Link to="/manager/properties/add" className="btn-primary btn-sm">+ Add Property</Link>
      </div>

      <div style={{ marginBottom: 20, maxWidth: 380 }}>
        <input className="input" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map(p => (
          <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
            <img src={p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            <div style={{ padding: 20 }}>
              <h3 className="heading-sm" style={{ marginBottom: 4 }}>{p.name}</h3>
              <p className="body-sm text-charcoal" style={{ marginBottom: 10 }}>📍 {p.address}</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className="badge badge-neutral">{p.roomCount} rooms</span>
                <span className="badge badge-success">{p.availableCount} available</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/manager/properties/${p.id}`} className="btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>View</Link>
                <Link to={`/manager/properties/${p.id}/edit`} className="btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Edit</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div style={{ textAlign: 'center', padding: 60 }}><p className="body-md text-charcoal">No properties match your search.</p></div>}
    </ManagerLayout>
  );
}
