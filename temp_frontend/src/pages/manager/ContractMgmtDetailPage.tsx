import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '../../api/contractApi';
import { useState } from 'react';

function SBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    ACTIVE: { cls: 'badge-success', l: 'Active' },
    COMPLETED: { cls: 'badge-neutral', l: 'Completed' },
    CANCELLED: { cls: 'badge-error', l: 'Cancelled' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function ContractMgmtDetailPage() {
  const { id } = useParams();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_contract', id],
    queryFn: () => contractApi.getContractDetail(id!),
    enabled: !!id,
  });

  const handleDownload = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      await contractApi.downloadContractPdf(id, `Contract_${id}.pdf`);
    } catch (error) {
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <ManagerLayout><div style={{ padding: 40 }}>Loading contract details...</div></ManagerLayout>;
  if (isError || !data?.data) return <ManagerLayout><div style={{ padding: 40, color: 'var(--error)' }}>Error loading contract or not found.</div></ManagerLayout>;

  const c = data.data;
  const nights = Math.ceil((new Date(c.checkOutDate).getTime() - new Date(c.checkInDate).getTime()) / 86400000);

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/contracts" className="text-primary" style={{ textDecoration: 'none' }}>Contracts</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{c.id.substring(0, 8)}...</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Contract Details</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SBadge s={c.status} />
          <button 
            className="btn-outline btn-sm" 
            onClick={handleDownload}
            disabled={downloading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <Link to={`/manager/contracts/${c.id}/resend`} className="btn-primary btn-sm">Resend Email</Link>
        </div>
      </div>

      <div className="card-lg" style={{ padding: 32, maxWidth: 700 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { l: 'Contract ID', v: c.id },
            { l: 'Booking ID', v: c.bookingId },
            { l: 'Customer', v: c.customerName },
            { l: 'Email', v: c.customerEmail },
            { l: 'Phone', v: c.customerPhone || 'N/A' },
            { l: 'Property', v: c.propertyName },
            { l: 'Room', v: c.roomNumber },
            { l: 'Check-in', v: c.checkInDate },
            { l: 'Check-out', v: c.checkOutDate },
            { l: 'Duration', v: `${nights} nights` },
            { l: 'Deposit Amount', v: `₫${c.depositAmount.toLocaleString()}` },
            { l: 'Total Amount', v: `₫${c.totalAmount.toLocaleString()}` },
            { l: 'Generated At', v: new Date(c.generatedAt).toLocaleString('en-US') },
            { l: 'Last Sent At', v: c.sentAt ? new Date(c.sentAt).toLocaleString('en-US') : 'Not sent yet' },
          ].map(row => (
            <div key={row.l}><p className="body-sm text-charcoal">{row.l}</p><p style={{ fontWeight: 600, marginTop: 4, wordBreak: 'break-all' }}>{row.v}</p></div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
}
