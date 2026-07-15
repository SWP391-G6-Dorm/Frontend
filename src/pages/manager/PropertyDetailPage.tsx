// PropertyDetailPage.tsx — SCR-34: Property Detail
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { propertyApi, PropertyDetail } from '../../api/propertyApi';
import { StatusBadge, formatDate } from './_propertyShared';

// ── Occupancy Bar ──────────────────────────────────────────────────────────────

function OccupancyBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{label}</span>
        <span className="body-sm" style={{ fontWeight: 600 }}>{count} <span style={{ color: 'var(--ash)' }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-bone)', borderRadius: 999 }}>
        <div style={{
          height: '100%', borderRadius: 999, width: `${pct}%`,
          background: color, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <ManagerLayout>
      <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--ash)' }}>
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p>Loading property...</p>
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    propertyApi.getDetail(id)
      .then(res => { if (res.success) setProperty(res.data); })
      .catch(() => setError('Không thể tải thông tin property. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !property) {
    return (
      <ManagerLayout>
        <div className="alert alert-error" style={{ maxWidth: 480 }}>
          {error || 'Property not found.'}
        </div>
      </ManagerLayout>
    );
  }

  const { stats, floors } = property;
  const occupancyPct = stats.totalRooms > 0
    ? Math.round(((stats.occupiedRooms + stats.reservedRooms) / stats.totalRooms) * 100)
    : 0;

  return (
    <ManagerLayout>
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/properties" className="text-primary" style={{ textDecoration: 'none' }}>Properties</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>{property.name}</span>
      </div>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: 8 }}>{property.name}</h1>
          <StatusBadge status={property.status} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link to={`/manager/properties/${property.id}/edit`} className="btn-primary btn-sm" id="btn-edit-property">
            Edit Property
          </Link>
          <Link to={`/manager/structure?propertyId=${property.id}`} className="btn-outline btn-sm" id="btn-view-structure">
            Structure Tree
          </Link>
        </div>
      </div>

      {/* ── Two-Column Layout (8/12 + 4/12) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'flex-start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Card 1: Property Profile */}
          <div className="card-lg" style={{ padding: 28 }}>
            <h2 className="heading-sm" style={{ marginBottom: 20 }}>Property Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>Address</p>
                  <p style={{ fontWeight: 500 }}>📍 {property.address}</p>
                </div>
                <div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>Status</p>
                  <StatusBadge status={property.status} />
                </div>
                <div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>Created</p>
                  <p style={{ fontWeight: 500 }}>{formatDate(property.createdAt)}</p>
                </div>
                <div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>Last Updated</p>
                  <p style={{ fontWeight: 500 }}>{formatDate(property.updatedAt)}</p>
                </div>
              </div>

              {property.description && (
                <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>Description</p>
                  <p className="body-md" style={{ lineHeight: 1.7, color: 'var(--body)' }}>{property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Floor & Room Summary */}
          <div className="card-lg" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="heading-sm">Floor & Room Summary</h2>
              <Link to={`/manager/structure?propertyId=${property.id}`} className="btn-ghost btn-sm" id="btn-manage-floors">
                Manage Floors →
              </Link>
            </div>

            {floors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ash)' }}>
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                  style={{ marginBottom: 8 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
                <p className="body-sm">No floors added yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 100px',
                  padding: '8px 12px', borderRadius: '8px 8px 0 0',
                  background: 'var(--surface-bone)', fontSize: 12, fontWeight: 600,
                  color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>Floor</span>
                  <span>Description</span>
                  <span style={{ textAlign: 'center' }}>Rooms</span>
                  <span style={{ textAlign: 'center' }}>Available</span>
                  <span style={{ textAlign: 'center' }}>Actions</span>
                </div>
                {floors.map((floor, idx) => (
                  <div key={floor.id} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 100px',
                    padding: '12px', alignItems: 'center',
                    borderBottom: idx < floors.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>
                      F{floor.floorNumber}
                    </span>
                    <span className="body-sm text-charcoal">
                      {floor.description || `Floor ${floor.floorNumber}`}
                    </span>
                    <span style={{ textAlign: 'center', fontWeight: 600 }}>{floor.roomCount}</span>
                    <span style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }}>
                      {floor.availableCount}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Link
                        to={`/manager/rooms?propertyId=${property.id}&floorId=${floor.id}`}
                        className="btn-ghost btn-sm"
                        style={{ padding: '0 10px', fontSize: 12 }}
                        id={`btn-floor-rooms-${floor.id}`}
                      >
                        View Rooms
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Card 3: Quick Actions */}
          <div className="card-lg" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to={`/manager/properties/${property.id}/edit`} className="btn-primary"
                style={{ justifyContent: 'center', textAlign: 'center' }} id="btn-quick-edit">
                ✏️ Edit Property
              </Link>
              <Link to={`/manager/structure?propertyId=${property.id}`} className="btn-outline"
                style={{ justifyContent: 'center', textAlign: 'center' }} id="btn-quick-structure">
                🌳 View Structure
              </Link>
              <Link to={`/manager/rooms?propertyId=${property.id}`} className="btn-ghost"
                style={{ justifyContent: 'center', textAlign: 'center' }} id="btn-quick-rooms">
                🛏️ All Rooms
              </Link>
              <Link to={`/manager/structure?propertyId=${property.id}`} className="btn-ghost"
                style={{ justifyContent: 'center', textAlign: 'center' }} id="btn-quick-floors">
                🏢 Structure Tree
              </Link>
            </div>
          </div>

          {/* Card 4: Occupancy */}
          <div className="card-lg" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 6 }}>Occupancy</h2>
            <p className="body-sm text-charcoal" style={{ marginBottom: 20 }}>
              {stats.totalRooms} rooms total · <strong style={{ color: 'var(--primary)' }}>{occupancyPct}%</strong> occupied
            </p>

            <OccupancyBar label="Available"       count={stats.availableRooms}      total={stats.totalRooms} color="var(--success)" />
            <OccupancyBar label="Occupied"         count={stats.occupiedRooms}       total={stats.totalRooms} color="var(--primary)" />
            <OccupancyBar label="Reserved"         count={stats.reservedRooms}       total={stats.totalRooms} color="var(--info, #3b82f6)" />
            <OccupancyBar label="Pending Deposit"  count={stats.pendingDepositRooms} total={stats.totalRooms} color="var(--warning)" />
            <OccupancyBar label="Maintenance"      count={stats.maintenanceRooms}    total={stats.totalRooms} color="var(--error)" />

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Total Floors', value: stats.totalFloors, icon: '🏢', color: 'var(--ink)' },
                { label: 'Total Rooms',  value: stats.totalRooms,  icon: '🛏️', color: 'var(--ink)' },
                { label: 'Available',    value: stats.availableRooms, icon: '✅', color: 'var(--success)' },
                { label: 'Occupied',     value: stats.occupiedRooms,  icon: '🔑', color: 'var(--primary)' },
              ].map(item => (
                <div key={item.label} style={{
                  textAlign: 'center', padding: '12px 8px',
                  background: 'var(--surface-bone)', borderRadius: 10,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div className="body-sm text-charcoal">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
