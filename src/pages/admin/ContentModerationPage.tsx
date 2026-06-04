// SCR-75 — Content Moderation
// Entity: Property · Review · User
// Tabs: [Properties] [Reviews]

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  StatusBadge, PageHeader, FilterBar, formatDate, relTime,
  MOCK_PLATFORM_PROPERTIES, MOCK_REVIEWS,
} from './shared';

type Tab = 'properties' | 'reviews';

export default function ContentModerationPage() {
  const [tab, setTab] = useState<Tab>('properties');
  const [propStatus, setPropStatus] = useState('ALL');
  const [reviewModStatus, setReviewModStatus] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [propSearch, setPropSearch] = useState('');

  const filteredProps = MOCK_PLATFORM_PROPERTIES.filter(p =>
    (propStatus === 'ALL' || p.status === propStatus) &&
    (propSearch === '' || p.name.toLowerCase().includes(propSearch.toLowerCase()) || p.ownerName.toLowerCase().includes(propSearch.toLowerCase()))
  );

  const filteredReviews = MOCK_REVIEWS.filter(r =>
    (reviewModStatus === 'ALL' || r.moderationStatus === reviewModStatus) &&
    (ratingFilter === 'ALL' || r.rating === parseInt(ratingFilter, 10))
  );

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className="px-5 py-2.5 body-sm font-semibold transition-all"
      style={{
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
        color: tab === id ? 'var(--primary)' : 'var(--charcoal)',
        background: 'none',
        cursor: 'pointer',
      }}
    >{label}</button>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 animate-fade-up">
        <PageHeader
          title="Content Moderation"
          sub="Manage property listings and review visibility across the platform"
        />

        {/* Tabs.Line */}
        <div style={{ borderBottom: '1px solid var(--hairline)' }}>
          <TabBtn id="properties" label="🏢 Properties" />
          <TabBtn id="reviews"    label="⭐ Reviews" />
        </div>

        {/* ── Properties Tab ── */}
        {tab === 'properties' && (
          <div>
            <FilterBar search={propSearch} onSearch={setPropSearch}>
              <select
                className="input-field-rect"
                style={{ height: 38, minWidth: 160 }}
                value={propStatus}
                onChange={e => setPropStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </FilterBar>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div className="grid border-b px-4 py-3"
                style={{ gridTemplateColumns: '3fr 2fr 1fr 1fr 2fr', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
                {['Property Name', 'Owner', 'Rooms', 'Status', 'Actions'].map(col => (
                  <div key={col} className="label-sm" style={{ color: 'var(--charcoal)', fontSize: 11 }}>{col}</div>
                ))}
              </div>

              {filteredProps.length === 0 ? (
                <div className="flex flex-col items-center py-14" style={{ color: 'var(--ash)' }}>
                  <span style={{ fontSize: 40 }}>🏢</span>
                  <p className="body-sm font-semibold mt-3" style={{ color: 'var(--charcoal)' }}>No properties found.</p>
                </div>
              ) : filteredProps.map((prop, i) => (
                <div
                  key={prop.id}
                  className="grid items-center px-4 py-4 border-b transition-colors"
                  style={{ gridTemplateColumns: '3fr 2fr 1fr 1fr 2fr', borderColor: i < filteredProps.length - 1 ? 'var(--hairline)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{prop.name}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{formatDate(prop.createdAt)}</p>
                  </div>
                  <div>
                    <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{prop.ownerName}</p>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{prop.ownerEmail}</p>
                  </div>
                  <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{prop.totalRooms}</p>
                  <div><StatusBadge status={prop.status} /></div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {prop.status !== 'ACTIVE' && (
                      <button
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'pointer' }}
                      >✓ Activate</button>
                    )}
                    {prop.status !== 'SUSPENDED' && (
                      <button
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', cursor: 'pointer' }}
                      >⏸ Suspend</button>
                    )}
                    <button
                      className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}
                    >🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {tab === 'reviews' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <select
                className="input-field-rect"
                style={{ height: 38, minWidth: 190 }}
                value={reviewModStatus}
                onChange={e => setReviewModStatus(e.target.value)}
              >
                <option value="ALL">All Moderation Statuses</option>
                <option value="VISIBLE">Visible</option>
                <option value="HIDDEN">Hidden</option>
              </select>
              <select
                className="input-field-rect"
                style={{ height: 38, minWidth: 140 }}
                value={ratingFilter}
                onChange={e => setRatingFilter(e.target.value)}
              >
                <option value="ALL">All Ratings</option>
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{'⭐'.repeat(r)} {r} star{r > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div className="grid border-b px-4 py-3"
                style={{ gridTemplateColumns: '1fr 1.5fr 2fr 3fr 1fr 1.5fr 2fr', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
                {['Rating', 'Room', 'Reviewer', 'Comment', 'Date', 'Status', 'Actions'].map(col => (
                  <div key={col} className="label-sm" style={{ color: 'var(--charcoal)', fontSize: 11 }}>{col}</div>
                ))}
              </div>

              {filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center py-14" style={{ color: 'var(--ash)' }}>
                  <span style={{ fontSize: 40 }}>⭐</span>
                  <p className="body-sm font-semibold mt-3" style={{ color: 'var(--charcoal)' }}>No reviews found.</p>
                </div>
              ) : filteredReviews.map((review, i) => (
                <div key={review.id}>
                  <div
                    className="grid items-center px-4 py-4 border-b cursor-pointer transition-colors"
                    style={{
                      gridTemplateColumns: '1fr 1.5fr 2fr 3fr 1fr 1.5fr 2fr',
                      borderColor: 'var(--hairline)',
                      borderLeft: review.moderationStatus === 'HIDDEN' ? '3px solid #D97706' : '3px solid transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                  >
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} style={{ fontSize: 13, color: idx < review.rating ? '#D97706' : '#E2E8F0' }}>★</span>
                      ))}
                    </div>
                    {/* Room */}
                    <div>
                      <p className="caption font-semibold" style={{ color: 'var(--ink)' }}>{review.roomNumber}</p>
                      <p className="caption" style={{ color: 'var(--ash)' }}>{review.propertyName}</p>
                    </div>
                    {/* Reviewer */}
                    <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{review.tenantName}</p>
                    {/* Comment (truncated) */}
                    <p className="body-sm" style={{
                      color: 'var(--charcoal)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{review.comment}</p>
                    {/* Date */}
                    <p className="caption" style={{ color: 'var(--ash)' }}>{relTime(review.createdAt)}</p>
                    {/* Status */}
                    <div><StatusBadge status={review.moderationStatus} /></div>
                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {review.moderationStatus === 'HIDDEN' ? (
                        <button
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'pointer' }}
                        >👁 Keep</button>
                      ) : (
                        <button
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', cursor: 'pointer' }}
                        >🙈 Hide</button>
                      )}
                    </div>
                  </div>
                  {/* Expanded row */}
                  {expandedReview === review.id && (
                    <div className="px-8 py-4 border-b"
                      style={{ borderColor: 'var(--hairline)', background: '#FAFAF9' }}>
                      <p className="body-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Full Review:</p>
                      <p className="body-sm" style={{ color: 'var(--charcoal)', lineHeight: 1.7 }}>{review.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
