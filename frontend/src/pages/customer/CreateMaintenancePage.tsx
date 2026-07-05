import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

export default function CreateMaintenancePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ bookingId: '', title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.bookingId.trim()) e.bookingId = 'Booking is required';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.description.length < 20) e.description = 'Please provide more detail (at least 20 characters)';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // TODO: await maintenanceApi.create(form);
      await new Promise(r => setTimeout(r, 800));
      navigate('/customer/maintenance');
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/maintenance" className="text-primary" style={{ textDecoration: 'none' }}>Maintenance</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>New Request</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Submit Maintenance Request</h1>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="bookingId">Related Booking</label>
            <select id="bookingId" className={`select ${errors.bookingId ? 'input-error' : ''}`}
              value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))}>
              <option value="">Select a booking</option>
              <option value="B001">B001 – Villa 01, Sunset Resort (Jul 10-13)</option>
              <option value="B002">B002 – Deluxe 05, Mountain View (Aug 1-3)</option>
            </select>
            {errors.bookingId && <p className="form-error">{errors.bookingId}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="title">Issue Title</label>
            <input id="title" className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g., Air conditioner not working"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label form-label-required" htmlFor="description">Description</label>
            <textarea id="description" className={`textarea ${errors.description ? 'input-error' : ''}`}
              rows={5} placeholder="Describe the issue in detail so we can help you quickly..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.description ? <p className="form-error">{errors.description}</p> : <span />}
              <span className="form-hint">{form.description.length} chars</span>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Our team will review your request and update the status within 24 hours.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link to="/customer/maintenance" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
