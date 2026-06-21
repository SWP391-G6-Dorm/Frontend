import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../../api/bookingApi';

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
  const [page, setPage] = useState(0);
  const size = 10;
  const TABS = ['ALL', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['managerBookings', page, size, statusFilter, search],
    queryFn: () => bookingApi.getAllBookings({
      page,
      size,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search.trim() || undefined
    })
  });

  const list = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Booking Management</h1>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <input 
          className="input" 
          style={{ maxWidth: 320, flex: 1 }} 
          placeholder="Search booking, customer..." 
          value={search} 
          onChange={e => { setSearch(e.target.value); setPage(0); }} 
        />
        
        <div style={{ position: 'relative' }}>
          <select 
            className="input" 
            style={{ width: 200, appearance: 'none', paddingRight: 36, cursor: 'pointer', fontWeight: 500 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          >
            {TABS.map(tab => (
              <option key={tab} value={tab}>{tab === 'ALL' ? 'All Statuses' : tab.replace('_', ' ')}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ash)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} style={{ textAlign: 'center' }}>Loading...</td></tr>}
            {isError && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'red' }}>Error loading bookings</td></tr>}
            {!isLoading && !isError && list.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center' }}>No bookings found</td></tr>}
            {!isLoading && list.map(b => (
              <tr key={b.id}>
                <td><span className="code-sm">{b.id.substring(0,8)}</span></td>
                <td><p style={{ fontWeight: 600, fontSize: 13 }}>{b.customerName}</p><p style={{ fontSize: 11, color: 'var(--ash)' }}>{b.customerEmail}</p></td>
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
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
          <span style={{ padding: '4px 10px' }}>Page {page + 1} of {totalPages}</span>
          <button className="btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </ManagerLayout>
  );
}
