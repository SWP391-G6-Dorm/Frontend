// ─── PropertyPages.tsx — SCR-33, 34, 35, 36 ──────────────────────────────────
// Exports: PropertyListPage, PropertyDetailPage, AddPropertyPage, EditPropertyPage

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const PROPERTIES = [
  { id: 'PR001', name: 'Sunset Resort Đà Nẵng', address: '123 Nguyễn Tất Thành, Đà Nẵng', description: 'Beachfront resort with stunning Pacific ocean views.', roomCount: 15, availableCount: 8, totalRevenue: 450000000, createdAt: '2025-01-10', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop' },
  { id: 'PR002', name: 'Mountain View Homestay', address: '456 Trần Phú, Đà Lạt', description: 'Cozy mountain homestay surrounded by pine forests.', roomCount: 8, availableCount: 5, totalRevenue: 220000000, createdAt: '2025-03-15', image: 'https://images.unsplash.com/photo-1587874522487-fe10e954d035?w=400&h=250&fit=crop' },
  { id: 'PR003', name: 'Hội An Garden Villa', address: '78 Phan Bội Châu, Hội An', description: 'Heritage villa with beautiful ancient town gardens.', roomCount: 12, availableCount: 9, totalRevenue: 380000000, createdAt: '2025-02-20', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop' },
];

function PropertyForm({ initial, onSubmit, loading }: {
  initial: { name: string; address: string; description: string };
  onSubmit: (v: typeof initial) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = 'Property name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 28 }}>
      <div style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required" htmlFor="propName">Property Name</label>
        <input id="propName" className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="e.g., Sunset Resort Đà Nẵng"
          value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required" htmlFor="propAddr">Address</label>
        <input id="propAddr" className={`input ${errors.address ? 'input-error' : ''}`}
          placeholder="Full address"
          value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
        {errors.address && <p className="form-error">{errors.address}</p>}
      </div>
      <div style={{ marginBottom: 24 }}>
        <label className="form-label" htmlFor="propDesc">Description</label>
        <textarea id="propDesc" className="textarea" rows={4}
          placeholder="Describe the property..."
          value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Property'}</button>
    </form>
  );
}

// ── SCR-33: Property List ─────────────────────────────────────────────────────
export function PropertyListPage() {
  const [search, setSearch] = useState('');
  const list = PROPERTIES.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase()));

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

// ── SCR-34: Property Detail ───────────────────────────────────────────────────
export function PropertyDetailPage() {
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

// ── SCR-35: Add Property ──────────────────────────────────────────────────────
export function AddPropertyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(form: { name: string; address: string; description: string }) {
    setLoading(true);
    try {
      // TODO: await propertyApi.create(form);
      await new Promise(r => setTimeout(r, 800));
      navigate('/manager/properties');
    } catch { setLoading(false); }
  }

  return (
    <ManagerLayout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/manager/properties" className="text-primary" style={{ textDecoration: 'none' }}>Properties</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Add Property</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Add New Property</h1>
        <PropertyForm initial={{ name: '', address: '', description: '' }} onSubmit={handleSubmit} loading={loading} />
      </div>
    </ManagerLayout>
  );
}

// ── SCR-36: Edit Property ─────────────────────────────────────────────────────
export function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = PROPERTIES.find(x => x.id === id) || PROPERTIES[0];
  const [loading, setLoading] = useState(false);

  async function handleSubmit(form: { name: string; address: string; description: string }) {
    setLoading(true);
    try {
      // TODO: await propertyApi.update(id, form);
      await new Promise(r => setTimeout(r, 800));
      navigate(`/manager/properties/${id}`);
    } catch { setLoading(false); }
  }

  return (
    <ManagerLayout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/manager/properties" className="text-primary" style={{ textDecoration: 'none' }}>Properties</Link>
          <span>›</span>
          <Link to={`/manager/properties/${p.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{p.name}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Edit</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Edit Property</h1>
        <PropertyForm initial={{ name: p.name, address: p.address, description: p.description }} onSubmit={handleSubmit} loading={loading} />
      </div>
    </ManagerLayout>
  );
}
