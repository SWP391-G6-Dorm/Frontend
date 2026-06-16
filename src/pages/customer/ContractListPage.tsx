import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const CONTRACTS = [
  { id: 'C001', bookingId: 'B001', roomNumber: 'Villa 01', propertyName: 'Sunset Resort Đà Nẵng', checkInDate: '2026-07-10', checkOutDate: '2026-07-13', totalAmount: 7500000, generatedAt: '2026-06-14T10:35:00', status: 'ACTIVE', fileUrl: '#' },
  { id: 'C002', bookingId: 'B003', roomNumber: 'Suite 03', propertyName: 'Hội An Garden Villa', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', totalAmount: 5400000, generatedAt: '2026-03-22T11:00:00', status: 'COMPLETED', fileUrl: '#' },
];

export default function ContractListPage() {
  return (
    <CustomerLayout>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>My Contracts</h1>
      {CONTRACTS.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No contracts yet</h3>
          <p className="body-md text-charcoal">Contracts are generated automatically after deposit payment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CONTRACTS.map(c => (
            <div key={c.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, background: 'var(--surface-bone)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Contract #{c.id}</span>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>{c.status}</span>
                  </div>
                  <p className="body-sm text-charcoal">{c.roomNumber} · {c.propertyName}</p>
                  <p className="body-sm text-charcoal">📅 {c.checkInDate} → {c.checkOutDate}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>₫{c.totalAmount.toLocaleString()}</p>
                  <p className="body-sm text-charcoal">Generated {new Date(c.generatedAt).toLocaleDateString('en-US')}</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                    <Link to={`/customer/contracts/${c.id}`} className="btn-outline btn-sm">View</Link>
                    <a href={c.fileUrl} download className="btn-ghost btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}
