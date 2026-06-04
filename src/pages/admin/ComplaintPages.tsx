// SCR-76 — Complaint Management
// SCR-77 — Complaint Detail (Admin)
// Entity: Complaint · User(reporter)

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  StatusBadge, PageHeader, formatDateTime, relTime,
  MOCK_COMPLAINTS,
} from './shared';

type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const STATUS_TABS: { key: ComplaintStatus | 'ALL'; label: string }[] = [
  { key: 'OPEN',        label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED',    label: 'Resolved' },
  { key: 'CLOSED',      label: 'Closed' },
];

// ─── SCR-76: Complaint Management ────────────────────────────────────────────

export function ComplaintManagementPage() {
  const [activeTab, setActiveTab] = useState<ComplaintStatus | 'ALL'>('OPEN');

  const filtered = MOCK_COMPLAINTS.filter(c =>
    activeTab === 'ALL' || c.status === activeTab
  );

  const countByStatus = (s: string) => MOCK_COMPLAINTS.filter(c => c.status === s).length;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        <PageHeader
          title="Complaint Management"
          sub={`${MOCK_COMPLAINTS.length} total complaints · ${countByStatus('OPEN')} open`}
        />

        {/* Tabs.Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_TABS.map(t => {
            const cnt = countByStatus(t.key);
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-full body-sm font-semibold transition-all"
                style={{
                  background: active ? 'var(--primary)' : 'var(--surface-bone)',
                  color: active ? 'white' : 'var(--charcoal)',
                  border: active ? 'none' : '1px solid var(--hairline)',
                  cursor: 'pointer',
                }}
              >
                {t.label}
                {cnt > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
                    background: active ? 'rgba(255,255,255,0.3)' : (t.key === 'OPEN' ? '#EA5A1E' : 'var(--ash)'),
                    color: active ? 'white' : 'white',
                    minWidth: 18, textAlign: 'center',
                  }}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="grid border-b px-4 py-3"
            style={{ gridTemplateColumns: '1.2fr 1.5fr 3fr 1.5fr 1.5fr 1fr', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['ID', 'Reporter', 'Subject', 'Status', 'Submitted', 'Action'].map(col => (
              <div key={col} className="label-sm" style={{ color: 'var(--charcoal)', fontSize: 11 }}>{col}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: 'var(--ash)' }}>
              <span style={{ fontSize: 48 }}>🚩</span>
              <p className="body-sm font-semibold mt-3" style={{ color: 'var(--charcoal)' }}>No complaints</p>
              <p className="body-sm mt-1">No {activeTab.toLowerCase().replace('_', ' ')} complaints found.</p>
            </div>
          ) : (
            filtered.map((complaint, i) => (
              <div
                key={complaint.id}
                className="grid items-center px-4 py-4 border-b transition-colors"
                style={{
                  gridTemplateColumns: '1.2fr 1.5fr 3fr 1.5fr 1.5fr 1fr',
                  borderColor: i < filtered.length - 1 ? 'var(--hairline)' : 'transparent',
                  borderLeft: complaint.status === 'OPEN' ? '3px solid #EA5A1E' : '3px solid transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* ID */}
                <p style={{ color: 'var(--ash)', fontFamily: 'monospace', fontSize: 12 }}>
                  {complaint.id.slice(0, 8)}
                </p>
                {/* Reporter */}
                <div>
                  <p className="body-sm font-medium" style={{ color: 'var(--ink)' }}>{complaint.userName}</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>{complaint.userEmail}</p>
                </div>
                {/* Subject */}
                <p className="body-sm" style={{
                  color: 'var(--charcoal)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16
                }}>{complaint.subject}</p>
                {/* Status */}
                <div><StatusBadge status={complaint.status} /></div>
                {/* Submitted */}
                <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(complaint.createdAt)}</p>
                {/* Action */}
                <Link
                  to={`/admin/complaints/${complaint.id}`}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'var(--surface-bone)', color: 'var(--ink)',
                    border: '1px solid var(--hairline)', textDecoration: 'none',
                    display: 'inline-block',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hairline)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                >Review →</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── SCR-77: Complaint Detail (Admin) ────────────────────────────────────────

export function ComplaintDetailPage() {
  const { id } = useParams();
  const complaint = MOCK_COMPLAINTS.find(c => c.id === id) ?? MOCK_COMPLAINTS[0];
  const [note, setNote] = useState('');
  const [currentStatus, setCurrentStatus] = useState(complaint.status);

  const TIMELINE_STEPS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const currentStep = TIMELINE_STEPS.indexOf(currentStatus);

  const handleResolve = () => setCurrentStatus('RESOLVED');
  const handleDismiss = () => setCurrentStatus('CLOSED');
  const handleInProgress = () => setCurrentStatus('IN_PROGRESS');

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/admin/complaints" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Complaints</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: 13 }}>{complaint.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT — Complaint Info */}
          <div className="lg:col-span-2 card" style={{ padding: 32 }}>
            {/* ID + Status */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--ash)' }}>{complaint.id}</span>
              <StatusBadge status={currentStatus} />
            </div>

            {/* Reporter */}
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg" style={{ background: 'var(--surface-bone)' }}>
              <div className="rounded-full flex items-center justify-center text-lg"
                style={{ width: 44, height: 44, background: 'white', border: '2px solid var(--hairline)', flexShrink: 0 }}>👤</div>
              <div className="flex-1 min-w-0">
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{complaint.userName}</p>
                <Link to={`/admin/users/${complaint.userId}`}
                  className="caption" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  {complaint.userEmail} →
                </Link>
              </div>
              <StatusBadge status="TENANT" />
            </div>

            {/* Subject */}
            <h2 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>{complaint.subject}</h2>

            {/* Description */}
            <div className="mb-6">
              <p className="label-sm mb-2" style={{ color: 'var(--charcoal)' }}>Complaint Details</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)', lineHeight: 1.8 }}>{complaint.description}</p>
            </div>

            {/* Submitted */}
            <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <span style={{ fontSize: 14 }}>🕐</span>
              <p className="caption" style={{ color: 'var(--ash)' }}>
                Submitted {formatDateTime(complaint.createdAt)} · {relTime(complaint.createdAt)}
              </p>
            </div>
          </div>

          {/* RIGHT — Resolution Panel */}
          <div className="flex flex-col gap-4">
            {/* Resolution Note */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Resolution Panel</h3>

              {/* Note textarea */}
              <div className="mb-4">
                <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>
                  Resolution Note <span className="caption" style={{ color: 'var(--ash)' }}>(admin internal)</span>
                </label>
                <textarea
                  className="input-field-rect w-full"
                  rows={4}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                  placeholder="Add internal resolution notes…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {currentStatus === 'OPEN' && (
                  <button
                    className="w-full py-2.5 rounded-full body-sm font-semibold"
                    style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', cursor: 'pointer' }}
                    onClick={handleInProgress}
                  >▶ Mark In Progress</button>
                )}
                <button
                  className="w-full py-2.5 rounded-full body-sm font-semibold"
                  style={{ background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0', cursor: 'pointer' }}
                  onClick={handleResolve}
                  disabled={currentStatus === 'RESOLVED' || currentStatus === 'CLOSED'}
                >✓ Mark Resolved</button>
                <button
                  className="btn-outline w-full"
                  style={{ borderRadius: 9999, fontSize: 14 }}
                  onClick={handleDismiss}
                  disabled={currentStatus === 'CLOSED'}
                >✕ Dismiss</button>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Status Timeline</h3>
              <div className="flex flex-col gap-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  return (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full flex items-center justify-center"
                          style={{
                            width: 28, height: 28,
                            background: done ? (active ? 'var(--primary)' : '#16A34A') : 'var(--surface-bone)',
                            border: done ? 'none' : '2px solid var(--hairline)',
                            color: done ? 'white' : 'var(--ash)',
                            fontSize: 13, fontWeight: 600, flexShrink: 0,
                          }}>
                          {done ? (active ? '●' : '✓') : '○'}
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div style={{ width: 2, height: 28, background: done ? '#16A34A' : 'var(--hairline)' }} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="body-sm font-semibold" style={{ color: done ? 'var(--ink)' : 'var(--ash)' }}>
                          {step.replace('_', ' ')}
                        </p>
                        {active && <p className="caption" style={{ color: 'var(--primary)' }}>Current status</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
