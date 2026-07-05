// ─── SCR-63: Review Management ────────────────────────────────────────────────
import { useState } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { REVIEWS, StarDisplay } from './_sharedAdminData';
import DataTable from '../../components/ui/DataTable';

export function ReviewMgmtPage() {
  const [reviews, setReviews] = useState(REVIEWS);

  function toggle(id: string) {
    setReviews(p => p.map(r => r.id === id ? { ...r, visible: !r.visible } : r));
  }

  const columns = [
    { header: 'Customer', accessor: (r: any) => <span style={{ fontWeight: 600 }}>{r.customer}</span> },
    { header: 'Room', accessor: (r: any) => <span className="text-charcoal">{r.roomNumber}</span> },
    { header: 'Rating', accessor: (r: any) => <StarDisplay rating={r.rating} /> },
    { header: 'Comment', accessor: (r: any) => <span className="text-charcoal" style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</span> },
    { header: 'Date', accessor: (r: any) => <span className="text-charcoal">{new Date(r.createdAt).toLocaleDateString('en-US')}</span> },
    { header: 'Visible', accessor: (r: any) => <span className={`badge ${r.visible ? 'badge-success' : 'badge-neutral'}`}>{r.visible ? 'Visible' : 'Hidden'}</span> },
    { header: 'Actions', accessor: (r: any) => (
      <button className="btn-ghost btn-sm" onClick={() => toggle(r.id)} style={{ color: r.visible ? 'var(--error)' : 'var(--success)' }}>
        {r.visible ? 'Hide' : 'Show'}
      </button>
    )}
  ];

  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Review Management</h1>
      <DataTable 
        columns={columns}
        data={reviews}
        keyExtractor={(r) => r.id}
      />
    </ManagerLayout>
  );
}
