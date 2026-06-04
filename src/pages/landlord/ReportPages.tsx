import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_MAINTENANCE, MOCK_BILLS, MOCK_ROOMS, StatusBadge, KpiCard, PageHeader, FilterBar, formatDate, formatPrice, relTime } from './shared';

// SCR-66 — Maintenance Ticket Management
// SCR-67 — Maintenance Ticket Detail
// SCR-68 — Revenue Report
// SCR-69 — Occupancy Report
// SCR-70 — Debt Report

// ─── SCR-66: Maintenance List (Landlord) ──────────────────────────────────────
export function MaintenanceManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = MOCK_MAINTENANCE
    .filter(t => status === 'ALL' || t.status === status)
    .filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantName.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Maintenance Tickets" sub={`${MOCK_MAINTENANCE.filter(t=>t.status==='OPEN').length} open`} />
        <FilterBar search={search} onSearch={setSearch}>
          <select className="input-field-rect" style={{ height: 38, width: 160, cursor: 'pointer' }}
            value={status} onChange={e => setStatus(e.target.value)}>
            {['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </FilterBar>

        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 90px', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Ticket ID', 'Title', 'Room', 'Tenant', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((ticket, i) => (
            <div key={ticket.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 90px', gap: '12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="code-md font-semibold" style={{ color: 'var(--primary)' }}>{ticket.id}</p>
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{ticket.title}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(ticket.createdAt)}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{ticket.roomNumber}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{ticket.tenantName}</p>
              <StatusBadge status={ticket.status} />
              <Link to={`/landlord/maintenance/${ticket.id}`} className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>View</Link>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-67: Maintenance Ticket Detail (Landlord) ──────────────────────────────
const STATUS_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function MaintenanceTicketManagementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticket = MOCK_MAINTENANCE.find(t => t.id === id) ?? MOCK_MAINTENANCE[0];
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [resolutionNotes, setNotes]       = useState('');
  const [loading, setLoading]             = useState(false);
  const [saved, setSaved]                 = useState(false);

  function handleUpdateStatus(newStatus: string) {
    setCurrentStatus(newStatus);
    setLoading(true);
    setTimeout(() => { setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 600);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/maintenance" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Maintenance</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{ticket.id}</span>
        </nav>

        {saved && (
          <div className="rounded-lg px-5 py-3 mb-4 flex items-center gap-2" style={{ background: '#dcfce7' }}>
            <span>✅</span><p className="body-sm font-semibold" style={{ color: 'var(--success)' }}>Status updated!</p>
          </div>
        )}

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>#{ticket.id}</h1>
              <StatusBadge status={currentStatus} />
            </div>
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{ticket.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Ticket info */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Ticket Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4 rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                {[
                  { label: 'Ticket ID', value: ticket.id, mono: true },
                  { label: 'Room',      value: ticket.roomNumber },
                  { label: 'Tenant',    value: ticket.tenantName },
                  { label: 'Submitted', value: relTime(ticket.createdAt) },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    <p className={row.mono ? 'code-md' : 'body-sm'} style={{ color: 'var(--ink)', fontWeight: 600 }}>{row.value}</p>
                  </div>
                ))}
              </div>
              <h4 className="label-sm mb-2" style={{ color: 'var(--charcoal)' }}>DESCRIPTION</h4>
              <p className="body-md" style={{ color: 'var(--body)', lineHeight: 1.7 }}>{ticket.description}</p>
            </div>

            {/* Resolution notes */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Resolution Notes</h3>
              <textarea
                className="textarea-field mb-3"
                rows={4}
                value={resolutionNotes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add resolution notes, technician details, action taken…"
              />
              <button className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}
                onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setSaved(true); }, 600); }}>
                Save Notes
              </button>
            </div>
          </div>

          {/* Status update panel */}
          <div className="flex flex-col gap-4">
            {/* Status timeline */}
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Update Status</h3>
              <div className="flex flex-col gap-2">
                {STATUS_ORDER.map(s => {
                  const idx     = STATUS_ORDER.indexOf(currentStatus);
                  const sIdx    = STATUS_ORDER.indexOf(s);
                  const active  = s === currentStatus;
                  const done    = sIdx < idx;
                  const isNext  = sIdx === idx + 1;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{ width: 28, height: 28, background: done || active ? 'var(--success)' : 'var(--surface-bone)', color: done || active ? '#fff' : 'var(--stone)' }}>
                        {done || active ? '✓' : sIdx + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <p className="body-sm" style={{ color: active ? 'var(--ink)' : done ? 'var(--success)' : 'var(--ash)', fontWeight: active ? 700 : 400 }}>
                          {s.replace('_', ' ')}
                        </p>
                        {isNext && (
                          <button type="button" className="btn-primary" style={{ height: 28, padding: '0 12px', fontSize: 11 }}
                            onClick={() => handleUpdateStatus(s)} disabled={loading}>
                            Set →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {currentStatus === 'RESOLVED' && (
              <div className="card" style={{ padding: 16 }}>
                <button type="button" className="btn-primary w-full" style={{ height: 40, justifyContent: 'center', fontSize: 13, background: 'var(--charcoal)' }}
                  onClick={() => handleUpdateStatus('CLOSED')}>
                  📁 Close Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-68: Revenue Report ────────────────────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: 'May 2025', paid: 18200000, pending: 0,      overdue: 0 },
  { month: 'Jun 2025', paid: 21500000, pending: 0,      overdue: 0 },
  { month: 'Jul 2025', paid: 19800000, pending: 0,      overdue: 0 },
  { month: 'Aug 2025', paid: 23100000, pending: 0,      overdue: 0 },
  { month: 'Sep 2025', paid: 22400000, pending: 0,      overdue: 0 },
  { month: 'Oct 2025', paid: 4080000,  pending: 5720000, overdue: 4640000 },
];

export function RevenueReportPage() {
  const [from, setFrom] = useState('2025-05');
  const [to, setTo]     = useState('2025-10');
  const totalPaid = MONTHLY_REVENUE.reduce((s, m) => s + m.paid, 0);
  const MAX = Math.max(...MONTHLY_REVENUE.map(m => m.paid + m.pending + m.overdue));

  return (
    <LandlordLayout>
      <div className="animate-fade-up flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <PageHeader title="Revenue Report" sub="Monthly revenue analysis" />
          <div className="flex gap-2">
            <button className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📄 Export PDF</button>
            <button className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📊 Export Excel</button>
          </div>
        </div>

        {/* Filter */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="label-sm block mb-1" style={{ color: 'var(--charcoal)' }}>From</label>
              <input type="month" className="input-field-rect" style={{ height: 38, width: 160 }} value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label-sm block mb-1" style={{ color: 'var(--charcoal)' }}>To</label>
              <input type="month" className="input-field-rect" style={{ height: 38, width: 160 }} value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ height: 38, padding: '0 20px', fontSize: 14, marginTop: 18 }}>Apply Filter</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard icon="💰" label="Total Revenue" value={formatPrice(totalPaid)} sub="Paid bills only" color="var(--success)" />
          <KpiCard icon="⏳" label="Pending" value={formatPrice(5720000)} sub="Awaiting payment" color="var(--warning)" />
          <KpiCard icon="⚠️" label="Overdue" value={formatPrice(4640000)} sub="Overdue" color="var(--error)" />
        </div>

        {/* Stacked bar chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="heading-sm mb-5" style={{ color: 'var(--ink)' }}>Monthly Breakdown</h3>
          <div className="flex items-end gap-4 mb-4" style={{ height: 180 }}>
            {MONTHLY_REVENUE.map(m => {
              const totalH = ((m.paid + m.pending + m.overdue) / MAX) * 160;
              const paidH = m.paid > 0 ? (m.paid / (m.paid + m.pending + m.overdue)) * totalH : 0;
              const pendH = m.pending > 0 ? (m.pending / (m.paid + m.pending + m.overdue)) * totalH : 0;
              const ovH = m.overdue > 0 ? (m.overdue / (m.paid + m.pending + m.overdue)) * totalH : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: 160 }}>
                    {ovH > 0 && <div className="w-full rounded-t" style={{ height: ovH, background: 'var(--error)', opacity: 0.8 }} />}
                    {pendH > 0 && <div className="w-full" style={{ height: pendH, background: 'var(--warning)', opacity: 0.8 }} />}
                    {paidH > 0 && <div className={`w-full ${ovH === 0 && pendH === 0 ? 'rounded-t' : ''}`} style={{ height: paidH, background: 'var(--success)' }} />}
                  </div>
                  <p className="caption" style={{ color: 'var(--ash)', fontSize: 10, textAlign: 'center' }}>{m.month.split(' ')[0]}</p>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-5">
            {[{color:'var(--success)',label:'Paid'},{color:'var(--warning)',label:'Pending'},{color:'var(--error)',label:'Overdue'}].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="rounded-full" style={{ width: 8, height: 8, background: l.color }} />
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{l.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly table */}
        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Month', 'Paid', 'Pending', 'Overdue'].map(h => <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>)}
          </div>
          {MONTHLY_REVENUE.map((m, i) => (
            <div key={m.month} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px', borderBottom: i < MONTHLY_REVENUE.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{m.month}</p>
              <p className="body-sm" style={{ color: 'var(--success)', fontWeight: 600 }}>{formatPrice(m.paid)}</p>
              <p className="body-sm" style={{ color: m.pending > 0 ? 'var(--warning)' : 'var(--ash)' }}>{formatPrice(m.pending)}</p>
              <p className="body-sm" style={{ color: m.overdue > 0 ? 'var(--error)' : 'var(--ash)' }}>{formatPrice(m.overdue)}</p>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-69: Occupancy Report ──────────────────────────────────────────────────
export function OccupancyReportPage() {
  const rooms = MOCK_ROOMS;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const rate = Math.round(occupied / rooms.length * 100);

  return (
    <LandlordLayout>
      <div className="animate-fade-up flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <PageHeader title="Occupancy Report" sub="Room utilization statistics" />
          <div className="flex gap-2">
            <button className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📄 Export PDF</button>
            <button className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📊 Export Excel</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="🏠" label="Total Rooms" value={rooms.length} />
          <KpiCard icon="✅" label="Occupied" value={occupied} color="var(--success)" />
          <KpiCard icon="🔑" label="Available" value={available} color="var(--primary)" />
          <KpiCard icon="📊" label="Occupancy Rate" value={`${rate}%`} color={rate >= 80 ? 'var(--success)' : 'var(--warning)'} />
        </div>

        {/* Stacked bar by property */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Occupancy by Property</h3>
          {[
            { name: 'Sunset Apartments', total: 4, occupied: 2 },
            { name: 'Green House',        total: 2, occupied: 1 },
          ].map(prop => {
            const pct = Math.round(prop.occupied / prop.total * 100);
            return (
              <div key={prop.name} className="mb-4 last:mb-0">
                <div className="flex justify-between mb-1">
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{prop.name}</p>
                  <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{prop.occupied}/{prop.total} ({pct}%)</p>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 10, background: 'var(--surface-bone)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--success)' : 'var(--warning)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Room status table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Room Status Summary</h3>
          </div>
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 1fr', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Room', 'Property', 'Type', 'Rent', 'Status'].map(h => <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>)}
          </div>
          {rooms.map((room, i) => (
            <div key={room.id} className="grid px-5 py-3 items-center"
              style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 1fr', gap: '12px', borderBottom: i < rooms.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{room.roomNumber}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.propertyName}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.roomType}</p>
              <p className="body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatPrice(room.pricePerMonth)}</p>
              <StatusBadge status={room.status} />
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-70: Debt / Outstanding Report ────────────────────────────────────────
export function DebtReportPage() {
  const overdueBills = MOCK_BILLS.filter(b => b.status === 'OVERDUE' || b.status === 'PENDING');
  const totalDebt    = overdueBills.filter(b => b.status === 'OVERDUE').reduce((s, b) => s + b.totalAmount, 0);

  return (
    <LandlordLayout>
      <div className="animate-fade-up flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <PageHeader title="Debt / Outstanding Report" sub="Unpaid and overdue bills" />
          <div className="flex gap-2">
            <button className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📊 Export</button>
          </div>
        </div>

        {totalDebt > 0 && (
          <div className="rounded-lg px-5 py-4 flex items-center gap-3" style={{ background: '#fef2f2' }}>
            <span className="text-xl">⚠️</span>
            <p className="body-sm" style={{ color: 'var(--error)' }}>
              Total overdue: <strong>{formatPrice(totalDebt)}</strong> across {overdueBills.filter(b=>b.status==='OVERDUE').length} bill(s).
            </p>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Tenant', 'Room', 'Period', 'Amount Due', 'Due Date', 'Action'].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {overdueBills.map((bill, i) => {
            const daysOverdue = bill.status === 'OVERDUE'
              ? Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / 86400000)
              : 0;
            return (
              <div key={bill.id} className="grid px-5 py-4 items-center"
                style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', borderBottom: i < overdueBills.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                <div>
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{bill.tenantName}</p>
                  <p className="code-md" style={{ color: 'var(--ash)', fontSize: 11 }}>{bill.id}</p>
                </div>
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{bill.roomNumber}</p>
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{bill.billingPeriod}</p>
                <div>
                  <p className="body-sm font-semibold" style={{ color: bill.status === 'OVERDUE' ? 'var(--error)' : 'var(--warning)' }}>
                    {formatPrice(bill.totalAmount)}
                  </p>
                  {daysOverdue > 0 && <p className="caption" style={{ color: 'var(--error)' }}>{daysOverdue}d overdue</p>}
                </div>
                <div>
                  <p className="body-sm" style={{ color: bill.status === 'OVERDUE' ? 'var(--error)' : 'var(--ink)' }}>{formatDate(bill.dueDate)}</p>
                  <span className={`badge ${bill.status === 'OVERDUE' ? 'badge-error' : 'badge-warning'}`} style={{ fontSize: 10 }}>{bill.status}</span>
                </div>
                <div className="flex gap-1">
                  <Link to={`/landlord/billing/${bill.id}`} className="btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 11, color: 'var(--charcoal)' }}>View</Link>
                  <button type="button" className="btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 11, color: 'var(--primary)' }}>
                    📧 Remind
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LandlordLayout>
  );
}
