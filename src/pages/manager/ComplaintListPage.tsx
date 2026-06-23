// ─── SCR-55: Complaint List ───────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { Badge } from './_sharedAdminData';
import { useQuery } from '@tanstack/react-query';
import { complaintsApi } from '../../api/complaintsApi';

export function ComplaintListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || 'ALL';
  const pageParam = parseInt(searchParams.get('page') || '0', 10);
  const size = 10;

  const [searchInput, setSearchInput] = useState(searchParam);

  // Sync search input with URL search param
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchInput.trim() !== searchParam) {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '0'); // reset page to 0 on search change
          return next;
        });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, searchParam, setSearchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_complaints', pageParam, size, statusParam, searchParam],
    queryFn: () => complaintsApi.getComplaints({
      page: pageParam,
      size,
      status: statusParam !== 'ALL' ? statusParam : undefined,
      search: searchParam.trim() || undefined
    })
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newStatus !== 'ALL') {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      next.set('page', '0'); // reset page to 0 on status change
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const list = data?.data?.content || [];

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Complaint Management</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 260, flex: 1, maxWidth: 340 }}>
          <input
            className="input"
            placeholder="Search complaints by subject or customer name..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <div style={{ width: 180 }}>
          <select
            className="select"
            value={statusParam}
            onChange={handleStatusChange}
            style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--hairline)', background: '#fff', fontSize: 14, fontWeight: 500 }}
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Complaint ID</th><th>Customer</th><th>Subject</th><th>Status</th><th>Submitted</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : isError ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--error)' }}>Error loading data</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No complaints found</td></tr>
            ) : (
              list.map(c => (
                <tr key={c.id}>
                  <td><span className="code-sm">#{c.id.substring(0, 8).toUpperCase()}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.customerName}</td>
                  <td className="text-charcoal">{c.subject}</td>
                  <td><Badge s={c.status} /></td>
                  <td className="text-charcoal">{new Date(c.createdAt).toLocaleDateString('en-US')}</td>
                  <td><Link to={`/manager/complaints/${c.id}`} className="btn-ghost btn-sm">View</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.data && data.data.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button className="btn-outline btn-sm" disabled={pageParam === 0} onClick={() => handlePageChange(pageParam - 1)}>Prev</button>
          <span className="body-sm text-charcoal">Page {pageParam + 1} of {data.data.totalPages}</span>
          <button className="btn-outline btn-sm" disabled={pageParam >= data.data.totalPages - 1} onClick={() => handlePageChange(pageParam + 1)}>Next</button>
        </div>
      )}
    </ManagerLayout>
  );
}
