// ─── SCR-63: Review Management ────────────────────────────────────────────────
import { useState } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { REVIEWS, StarDisplay } from './_sharedAdminData';

export function ReviewMgmtPage() {
  const [reviews, setReviews] = useState(REVIEWS);

  function toggle(id: string) {
    setReviews(p => p.map(r => r.id === id ? { ...r, visible: !r.visible } : r));
  }

  return (
    <ManagerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Review Management</h1>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Room</th><th>Rating</th><th>Comment</th><th>Date</th><th>Visible</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.customer}</td>
                <td className="text-charcoal">{r.roomNumber}</td>
                <td><StarDisplay rating={r.rating} /></td>
                <td className="text-charcoal" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</td>
                <td className="text-charcoal">{new Date(r.createdAt).toLocaleDateString('en-US')}</td>
                <td><span className={`badge ${r.visible ? 'badge-success' : 'badge-neutral'}`}>{r.visible ? 'Visible' : 'Hidden'}</span></td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => toggle(r.id)} style={{ color: r.visible ? 'var(--error)' : 'var(--success)' }}>
                    {r.visible ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerLayout>
  );
}
