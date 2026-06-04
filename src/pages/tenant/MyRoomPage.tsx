import { Link } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

// SCR-17 — My Room + SCR-18 — My Room Detail (combined as tabbed view)
// Entity: Room · Property · BlockFloor · RoomImage · Contract

const MOCK_ROOM = {
  id: 'r-001',
  roomNumber: 'A-301', roomType: 'Studio', code: 'SS-A301',
  pricePerMonth: 3500000, capacity: 2, area: 25, genderType: 'MIXED',
  status: 'OCCUPIED', description: 'A bright modern studio on the 3rd floor. Fully furnished with built-in wardrobe, AC, and a kitchenette. Great natural light and courtyard view.',
  amenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Parking', 'Security', 'Laundry', 'Balcony'],
  blockName: 'Block A', floorNumber: 3,
  propertyName: 'Sunset Apartments', address: '125 Nguyen Hue, District 1, HCMC',
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
  ],
};

const MOCK_CONTRACT = {
  id: 'C-2024-001', status: 'ACTIVE',
  effectiveFrom: '2024-09-01', effectiveTo: '2026-01-31',
  monthlyRent: 3500000, depositAmount: 7000000,
};

function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

export default function MyRoomPage() {
  return (
    <TenantLayout>
      <div className="animate-fade-up">
        <h1 className="heading-lg mb-5" style={{ color: 'var(--ink)' }}>My Room</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Room detail */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Image gallery */}
            <div className="card overflow-hidden">
              <div className="grid grid-cols-3 gap-1" style={{ height: 280 }}>
                <div className="col-span-2 overflow-hidden">
                  <img src={MOCK_ROOM.images[0]} alt="Room main" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1">
                  {MOCK_ROOM.images.slice(1).map((img, i) => (
                    <div key={i} className="flex-1 overflow-hidden">
                      <img src={img} alt={`Room ${i + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Room info */}
            <div className="card" style={{ padding: 24 }}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="heading-md" style={{ color: 'var(--ink)' }}>{MOCK_ROOM.roomNumber} — {MOCK_ROOM.roomType}</h2>
                  <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
                    📍 {MOCK_ROOM.address}
                  </p>
                  <p className="body-sm" style={{ color: 'var(--muted)' }}>
                    {MOCK_ROOM.blockName} · Floor {MOCK_ROOM.floorNumber} · Code: <span className="code-md">{MOCK_ROOM.code}</span>
                  </p>
                </div>
                <span className="badge badge-info">OCCUPIED</span>
              </div>

              <div className="flex flex-wrap gap-4 py-4 border-y mb-4" style={{ borderColor: 'var(--hairline)' }}>
                {[
                  { icon: '👥', label: 'Capacity', val: `${MOCK_ROOM.capacity} persons` },
                  { icon: '📐', label: 'Area',     val: `${MOCK_ROOM.area} m²` },
                  { icon: '⚤',  label: 'Gender',   val: MOCK_ROOM.genderType },
                  { icon: '🏢', label: 'Floor',    val: `Floor ${MOCK_ROOM.floorNumber}` },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 rounded-lg px-4 py-3" style={{ background: 'var(--surface-bone)' }}>
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <div className="caption" style={{ color: 'var(--ash)' }}>{s.label}</div>
                      <div className="label-sm" style={{ color: 'var(--ink)' }}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Amenities</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {MOCK_ROOM.amenities.map(a => <span key={a} className="badge badge-neutral px-3 py-1">{a}</span>)}
              </div>

              <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>About this room</h3>
              <p className="body-lg" style={{ color: 'var(--body)' }}>{MOCK_ROOM.description}</p>
            </div>
          </div>

          {/* Right: Contract summary */}
          <div className="flex flex-col gap-4">
            {/* Contract Card */}
            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Contract</h3>
                <span className="badge badge-success">ACTIVE</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Contract ID',  value: MOCK_CONTRACT.id, mono: true },
                  { label: 'Monthly Rent', value: formatPrice(MOCK_CONTRACT.monthlyRent), bold: true },
                  { label: 'Deposit',      value: formatPrice(MOCK_CONTRACT.depositAmount) },
                  { label: 'Start Date',   value: formatDate(MOCK_CONTRACT.effectiveFrom) },
                  { label: 'End Date',     value: formatDate(MOCK_CONTRACT.effectiveTo) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--hairline)' }}>
                    <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{row.label}</span>
                    <span
                      className={row.mono ? 'code-md' : 'body-sm'}
                      style={{ color: row.bold ? 'var(--primary)' : 'var(--ink)', fontWeight: row.bold ? 700 : 500 }}
                    >{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link to="/tenant/contracts/c-001" className="btn-outline w-full" style={{ height: 40, justifyContent: 'center', textDecoration: 'none', display: 'flex', fontSize: 13 }}>
                  📄 View Full Contract
                </Link>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Link to="/tenant/bills" className="btn-ghost text-left" style={{ height: 40, justifyContent: 'flex-start', gap: 10, color: 'var(--ink)' }}>
                  💳 View Bills
                </Link>
                <Link to="/tenant/maintenance/create" className="btn-ghost text-left" style={{ height: 40, justifyContent: 'flex-start', gap: 10, color: 'var(--ink)' }}>
                  🔧 Report Issue
                </Link>
                <Link to="/tenant/reviews/create" className="btn-ghost text-left" style={{ height: 40, justifyContent: 'flex-start', gap: 10, color: 'var(--ink)' }}>
                  ⭐ Leave a Review
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
