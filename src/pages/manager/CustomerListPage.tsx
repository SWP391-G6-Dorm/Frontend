// ─── SCR-53: Customer List ────────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { Badge } from './_sharedAdminData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/usersApi';

export function CustomerListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_customers', page, size, search],
    queryFn: () => usersApi.getAllCustomers({ page, size, search: search.trim() || undefined })
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

  const list = data?.data?.content || [];

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Customer Management</h1>
      </div>
      <div style={{ marginBottom: 16, maxWidth: 340 }}>
        <input className="input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
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
          <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span className="body-sm text-charcoal">Page {page + 1} of {data.data.totalPages}</span>
          <button className="btn-outline btn-sm" disabled={page >= data.data.totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </ManagerLayout>
  );
}
