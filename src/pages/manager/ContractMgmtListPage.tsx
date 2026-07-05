import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { contractApi, ContractSummaryResponse } from '../../api/contractApi';
import { DataTable, StatusBadge } from '../../components/ui';

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

  const columns = [
    { header: 'ID', accessor: (c: ContractSummaryResponse) => <span className="code-sm" title={c.id}>{c.id.substring(0, 8)}...</span> },
    { header: 'Booking ID', accessor: (c: ContractSummaryResponse) => <Link to={`/manager/bookings/${c.bookingId}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }} title={c.bookingId}>{c.bookingId.substring(0, 8)}...</Link> },
    { header: 'Customer', accessor: (c: ContractSummaryResponse) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{c.customerName}</p>
        <p style={{ fontSize: 11, color: 'var(--ash)', margin: 0 }}>{c.customerEmail}</p>
      </div>
    )},
    { header: 'Room', accessor: (c: ContractSummaryResponse) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{c.roomNumber}</p>
        <p style={{ fontSize: 11, color: 'var(--ash)', margin: 0 }}>{c.propertyName}</p>
      </div>
    )},
    { header: 'Total', accessor: (c: ContractSummaryResponse) => <span style={{ fontWeight: 700 }}>₫{c.totalAmount.toLocaleString()}</span> },
    { header: 'Generated', accessor: (c: ContractSummaryResponse) => <span className="text-charcoal">{new Date(c.generatedAt).toLocaleDateString('en-US')}</span> },
    { header: 'Status', accessor: (c: ContractSummaryResponse) => <StatusBadge status={c.status} variant={c.status === 'ACTIVE' ? 'success' : c.status === 'CANCELLED' ? 'danger' : 'neutral'} /> }
  ];

  const actions = [
    { label: 'View', onClick: (c: ContractSummaryResponse) => navigate(`/manager/contracts/${c.id}`) },
    { label: 'Resend', onClick: (c: ContractSummaryResponse) => navigate(`/manager/contracts/${c.id}/resend`) }
  ];

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



      <div style={{ marginBottom: 20 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading contracts...</div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--error)' }}>Error loading contracts</div>
        ) : (
          <DataTable 
            columns={columns}
            data={data?.data?.content || []}
            keyExtractor={(c) => c.id}
            actions={actions}
          />
        )}
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
