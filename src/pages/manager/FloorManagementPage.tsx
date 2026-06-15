import { useState } from 'react';
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

export default function FloorManagementPage() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ floorNumber: '', description: '', propertyId: 'PR001' });

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Floor Management</h1>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Floor</button>
      </div>

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
