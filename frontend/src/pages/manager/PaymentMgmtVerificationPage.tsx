import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { paymentApi } from '../../api/paymentApi';

export default function PaymentMgmtVerificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_payment', id],
    queryFn: () => paymentApi.getPaymentDetail(id!),
    enabled: !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: (variables: { status: 'PAID' | 'FAILED', note: string }) => 
      paymentApi.verifyPayment(id!, variables.status, variables.note),
    onSuccess: (res) => {
      alert(res.message || "Xác minh thanh toán thành công");
      navigate('/manager/payments');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message;
      alert("Lỗi khi duyệt: " + msg);
    }
  });

  if (isLoading) return <ManagerLayout><div style={{ padding: 40 }}>Loading payment details...</div></ManagerLayout>;
  if (isError || !data?.data) return <ManagerLayout><div style={{ padding: 40, color: 'var(--error)' }}>Error loading payment or not found.</div></ManagerLayout>;

  const p = data.data;

  if (p.status !== 'PENDING') {
    return (
      <ManagerLayout>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 className="heading-md">Giao dịch này không ở trạng thái PENDING</h2>
          <p className="body-md text-charcoal" style={{ marginTop: 10 }}>Không thể duyệt giao dịch đã hoàn tất.</p>
          <Link to={`/manager/payments/${p.id}`} className="btn-primary" style={{ marginTop: 20 }}>Xem chi tiết</Link>
        </div>
      </ManagerLayout>
    );
  }

  function handleAction(action: 'PAID' | 'FAILED') {
    if (action === 'FAILED' && !notes.trim()) {
      alert("Vui lòng nhập lý do từ chối vào ô Ghi chú nội bộ.");
      return;
    }
    verifyMutation.mutate({ status: action, note: notes });
  }

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/payments" className="text-primary" style={{ textDecoration: 'none' }}>Payments</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Verify #{p.id.substring(0, 8)}...</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Payment Verification</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 className="heading-sm" style={{ marginBottom: 14 }}>Payment Receipt</h2>
            {p.receiptUrl ? (
              <img src={p.receiptUrl} alt="Receipt" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--surface-bone)' }} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p className="text-charcoal">Khách hàng chưa tải lên biên lai</p>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 14 }}>Customer Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Customer', v: p.customerName },
                { l: 'Booking ID', v: p.bookingId },
              ].map(row => (
                <div key={row.l}><p className="body-sm text-charcoal">{row.l}</p><p style={{ fontWeight: 600 }}>{row.v}</p></div>
              ))}
            </div>
            <Link to={`/manager/bookings/${p.bookingId}`} className="text-primary" style={{ fontSize: 13, display: 'inline-block', marginTop: 10 }}>Xem chi tiết Booking này &rarr;</Link>
          </div>
        </div>

        <div>
          <div className="card-lg" style={{ padding: 24, marginBottom: 16 }}>
            <h3 className="heading-sm" style={{ marginBottom: 14 }}>Payment Info</h3>
            {[
              { l: 'Payment ID', v: p.id.substring(0, 8) + '...' },
              { l: 'Type', v: p.type === 'DEPOSIT' ? 'Deposit (40%)' : 'Remaining Balance (60%)' },
              { l: 'Method', v: p.method.replace('_', ' ') },
              { l: 'Amount', v: `₫${p.amount.toLocaleString()}` },
              { l: 'Submitted', v: new Date(p.createdAt).toLocaleString('en-US') },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="body-sm text-charcoal">{row.l}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{row.v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="body-sm text-charcoal">Amount to verify</span>
                <span className="text-primary" style={{ fontWeight: 800, fontSize: 18 }}>₫{p.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card-lg" style={{ padding: 24 }}>
            <h3 className="heading-sm" style={{ marginBottom: 14 }}>Verification Action</h3>
            {p.type === 'DEPOSIT' && (
              <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 12, padding: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Duyệt cọc sẽ tự động chuyển Booking sang Đã xác nhận (CONFIRMED) và sinh Hợp đồng.
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Internal Notes (bắt buộc khi Reject)</label>
              <textarea 
                className="textarea" 
                rows={3} 
                placeholder="Ví dụ: Chưa nhận được tiền, biên lai mờ..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%', background: 'var(--success)', boxShadow: 'none' }}
                disabled={verifyMutation.isPending} 
                onClick={() => handleAction('PAID')}
              >
                {verifyMutation.isPending ? 'Processing...' : '✓ Approve Payment'}
              </button>
              <button 
                className="btn-danger" 
                style={{ width: '100%' }}
                disabled={verifyMutation.isPending} 
                onClick={() => handleAction('FAILED')}
              >
                {verifyMutation.isPending ? 'Processing...' : '✗ Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
