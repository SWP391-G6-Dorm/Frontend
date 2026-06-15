import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

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

export default function AddPropertyPage() {
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
