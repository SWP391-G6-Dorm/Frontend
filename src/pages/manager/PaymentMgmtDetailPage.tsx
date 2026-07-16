import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../api/paymentApi';

function SBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    PENDING: { cls: 'badge-warning', l: 'Pending' },
    PAID: { cls: 'badge-success', l: 'Paid' },
    FAILED: { cls: 'badge-error', l: 'Failed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function PaymentMgmtDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_payment', id],
    queryFn: () => paymentApi.getPaymentDetail(id!),
    enabled: !!id,
  });

  if (isLoading) return <ManagerLayout><div style={{ padding: 40 }}>Loading payment details...</div></ManagerLayout>;
  if (isError || !data?.data) return <ManagerLayout><div style={{ padding: 40, color: 'var(--error)' }}>Error loading payment or not found.</div></ManagerLayout>;

  const p = data.data;

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/payments" className="text-primary" style={{ textDecoration: 'none' }}>Payments</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{p.id.substring(0, 8)}...</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Payment Detail</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1000 }}>
        <div className="card-lg" style={{ padding: 28 }}>
          <h2 className="heading-sm" style={{ marginBottom: 20 }}>Transaction Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { l: 'Payment ID', v: p.id },
              { l: 'Booking ID', v: p.bookingId, link: `/manager/bookings/${p.bookingId}` },
              { l: 'Customer', v: p.customerName },
              { l: 'Type', v: p.type === 'DEPOSIT' ? 'Deposit (40%)' : 'Remaining Balance (60%)' },
              { l: 'Method', v: p.method.replace('_', ' ') },
              { l: 'Amount', v: `₫${p.amount.toLocaleString()}` },
              { l: 'Status', v: null },
              { l: 'Created At', v: new Date(p.createdAt).toLocaleString('en-US') },
              { l: 'Verified By', v: p.verifiedByName || '—' },
              { l: 'Verified At', v: p.verifiedAt ? new Date(p.verifiedAt).toLocaleString('en-US') : '—' },
            ].map(row => (
              <div key={row.l} style={{ wordBreak: 'break-all' }}>
                <p className="body-sm text-charcoal">{row.l}</p>
                {row.v === null ? (
                  <div style={{ marginTop: 4 }}><SBadge s={p.status} /></div>
                ) : row.link ? (
                  <p style={{ fontWeight: 600, marginTop: 4 }}><Link to={row.link} className="text-primary">{row.v}</Link></p>
                ) : (
                  <p style={{ fontWeight: 600, marginTop: 4 }}>{row.v}</p>
                )}
              </div>
            ))}
          </div>
          
          {p.verificationNote && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--surface-bone)', borderRadius: 8 }}>
              <p className="body-sm text-charcoal" style={{ fontWeight: 600 }}>Verification Notes</p>
              <p className="body-md" style={{ marginTop: 4 }}>{p.verificationNote}</p>
            </div>
          )}

          {p.status === 'PENDING' && (
            <div style={{ marginTop: 24 }}>
              <Link to={`/manager/payments/${p.id}/verify`} className="btn-primary">Verify This Payment</Link>
            </div>
          )}
        </div>

        <div className="card-lg" style={{ padding: 28 }}>
          <h2 className="heading-sm" style={{ marginBottom: 20 }}>Receipt Document</h2>
          {p.receiptUrl ? (
             <img src={p.receiptUrl} alt="Receipt" style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--hairline)' }} />
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface-bone)', borderRadius: 8, border: '1px dashed var(--ash)' }}>
              <svg style={{ margin: '0 auto 12px', color: 'var(--ash)' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p className="text-charcoal">Chưa có biên lai đính kèm</p>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
