import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../api/paymentApi';

function SBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    PENDING: { cls: 'badge-warning', l: 'Pending Verification' },
    PAID: { cls: 'badge-success', l: 'Paid' },
    FAILED: { cls: 'badge-error', l: 'Failed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function PaymentMgmtListPage() {
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get('bookingId');
  
  const [search, setSearch] = useState(bookingIdFromUrl || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const size = 10;
  
  const TABS = ['ALL', 'PENDING', 'PAID', 'FAILED'];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_payments', page, size, statusFilter, search],
    queryFn: () => paymentApi.getAllPayments({ 
      page, 
      size, 
      status: statusFilter === 'ALL' ? undefined : statusFilter, 
      search: search.trim() || undefined 
    }),
  });

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Payment Management</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <input 
          className="input" 
          style={{ maxWidth: 320, flex: 1 }} 
          placeholder="Search by customer or booking ID..." 
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
              <option key={tab} value={tab}>{tab === 'ALL' ? 'All Statuses' : tab}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ash)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>Loading payments...</td></tr>
            ) : isError ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: 'var(--error)' }}>Error loading payments</td></tr>
            ) : data?.data?.content.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>No payments found</td></tr>
            ) : (
              data?.data?.content.map(p => (
                <tr key={p.id}>
                  <td><span className="code-sm" title={p.id}>{p.id.substring(0, 8)}...</span></td>
                  <td><Link to={`/manager/bookings/${p.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }} title={p.bookingId}>{p.bookingId.substring(0, 8)}...</Link></td>
                  <td>{p.customerName}</td>
                  <td>
                    <span className="badge badge-tag" style={{ fontSize: 11 }}>
                      {p.type === 'DEPOSIT' ? 'Deposit' : 'Balance'}
                    </span>
                  </td>
                  <td className="text-charcoal">{p.method.replace('_', ' ')}</td>
                  <td style={{ fontWeight: 700 }}>₫{p.amount.toLocaleString()}</td>
                  <td><SBadge s={p.status} /></td>
                  <td className="text-charcoal">{new Date(p.createdAt).toLocaleDateString('en-US')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {p.status === 'PENDING' && (
                        <Link to={`/manager/payments/${p.id}/verify`} className="btn-primary btn-sm">Verify</Link>
                      )}
                      <Link to={`/manager/payments/${p.id}`} className="btn-ghost btn-sm">View</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.data && data.data.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button 
            className="btn-outline btn-sm" 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>
          <span className="body-sm text-charcoal">
            Page {page + 1} of {data.data.totalPages}
          </span>
          <button 
            className="btn-outline btn-sm" 
            disabled={page >= data.data.totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </ManagerLayout>
  );
}
