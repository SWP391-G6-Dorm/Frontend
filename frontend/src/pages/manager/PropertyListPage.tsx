// PropertyListPage.tsx — SCR-33: Property List
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { propertyApi, PropertySummary } from '../../api/propertyApi';
import { StatusBadge, formatDate } from './_propertyShared';
import { DataTable } from '../../components/ui';

const PAGE_SIZE = 10;

export default function PropertyListPage() {
  const navigate = useNavigate();
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

  const columns = [
    { header: '#', accessor: (p: PropertySummary) => <span style={{ color: 'var(--ash)', fontSize: 13 }}>-</span> },
    { header: 'Property Name', accessor: (p: PropertySummary) => <span className="font-semibold">{p.name}</span> },
    { header: 'Address', accessor: (p: PropertySummary) => <span className="text-charcoal" style={{ maxWidth: 260, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {p.address}</span> },
    { header: 'Floors', accessor: (p: PropertySummary) => <span className="font-semibold">{p.totalFloors}</span> },
    { header: 'Rooms', accessor: (p: PropertySummary) => <span className="font-semibold">{p.totalRooms}</span> },
    { header: 'Available', accessor: (p: PropertySummary) => <span style={{ fontWeight: 600, color: 'var(--success)' }}>{p.availableRooms}</span> },
    { header: 'Status', accessor: (p: PropertySummary) => <StatusBadge status={p.status} /> },
    { header: 'Created', accessor: (p: PropertySummary) => <span className="text-charcoal" style={{ fontSize: 13 }}>{formatDate(p.createdAt)}</span> }
  ];

  const actions = [
    { label: 'View', onClick: (p: PropertySummary) => navigate(`/manager/properties/${p.id}`) },
    { label: 'Edit', onClick: (p: PropertySummary) => navigate(`/manager/properties/${p.id}/edit`) },
    { label: 'Delete', onClick: (p: PropertySummary) => setDeleteConfirm(p) }
  ];

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
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
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
      <div style={{ marginBottom: 20 }}>
        {loading && properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div>
        ) : (
          <DataTable 
            columns={columns}
            data={properties}
            keyExtractor={(p) => p.id}
            actions={actions}
          />
        )}
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
