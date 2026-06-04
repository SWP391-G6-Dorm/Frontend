import { Link, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-15 — Notification Detail
// Entity: Notification — updates Notification.isRead = true on view
// Fields: Notification.title · content · isRead · createdAt

const MOCK_NOTIFICATIONS: Record<string, { id: string; title: string; content: string; isRead: boolean; createdAt: string; type: string }> = {
  'n-001': { id: 'n-001', title: 'Your October bill is ready', content: 'Your bill for October 2025 totalling ₫4,200,000 is now available. The breakdown is as follows:\n\n- Room rent: ₫3,500,000\n- Electricity: ₫420,000 (120 kWh × ₫3,500)\n- Water: ₫80,000 (8 m³ × ₫10,000)\n- Service fee: ₫200,000\n\nTotal: ₫4,200,000\nDue date: November 10, 2025\n\nPlease make payment before the due date to avoid late fees. You can pay via VNPay, bank transfer, or cash at the management office.', isRead: false, createdAt: '2025-10-28T08:30:00Z', type: 'bill' },
  'n-002': { id: 'n-002', title: 'Maintenance ticket updated', content: 'Your maintenance ticket #MT-042 (Broken AC — Room A-301) has been updated to IN_PROGRESS. A technician has been scheduled to visit on November 2, 2025 between 9:00 AM – 12:00 PM. Please ensure someone is present in the room during this time.', isRead: false, createdAt: '2025-10-26T15:00:00Z', type: 'maintenance' },
  'n-003': { id: 'n-003', title: 'Contract renewal reminder', content: 'Your contract (C-2024-001) for Room A-301 at Sunset Apartments expires on January 31, 2026. This is an advance notice to give you sufficient time to discuss renewal terms with your landlord.\n\nIf you wish to renew, please contact your landlord or visit the management office at least 30 days before the expiry date.\n\nIf you plan to vacate, please submit a move-out notice 30 days in advance as per your contract terms.', isRead: false, createdAt: '2025-10-22T09:00:00Z', type: 'contract' },
};

const TYPE_ICON: Record<string, string> = { bill: '💳', maintenance: '🔧', contract: '📄', payment: '✅', rental: '🏠', viewing: '📅', default: '🔔' };
const TYPE_COLOR: Record<string, string> = { bill: '#fde8e3', maintenance: '#fef3c7', contract: '#e0f2fe', payment: '#dcfce7', rental: '#fde8e3', viewing: '#ede9fe', default: 'var(--surface-bone)' };
const CONTEXT_ACTIONS: Record<string, { label: string; path: string }> = {
  bill: { label: '💳 View Bill', path: '/tenant/bills/b-001' },
  maintenance: { label: '🔧 Open Ticket', path: '/tenant/maintenance/mt-042' },
  contract: { label: '📄 View Contract', path: '/tenant/contracts/c-001' },
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notif = id ? MOCK_NOTIFICATIONS[id] : null;

  if (!notif) {
    return (
      <TenantLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">❓</div>
          <h2 className="heading-md mb-2" style={{ color: 'var(--ink)' }}>Notification not found</h2>
          <Link to="/tenant/notifications" className="btn-primary mt-4">Back to Notifications</Link>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/tenant/notifications" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Notifications</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }} className="truncate">{notif.title}</span>
        </nav>

        <div className="card" style={{ padding: 32 }}>
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full text-2xl"
              style={{ width: 56, height: 56, background: TYPE_COLOR[notif.type] ?? TYPE_COLOR.default }}
            >
              {TYPE_ICON[notif.type] ?? TYPE_ICON.default}
            </div>
            <div className="flex-1">
              <h1 className="heading-md mb-1" style={{ color: 'var(--ink)' }}>{notif.title}</h1>
              <p className="caption" style={{ color: 'var(--ash)' }}>
                Received: {new Date(notif.createdAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div
            className="rounded-lg p-5 mb-6"
            style={{ background: 'var(--surface-bone)', whiteSpace: 'pre-wrap' }}
          >
            <p className="body-lg" style={{ color: 'var(--body)', lineHeight: 1.7 }}>{notif.content}</p>
          </div>

          {/* Context action */}
          {CONTEXT_ACTIONS[notif.type] && (
            <div className="mb-6">
              <Link
                to={CONTEXT_ACTIONS[notif.type].path}
                className="btn-primary"
                style={{ height: 44, padding: '0 24px', fontSize: 14, textDecoration: 'none' }}
              >
                {CONTEXT_ACTIONS[notif.type].label}
              </Link>
            </div>
          )}

          <div className="border-t pt-4" style={{ borderColor: 'var(--hairline)' }}>
            <Link to="/tenant/notifications" className="btn-ghost flex items-center gap-2"
              style={{ color: 'var(--charcoal)', textDecoration: 'none', display: 'inline-flex' }}>
              ← Back to Notifications
            </Link>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
