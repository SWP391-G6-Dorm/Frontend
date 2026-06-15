import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const ROOMS = [
  { id: 'R001', roomNumber: 'Villa 01', roomType: 'Villa', pricePerNight: 2500000, capacity: 4, area: 80, status: 'AVAILABLE', floorNumber: 2, propertyName: 'Sunset Resort Đà Nẵng' },
  { id: 'R002', roomNumber: 'Deluxe 05', roomType: 'Deluxe', pricePerNight: 1200000, capacity: 2, area: 35, status: 'OCCUPIED', floorNumber: 1, propertyName: 'Sunset Resort Đà Nẵng' },
  { id: 'R003', roomNumber: 'Suite 03', roomType: 'Suite', pricePerNight: 1800000, capacity: 3, area: 55, status: 'MAINTENANCE', floorNumber: 3, propertyName: 'Sunset Resort Đà Nẵng' },
];

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  AVAILABLE:       { cls: 'badge-success', l: 'Available' },
  PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending' },
  RESERVED:        { cls: 'badge-info',    l: 'Reserved' },
  OCCUPIED:        { cls: 'badge-error',   l: 'Occupied' },
  MAINTENANCE:     { cls: 'badge-neutral', l: 'Maintenance' },
};

function StatusBadge({ s }: { s: string }) {
  const v = STATUS_MAP[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function RoomListPage() {
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
              <th>Room</th><th>Type</th><th>Property</th><th>Floor</th>
              <th>Capacity</th><th>Price/Night</th><th>Status</th><th>Actions</th>
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
