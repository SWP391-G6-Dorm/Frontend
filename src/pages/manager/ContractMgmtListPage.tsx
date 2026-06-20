import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '../../api/contractApi';

function SBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    ACTIVE: { cls: 'badge-success', l: 'Active' },
    COMPLETED: { cls: 'badge-neutral', l: 'Completed' },
    CANCELLED: { cls: 'badge-error', l: 'Cancelled' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function ContractMgmtListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const size = 10;
  const navigate = useNavigate();

  const TABS = ['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get('bookingId');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_contracts', page, size, statusFilter, search],
    queryFn: () => contractApi.getAllContracts({ page, size, status: statusFilter, search: search.trim() || undefined }),
    enabled: !bookingIdFromUrl
  });

  useEffect(() => {
    if (bookingIdFromUrl) {
        contractApi.getContractByBookingId(bookingIdFromUrl).then(res => {
            if (res.success && res.data) {
                navigate(`/manager/contracts/${res.data.id}`, { replace: true });
            } else {
                alert("Không thể tải hợp đồng: " + (res as any).message);
                navigate('/manager/contracts', { replace: true });
            }
        }).catch(err => {
            const msg = err.response?.data?.message || err.message;
            alert("Lỗi hệ thống: " + msg);
            navigate('/manager/contracts', { replace: true });
        });
    }
  }, [bookingIdFromUrl, navigate]);

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Contract Management</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <input 
          className="input" 
          style={{ maxWidth: 320, flex: 1 }} 
          placeholder="Search by customer or room..." 
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
              <th>Room</th>
              <th>Total</th>
              <th>Generated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Loading contracts...</td></tr>
            ) : isError ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: 'var(--error)' }}>Error loading contracts</td></tr>
            ) : data?.data?.content.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No contracts found</td></tr>
            ) : (
              data?.data?.content.map(c => (
                <tr key={c.id}>
                  <td><span className="code-sm" title={c.id}>{c.id.substring(0, 8)}...</span></td>
                  <td><Link to={`/manager/bookings/${c.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }} title={c.bookingId}>{c.bookingId.substring(0, 8)}...</Link></td>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{c.customerName}</p>
                    <p style={{ fontSize: 11, color: 'var(--ash)' }}>{c.customerEmail}</p>
                  </td>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{c.roomNumber}</p>
                    <p style={{ fontSize: 11, color: 'var(--ash)' }}>{c.propertyName}</p>
                  </td>
                  <td style={{ fontWeight: 700 }}>₫{c.totalAmount.toLocaleString()}</td>
                  <td className="text-charcoal">{new Date(c.generatedAt).toLocaleDateString('en-US')}</td>
                  <td><SBadge s={c.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link to={`/manager/contracts/${c.id}`} className="btn-ghost btn-sm">View</Link>
                      <Link to={`/manager/contracts/${c.id}/resend`} className="btn-outline btn-sm">Resend</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
