// SCR-78 — System Analytics
// Entity: User · Property · Bill · Payment
// KPI Grid (6 cards) + UserGrowthChart (area) + RevenueChart (bar)

import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, formatPrice, KpiCard, MOCK_ADMIN_USERS, MOCK_PLATFORM_PROPERTIES, USER_GROWTH, REVENUE_DATA } from './shared';

const totalUsers       = MOCK_ADMIN_USERS.length;
const newUsersMTD      = 2; // count(User where createdAt in current month, mock)
const activeTenants    = MOCK_ADMIN_USERS.filter(u => u.role === 'TENANT' && u.status === 'ACTIVE').length;
const totalRevenue     = REVENUE_DATA.reduce((s, d) => s + d.paid, 0);
const avgRevenuePerUser= Math.round(totalRevenue / activeTenants);
const activeProperties = MOCK_PLATFORM_PROPERTIES.filter(p => p.status === 'ACTIVE').length;

const MAX_USERS   = Math.max(...USER_GROWTH.map(d => d.total));
const MAX_REVENUE = Math.max(...REVENUE_DATA.map(d => d.paid + d.pending));

export default function SystemAnalyticsPage() {
  const [dateRange, setDateRange] = useState('12m');

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 animate-fade-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>System Analytics</h1>
            <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>Platform-wide metrics from User · Property · Bill · Payment</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date range filter */}
            <select
              className="input-field-rect"
              style={{ height: 38, minWidth: 140 }}
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="1m">Last 1 month</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
            </select>
            <button
              className="btn-outline"
              style={{ height: 38, borderRadius: 9999, fontSize: 13, padding: '0 16px' }}
            >
              ⬇ Export
            </button>
          </div>
        </div>

        {/* KPI Grid — 6 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            icon="👥"
            label="Total Users"
            value={totalUsers.toLocaleString()}
            sub="count(User) all time"
            trend="+18% vs last year"
          />
          <KpiCard
            icon="🆕"
            label="New Users MTD"
            value={newUsersMTD}
            sub="count(User.createdAt in current month)"
            color="var(--info)"
          />
          <KpiCard
            icon="🏠"
            label="Active Tenants"
            value={activeTenants}
            sub="count(User role=TENANT status=ACTIVE)"
            color="var(--success)"
          />
          <KpiCard
            icon="💰"
            label="Total Revenue (All Time)"
            value={`${(totalRevenue / 1_000_000_000).toFixed(2)}B`}
            sub="sum(Bill.totalAmount where status=PAID)"
            color="var(--success)"
            trend="+8.5% YoY"
          />
          <KpiCard
            icon="📊"
            label="Avg Revenue / Tenant"
            value={formatPrice(avgRevenuePerUser)}
            sub="totalRevenue / count(TENANT)"
          />
          <KpiCard
            icon="🏢"
            label="Active Properties"
            value={activeProperties}
            sub="count(Property where status=ACTIVE)"
            trend="+1 this month"
          />
        </div>

        {/* UserGrowthChart — area chart, full width */}
        <div className="card" style={{ padding: 28 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>User Growth</h2>
              <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>
                Three series by User.createdAt — Total · Tenant (role=TENANT) · Landlord (role=LANDLORD)
              </p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-6 mb-5">
            {[
              { label: 'Total',    color: '#1E293B', dash: 'none' },
              { label: 'Tenant',  color: '#0891B2', dash: '4 2' },
              { label: 'Landlord',color: '#EA5A1E', dash: '2 2' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <svg width="24" height="8">
                  <line x1="0" y1="4" x2="24" y2="4" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash} />
                </svg>
                <span className="caption font-semibold" style={{ color: 'var(--charcoal)' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Y-axis labels + chart */}
          <div className="flex gap-3">
            <div className="flex flex-col justify-between text-right" style={{ width: 36, height: 180 }}>
              {[MAX_USERS, Math.round(MAX_USERS * 0.75), Math.round(MAX_USERS * 0.5), Math.round(MAX_USERS * 0.25), 0].map(v => (
                <span key={v} style={{ fontSize: 10, color: 'var(--ash)', lineHeight: 1 }}>{v}</span>
              ))}
            </div>
            <div className="flex-1" style={{ position: 'relative' }}>
              <svg width="100%" viewBox="0 0 600 180" preserveAspectRatio="none" style={{ height: 180 }}>
                {/* Grid */}
                {[0, 45, 90, 135, 180].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--hairline)" strokeWidth="1" />
                ))}
                {/* Total filled area */}
                <polygon
                  fill="rgba(30,41,59,0.06)"
                  points={[
                    '0,180',
                    ...USER_GROWTH.map((d, i) => `${(i / 11) * 600},${180 - (d.total / MAX_USERS) * 170}`),
                    '600,180',
                  ].join(' ')}
                />
                {/* Total line */}
                <polyline
                  fill="none" stroke="#1E293B" strokeWidth="2.5"
                  points={USER_GROWTH.map((d, i) => `${(i / 11) * 600},${180 - (d.total / MAX_USERS) * 170}`).join(' ')}
                />
                {/* Tenant filled area */}
                <polygon
                  fill="rgba(8,145,178,0.08)"
                  points={[
                    '0,180',
                    ...USER_GROWTH.map((d, i) => `${(i / 11) * 600},${180 - (d.tenant / MAX_USERS) * 170}`),
                    '600,180',
                  ].join(' ')}
                />
                {/* Tenant line */}
                <polyline
                  fill="none" stroke="#0891B2" strokeWidth="2" strokeDasharray="4 2"
                  points={USER_GROWTH.map((d, i) => `${(i / 11) * 600},${180 - (d.tenant / MAX_USERS) * 170}`).join(' ')}
                />
                {/* Landlord line */}
                <polyline
                  fill="none" stroke="#EA5A1E" strokeWidth="2" strokeDasharray="2 2"
                  points={USER_GROWTH.map((d, i) => `${(i / 11) * 600},${180 - (d.landlord / MAX_USERS) * 170}`).join(' ')}
                />
              </svg>
            </div>
          </div>

          {/* X-axis */}
          <div className="flex ml-10" style={{ marginLeft: 44 }}>
            {USER_GROWTH.map(d => (
              <div key={d.month} className="flex-1 text-center">
                <span style={{ fontSize: 9, color: 'var(--ash)' }}>{d.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RevenueChart — bar chart, full width */}
        <div className="card" style={{ padding: 28 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Revenue Overview</h2>
              <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>
                sum(Bill.totalAmount) by Bill.billingPeriod — two series: Paid / Pending + Overdue
              </p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-6 mb-5">
            {[
              { label: 'Paid',             color: '#16A34A' },
              { label: 'Pending / Overdue',color: '#D97706' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="rounded" style={{ width: 12, height: 12, background: s.color }} />
                <span className="caption font-semibold" style={{ color: 'var(--charcoal)' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-3" style={{ height: 180 }}>
            {REVENUE_DATA.map((d, i) => {
              const totalH = ((d.paid + d.pending) / MAX_REVENUE) * 160;
              const paidH  = (d.paid / MAX_REVENUE) * 160;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div style={{ height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', gap: 1 }}>
                    {/* Pending on top */}
                    <div style={{ background: '#D97706', borderRadius: '3px 3px 0 0', height: totalH - paidH, width: '100%', minHeight: totalH - paidH > 0 ? 2 : 0 }} />
                    {/* Paid bottom */}
                    <div style={{ background: '#16A34A', width: '100%', height: paidH, borderRadius: paidH === totalH ? '3px 3px 0 0' : 0 }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--ash)', whiteSpace: 'nowrap' }}>{d.month.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>

          {/* Revenue summary row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
            {[
              { label: 'Total Collected (All Time)', value: `${(REVENUE_DATA.reduce((s, d) => s + d.paid, 0) / 1_000_000_000).toFixed(2)}B ₫`, color: 'var(--success)' },
              { label: 'Total Pending / Overdue',    value: formatPrice(REVENUE_DATA.reduce((s, d) => s + d.pending, 0)), color: 'var(--warning)' },
              { label: 'Collection Rate',            value: `${Math.round(REVENUE_DATA.reduce((s, d) => s + d.paid, 0) / REVENUE_DATA.reduce((s, d) => s + d.paid + d.pending, 0) * 100)}%`, color: 'var(--ink)' },
            ].map(item => (
              <div key={item.label}>
                <p className="caption mb-1" style={{ color: 'var(--ash)' }}>{item.label}</p>
                <p className="heading-sm" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
