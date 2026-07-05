import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../../api/bookingApi';
import DataTable from '../../components/ui/DataTable';

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

  const columns = [
    { header: 'ID', accessor: (b: any) => <span className="code-sm" title={b.id}>{b.id.substring(0,8)}</span> },
    { header: 'Customer', accessor: (b: any) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{b.customerName}</p>
        <p style={{ fontSize: 11, color: 'var(--ash)', margin: 0 }}>{b.customerEmail}</p>
      </div>
    )},
    { header: 'Room', accessor: (b: any) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{b.roomNumber}</p>
        <p style={{ fontSize: 11, color: 'var(--ash)', margin: 0 }}>{b.propertyName}</p>
      </div>
    )},
    { header: 'Dates', accessor: (b: any) => (
      <div style={{ fontSize: 12 }}>
        <div>In: {b.checkInDate}</div>
        <div>Out: {b.checkOutDate}</div>
      </div>
    )},
    { header: 'Amount', accessor: (b: any) => <span style={{ fontWeight: 700 }}>₫{b.totalAmount.toLocaleString()}</span> },
    { header: 'Status', accessor: (b: any) => <SBadge s={b.status} /> }
  ];

  const actions = [
    { label: 'View', onClick: (b: any) => window.location.href = `/manager/bookings/${b.id}` }
  ];

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
      <div style={{ marginBottom: 20 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading bookings...</div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--error)' }}>Error loading bookings</div>
        ) : (
          <DataTable 
            columns={columns}
            data={list}
            keyExtractor={(b) => b.id}
            actions={actions}
          />
        )}
      </div>
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
          <span style={{ fontSize: 13, color: 'var(--charcoal)' }}>Page {page + 1} of {totalPages}</span>
          <button className="btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </ManagerLayout>
  );
}
