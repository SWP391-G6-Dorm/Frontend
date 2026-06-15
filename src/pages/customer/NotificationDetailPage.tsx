import { Link, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

const NOTIFS = [
  { id: 'N1', title: 'Booking Confirmed', content: 'Your booking B001 for Villa 01 at Sunset Resort Đà Nẵng has been confirmed. Check-in on July 10, 2026.', type: 'BOOKING_CONFIRMED', isRead: false, createdAt: '2026-06-14T10:30:00' },
  { id: 'N2', title: 'Contract Generated', content: 'Your accommodation contract for booking B001 has been generated and sent to your email address.', type: 'CONTRACT_GENERATED', isRead: false, createdAt: '2026-06-14T10:32:00' },
  { id: 'N3', title: 'Payment Verified', content: 'Your deposit payment of ₫3,000,000 for booking B001 has been verified by the manager.', type: 'PAYMENT_CONFIRMED', isRead: true, createdAt: '2026-06-13T14:00:00' },
  { id: 'N4', title: 'Maintenance Update', content: 'Your maintenance ticket M001 (Air conditioner) has been updated to IN PROGRESS.', type: 'MAINTENANCE_UPDATED', isRead: true, createdAt: '2026-06-14T08:00:00' },
];

function NotifIcon({ type }: { type: string }) {
  const m: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    BOOKING_CONFIRMED:   { bg: '#dcfce7', color: '#2b9a66', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> },
    CONTRACT_GENERATED:  { bg: '#dbeafe', color: '#2563eb', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
    PAYMENT_CONFIRMED:   { bg: '#ede9fe', color: '#7c3aed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    MAINTENANCE_UPDATED: { bg: '#fef3c7', color: '#d97706', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  };
  const s = m[type] || { bg: 'var(--surface-bone)', color: 'var(--charcoal)', icon: '🔔' };
  return (
    <div style={{ width: 42, height: 42, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: s.color }}>
      {s.icon}
    </div>
  );
}

export default function NotificationDetailPage() {
  const { id } = useParams();
  const n = NOTIFS.find(x => x.id === id) || NOTIFS[0];

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/notifications" className="text-primary" style={{ textDecoration: 'none' }}>Notifications</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Detail</span>
        </div>

        <div className="card-lg" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
            <NotifIcon type={n.type} />
            <div style={{ flex: 1 }}>
              <h1 className="heading-md" style={{ marginBottom: 4 }}>{n.title}</h1>
              <p className="body-sm text-charcoal">{new Date(n.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <div className="divider" style={{ marginBottom: 20 }} />
          <p className="body-lg text-body" style={{ lineHeight: 1.75, marginBottom: 28 }}>{n.content}</p>
          <Link to="/customer/notifications" className="btn-outline btn-sm">← Back to Notifications</Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
