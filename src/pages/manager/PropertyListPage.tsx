// PropertyListPage.tsx — SCR-33: Property List
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { propertyApi, PropertySummary } from '../../api/propertyApi';
import { StatusBadge, formatDate } from './_propertyShared';

const PAGE_SIZE = 10;

export default function PropertyListPage() {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [page, setPage]             = useState(0);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotal]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PropertySummary | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyApi.getAll({
        page,
        size: PAGE_SIZE,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setProperties(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.totalElements);
      }
    } catch {
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => { fetchProperties(); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchProperties, search]);

  // Reset về trang 0 khi filter thay đổi
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await propertyApi.delete(id);
      setDeleteConfirm(null);
      fetchProperties();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete property.';
      setError(msg);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <ManagerLayout>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-md">Properties</h1>
          <p className="body-sm text-charcoal" style={{ marginTop: 2 }}>
            {loading ? '...' : `${totalElements} propert${totalElements === 1 ? 'y' : 'ies'} total`}
          </p>
        </div>
        <Link to="/manager/properties/add" className="btn-primary btn-sm" id="btn-add-property">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Property
        </Link>
      </div>

      {/* ── Error alert ── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
          <button onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Filter Row ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--ash)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="prop-search"
            className="input"
            placeholder="Search by name or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>
        <select
          id="prop-status-filter"
          className="select"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Property Name</th>
              <th>Address</th>
              <th style={{ textAlign: 'center' }}>Floors</th>
              <th style={{ textAlign: 'center' }}>Rooms</th>
              <th style={{ textAlign: 'center' }}>Available</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 8 }} /></td>
                  ))}
                </tr>
              ))
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--ash)' }}>
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <p className="body-sm">No properties found.</p>
                    {(search || statusFilter) && (
                      <button className="btn-ghost btn-sm" onClick={() => { setSearch(''); setStatus(''); }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              properties.map((p, idx) => (
                <tr key={p.id} className="animate-fade-in">
                  <td style={{ color: 'var(--ash)', fontSize: 13 }}>{page * PAGE_SIZE + idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--charcoal)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📍 {p.address}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.totalFloors}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.totalRooms}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>{p.availableRooms}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ color: 'var(--charcoal)', fontSize: 13 }}>{formatDate(p.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <Link to={`/manager/properties/${p.id}`} className="btn-ghost btn-sm"
                        id={`btn-view-${p.id}`} style={{ padding: '0 10px' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View
                      </Link>
                      <Link to={`/manager/properties/${p.id}/edit`} className="btn-ghost btn-sm"
                        id={`btn-edit-${p.id}`} style={{ padding: '0 10px' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </Link>
                      <button className="btn-ghost btn-sm" id={`btn-delete-${p.id}`}
                        onClick={() => setDeleteConfirm(p)}
                        style={{ padding: '0 10px', color: 'var(--error)' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="body-sm text-charcoal">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0} id="btn-prev-page">← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const pg = totalPages <= 7 ? i : Math.max(0, page - 3) + i;
              if (pg >= totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)} id={`btn-page-${pg}`}
                  className="btn-ghost btn-sm"
                  style={pg === page ? { background: 'var(--primary)', color: '#fff' } : {}}>
                  {pg + 1}
                </button>
              );
            })}
            <button className="btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1} id="btn-next-page">Next →</button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }} onClick={() => setDeleteConfirm(null)}>
          <div className="card-lg animate-scale-in"
            style={{ maxWidth: 440, width: '100%', padding: 32 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="heading-sm" style={{ marginBottom: 6 }}>Delete Property</h3>
                <p className="body-sm text-charcoal">
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                  This action cannot be undone. All rooms must be removed first.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)} id="btn-cancel-delete">Cancel</button>
              <button className="btn-danger"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting === deleteConfirm.id}
                id="btn-confirm-delete">
                {deleting === deleteConfirm.id ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
