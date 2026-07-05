import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api/bookingApi';

const STATUS_MAP: Record<string, { cls: string; l: string }> = {
  PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending Deposit' },
  CONFIRMED:       { cls: 'badge-success', l: 'Confirmed' },
  CHECKED_IN:      { cls: 'badge-info',    l: 'Checked In' },
  CHECKED_OUT:     { cls: 'badge-purple',  l: 'Checked Out' },
  CANCELLED:       { cls: 'badge-error',   l: 'Cancelled' },
};

function SBadge({ s }: { s: string }) {
  const v = STATUS_MAP[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

export default function BookingMgmtDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookingDetail', id],
    queryFn: () => bookingApi.getBookingDetail(id!),
    enabled: !!id
  });

  const checkInMutation = useMutation({
    mutationFn: () => bookingApi.markCheckedIn(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['managerBookings'] });
      alert('Checked in successfully!');
    },
    onError: () => alert('Failed to check in')
  });

  const checkOutMutation = useMutation({
    mutationFn: () => bookingApi.markCheckedOut(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['managerBookings'] });
      alert('Checked out successfully!');
    },
    onError: () => alert('Failed to check out')
  });

  if (isLoading) return <ManagerLayout><p style={{ padding: 20 }}>Loading...</p></ManagerLayout>;
  if (isError || !data?.data) return <ManagerLayout><p style={{ padding: 20 }}>Error loading booking details</p></ManagerLayout>;

  const b = data.data;
  const nights = Math.ceil((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000);

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/bookings" className="text-primary" style={{ textDecoration: 'none' }}>Bookings</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>#{b.id.substring(0,8)}</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Booking #{b.id.substring(0,8)}</h1>
        <SBadge s={b.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Customer</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><p className="body-sm text-charcoal">Name</p><p style={{ fontWeight: 600 }}>{b.customerName}</p></div>
              <div><p className="body-sm text-charcoal">Email</p><p style={{ fontWeight: 600 }}>{b.customerEmail}</p></div>
              {b.customerPhone && <div><p className="body-sm text-charcoal">Phone</p><p style={{ fontWeight: 600 }}>{b.customerPhone}</p></div>}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Booking Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { l: 'Room', v: b.roomNumber },
                { l: 'Type', v: b.roomType },
                { l: 'Property', v: b.propertyName },
                { l: 'Guests', v: `${b.guestCount}` },
                { l: 'Check-in', v: b.checkInDate },
                { l: 'Check-out', v: b.checkOutDate },
                { l: 'Duration', v: `${nights} nights` },
                { l: 'Total Amount', v: `₫${b.totalAmount?.toLocaleString()}` },
                { l: 'Deposit (40%)', v: `₫${b.depositAmount?.toLocaleString()}` },
                { l: 'Remaining (60%)', v: `₫${b.remainingAmount?.toLocaleString()}` },
              ].map(r => (
                <div key={r.l}><p className="body-sm text-charcoal">{r.l}</p><p style={{ fontWeight: 600, marginTop: 2 }}>{r.v}</p></div>
              ))}
            </div>
            {b.specialRequests && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p className="body-sm text-charcoal">Special Requests</p>
                <p className="body-md" style={{ marginTop: 2 }}>{b.specialRequests}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card-lg" style={{ padding: 20 }}>
            <h3 className="heading-sm" style={{ marginBottom: 14 }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {b.status === 'CONFIRMED' && (
                <button 
                  className="btn-primary" 
                  onClick={() => { if(window.confirm('Mark this booking as checked in?')) checkInMutation.mutate() }}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? 'Processing...' : 'Mark Checked-in'}
                </button>
              )}
              {b.status === 'CHECKED_IN' && (
                <button 
                  className="btn-primary" 
                  onClick={() => { if(window.confirm('Mark this booking as checked out?')) checkOutMutation.mutate() }}
                  disabled={checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? 'Processing...' : 'Mark Checked-out'}
                </button>
              )}
              
              <Link to={`/manager/payments?bookingId=${b.id}`} className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10, marginTop: b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' ? 10 : 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                View Payments
              </Link>
              <Link to={`/manager/contracts?bookingId=${b.id}`} className="btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                View Contract
              </Link>
              <Link to={`/manager/customers/${b.customerId}`} className="btn-ghost" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Customer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
