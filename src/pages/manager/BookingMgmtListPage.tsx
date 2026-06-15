import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const BOOKINGS = [
  { id: 'B001', customer: 'Nguyễn Văn An', customerEmail: 'an.nguyen@email.com', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', totalAmount: 7500000, status: 'CONFIRMED' },
  { id: 'B002', customer: 'Trần Thị Lan', customerEmail: 'lan.tran@email.com', roomNumber: 'Deluxe 05', propertyName: 'Mountain View Homestay', checkInDate: '2026-08-01', checkOutDate: '2026-08-03', totalAmount: 2400000, status: 'PENDING_DEPOSIT' },
  { id: 'B003', customer: 'Lê Minh Hoàng', customerEmail: 'hoang.le@email.com', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', totalAmount: 5400000, status: 'CHECKED_OUT' },
];

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending Deposit' },
  CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
  CHECKED_IN:      { cls: 'badge-info',    l: 'Checked In' },
  CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
  CANCELLED:       { cls: 'badge-error',   l: 'Cancelled' },
};

function SBadge({ s }: { s: string }) {
  const v = STATUS_MAP[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function BookingMgmtListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const TABS = ['ALL', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

  const list = BOOKINGS.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return b.customer.toLowerCase().includes(search.toLowerCase()) || b.roomNumber.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Booking Management</h1>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search booking, customer..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-pill ${statusFilter === tab ? 'active' : ''}`} onClick={() => setStatusFilter(tab)} style={{ fontSize: 12 }}>
            {tab === 'ALL' ? 'All' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(b => (
              <tr key={b.id}>
                <td><span className="code-sm">{b.id}</span></td>
                <td><p style={{ fontWeight: 600, fontSize: 13 }}>{b.customer}</p><p style={{ fontSize: 11, color: 'var(--ash)' }}>{b.customerEmail}</p></td>
                <td><p style={{ fontWeight: 600, fontSize: 13 }}>{b.roomNumber}</p><p style={{ fontSize: 11, color: 'var(--ash)' }}>{b.propertyName}</p></td>
                <td className="text-charcoal">{b.checkInDate}</td>
                <td className="text-charcoal">{b.checkOutDate}</td>
                <td style={{ fontWeight: 700 }}>₫{b.totalAmount.toLocaleString()}</td>
                <td><SBadge s={b.status} /></td>
                <td><Link to={`/manager/bookings/${b.id}`} className="btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}
