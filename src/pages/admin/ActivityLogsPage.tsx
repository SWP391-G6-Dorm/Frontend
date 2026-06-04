// SCR-79 — Activity Logs
// Entity: AuditLog · User(actor)
// Filter: action keyword · date range · action type (multi-select) · user
// Table with color-coded left borders + row expand for meta JSON

import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, formatDateTime, relTime, MOCK_AUDIT_LOGS, RoleBadge, actionBadgeStyle, actionBorderColor } from './shared';

const ACTION_TYPES = ['LOGIN', 'LOGOUT', 'PAYMENT', 'CONTRACT', 'MODERATION', 'ROLE_CHANGE'];

export default function ActivityLogsPage() {
  const [search, setSearch]           = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [userFilter, setUserFilter]   = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const filtered = MOCK_AUDIT_LOGS.filter(log => {
    const matchSearch = search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase());
    const matchAction = selectedActions.length === 0 || selectedActions.includes(log.action);
    const matchUser   = userFilter === '' ||
      log.actorName.toLowerCase().includes(userFilter.toLowerCase());
    return matchSearch && matchAction && matchUser;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Activity Logs</h1>
            <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
              AuditLog · full audit trail with entity tracking and IP logging
            </p>
          </div>
          <button
            className="btn-outline"
            style={{ height: 38, borderRadius: 9999, fontSize: 13, padding: '0 16px' }}
          >
            ⬇ Export CSV
          </button>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ padding: 20 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="input-field-rect w-full"
                style={{ paddingLeft: 36, height: 38 }}
                placeholder="Search action or user name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* User filter */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                className="input-field-rect w-full"
                style={{ paddingLeft: 36, height: 38 }}
                placeholder="Filter by user name or email…"
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              />
            </div>

            {/* Date range (decorative input) */}
            <input
              type="text"
              className="input-field-rect w-full"
              style={{ height: 38 }}
              placeholder="Date range (e.g. Nov 1 – Nov 30)"
              readOnly
            />
          </div>

          {/* Action type chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="caption font-semibold" style={{ color: 'var(--charcoal)' }}>Action type:</span>
            {ACTION_TYPES.map(action => {
              const selected = selectedActions.includes(action);
              const border = actionBorderColor(action);
              return (
                <button
                  key={action}
                  onClick={() => toggleAction(action)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: selected ? border + '22' : 'var(--surface-bone)',
                    color: selected ? border : 'var(--charcoal)',
                    border: `1.5px solid ${selected ? border : 'var(--hairline)'}`,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                  }}
                >{action}</button>
              );
            })}
            {selectedActions.length > 0 && (
              <button
                onClick={() => setSelectedActions([])}
                className="caption"
                style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >Clear</button>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
          Showing <strong>{filtered.length}</strong> of {MOCK_AUDIT_LOGS.length} log entries
        </p>

        {/* Data Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="grid border-b px-4 py-3"
            style={{ gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr 1.5fr', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address'].map(col => (
              <div key={col} className="label-sm" style={{ color: 'var(--charcoal)', fontSize: 11 }}>{col}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: 'var(--ash)' }}>
              <span style={{ fontSize: 48 }}>📋</span>
              <p className="body-sm font-semibold mt-3" style={{ color: 'var(--charcoal)' }}>No activity logs for this period</p>
              <p className="body-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            filtered.map((log, i) => (
              <div key={log.id}>
                <div
                  className="grid items-center px-4 py-3.5 border-b cursor-pointer transition-colors"
                  style={{
                    gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr 1.5fr',
                    borderColor: i < filtered.length - 1 ? 'var(--hairline)' : 'transparent',
                    borderLeft: `3px solid ${actionBorderColor(log.action)}`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                >
                  {/* Timestamp */}
                  <div>
                    <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink)' }}>
                      {formatDateTime(log.createdAt)}
                    </p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(log.createdAt)}</p>
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://i.pravatar.cc/28?img=${log.actorId.replace('u-', '')}`}
                      alt={log.actorName}
                      className="rounded-full flex-shrink-0"
                      style={{ width: 26, height: 26 }}
                    />
                    <div className="min-w-0">
                      <p className="body-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{log.actorName}</p>
                      <RoleBadge role={log.actorRole} />
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    <span style={actionBadgeStyle(log.action)}>{log.action}</span>
                  </div>

                  {/* Entity */}
                  <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{log.entityName}</p>

                  {/* Entity ID */}
                  <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ash)' }}>
                    {log.entityId.length > 12 ? log.entityId.slice(0, 12) + '…' : log.entityId}
                  </p>

                  {/* IP Address */}
                  <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--charcoal)' }}>
                    {log.ipAddress}
                  </p>
                </div>

                {/* Expanded meta JSON */}
                {expandedRow === log.id && (
                  <div
                    className="px-8 py-4 border-b"
                    style={{ borderColor: 'var(--hairline)', background: '#F8FAFC', borderLeft: `3px solid ${actionBorderColor(log.action)}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="label-sm" style={{ color: 'var(--charcoal)' }}>AuditLog.meta</span>
                      <span className="caption px-2 py-0.5 rounded" style={{ background: 'var(--surface-bone)', color: 'var(--ash)' }}>JSON · read-only</span>
                    </div>
                    <pre
                      style={{
                        background: '#1E293B', color: '#7DD3FC', padding: '12px 16px',
                        borderRadius: 8, fontSize: 12, fontFamily: 'monospace',
                        overflowX: 'auto', margin: 0,
                      }}
                    >{JSON.stringify(log.meta, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 flex-wrap">
          <p className="caption font-semibold" style={{ color: 'var(--charcoal)' }}>Border colors:</p>
          {[
            { label: 'Payment',          color: '#EA5A1E' },
            { label: 'Auth (Login/out)', color: '#0891B2' },
            { label: 'Moderation',       color: '#DC2626' },
            { label: 'Contract',         color: '#16A34A' },
            { label: 'Other',            color: '#94A3B8' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div style={{ width: 12, height: 12, background: item.color, borderRadius: 2 }} />
              <span className="caption" style={{ color: 'var(--charcoal)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
