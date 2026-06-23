// ─── SCR-53: Customer List ────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { Badge } from './_sharedAdminData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/usersApi';

export function CustomerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || 'ALL';
  const pageParam = parseInt(searchParams.get('page') || '0', 10);
  const size = 10;

  const [searchInput, setSearchInput] = useState(searchParam);
  const queryClient = useQueryClient();

  // Sync searchInput when URL search changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Debounced search effect
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
          next.set('page', '0'); // reset page to 0 on search
          return next;
        });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, searchParam, setSearchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_customers', pageParam, size, statusParam, searchParam],
    queryFn: () => usersApi.getAllCustomers({
      page: pageParam,
      size,
      status: statusParam !== 'ALL' ? statusParam : undefined,
      search: searchParam.trim() || undefined
    })
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => usersApi.updateCustomerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager_customers'] });
    },
    onError: () => {
      alert("Cập nhật trạng thái thất bại");
    }
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
      next.set('page', '0'); // reset page to 0
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
        <h1 className="heading-md">Customer Management</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 260, flex: 1, maxWidth: 340 }}>
          <input
            className="input"
            placeholder="Search customers by name or email..."
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
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Bookings</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : isError ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--error)' }}>Error loading data</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No customers found</td></tr>
            ) : (
              list.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <p style={{ fontWeight: 700, fontSize: 13 }}>{c.fullName}</p>
                    <p style={{ fontSize: 11, color: 'var(--ash)' }}>{c.email}</p>
                  </td>
                  <td className="text-charcoal">{c.phone || 'N/A'}</td>
                  <td><span className="badge badge-neutral">{c.bookingCount} bookings</span></td>
                  <td><Badge s={c.status} /></td>
                  <td className="text-charcoal">{new Date(c.createdAt).toLocaleDateString('en-US')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link to={`/manager/customers/${c.id}`} className="btn-ghost btn-sm">View</Link>
                      {c.status === 'ACTIVE' ? (
                        <button className="btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => statusMutation.mutate({ id: c.id, status: 'SUSPENDED' })} disabled={statusMutation.isPending}>Suspend</button>
                      ) : (
                        <button className="btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={() => statusMutation.mutate({ id: c.id, status: 'ACTIVE' })} disabled={statusMutation.isPending}>Activate</button>
                      )}
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
          <button className="btn-outline btn-sm" disabled={pageParam === 0} onClick={() => handlePageChange(pageParam - 1)}>Prev</button>
          <span className="body-sm text-charcoal">Page {pageParam + 1} of {data.data.totalPages}</span>
          <button className="btn-outline btn-sm" disabled={pageParam >= data.data.totalPages - 1} onClick={() => handlePageChange(pageParam + 1)}>Next</button>
        </div>
      )}
    </ManagerLayout>
  );
}
