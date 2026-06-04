import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// SCR-07 — Room Listing
// Entity: Room · Property · BlockFloor · RoomImage
// Filter fields map to: Room.pricePerMonth · Room.roomType · Room.genderType · Room.capacity · Property.address

const ALL_ROOMS = [
  { id: '1', roomNumber: 'A-301', roomType: 'Studio', pricePerMonth: 3500000, capacity: 2, area: 25, genderType: 'Mixed', status: 'AVAILABLE', propertyName: 'Sunset Apartments', address: '125 Nguyen Hue, District 1, HCMC', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', amenities: ['WiFi', 'AC', 'Kitchen'], blockName: 'A', floorNumber: 3 },
  { id: '2', roomNumber: 'B-102', roomType: 'Single Room', pricePerMonth: 2200000, capacity: 1, area: 18, genderType: 'Female', status: 'AVAILABLE', propertyName: 'Green House', address: '88 Le Van Viet, Thu Duc', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', amenities: ['WiFi', 'Laundry', 'Security'], blockName: 'B', floorNumber: 1 },
  { id: '3', roomNumber: 'C-203', roomType: 'Double Room', pricePerMonth: 4800000, capacity: 2, area: 32, genderType: 'Mixed', status: 'AVAILABLE', propertyName: 'City Center', address: '45 Tran Hung Dao, District 5', imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', amenities: ['WiFi', 'AC', 'Parking', 'Gym'], blockName: 'C', floorNumber: 2 },
  { id: '4', roomNumber: 'D-401', roomType: 'Studio', pricePerMonth: 3000000, capacity: 1, area: 22, genderType: 'Male', status: 'AVAILABLE', propertyName: 'Riverside View', address: '210 Vo Thi Sau, District 3', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', amenities: ['WiFi', 'AC', 'Balcony'], blockName: 'D', floorNumber: 4 },
  { id: '5', roomNumber: 'E-115', roomType: 'Dormitory', pricePerMonth: 1500000, capacity: 4, area: 40, genderType: 'Male', status: 'OCCUPIED', propertyName: 'Student Quarter', address: '3 Pham Van Dong, Thu Duc', imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80', amenities: ['WiFi', 'Laundry'], blockName: 'E', floorNumber: 1 },
  { id: '6', roomNumber: 'F-222', roomType: 'Single Room', pricePerMonth: 2800000, capacity: 1, area: 20, genderType: 'Female', status: 'AVAILABLE', propertyName: 'Blossom Boarding', address: '67 Nguyen Trai, District 1', imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=80', amenities: ['WiFi', 'AC', 'Kitchen'], blockName: 'F', floorNumber: 2 },
  { id: '7', roomNumber: 'G-301', roomType: 'Double Room', pricePerMonth: 5200000, capacity: 2, area: 35, genderType: 'Mixed', status: 'AVAILABLE', propertyName: 'Park View Tower', address: '18 Le Duan, District 1', imageUrl: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=600&q=80', amenities: ['WiFi', 'AC', 'Parking', 'Gym', 'Security'], blockName: 'G', floorNumber: 3 },
  { id: '8', roomNumber: 'H-104', roomType: 'Studio', pricePerMonth: 2600000, capacity: 1, area: 20, genderType: 'Female', status: 'AVAILABLE', propertyName: 'Pink Garden', address: '22 Hoang Van Thu, Phu Nhuan', imageUrl: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e97?w=600&q=80', amenities: ['WiFi', 'Kitchen', 'Laundry'], blockName: 'H', floorNumber: 1 },
  { id: '9', roomNumber: 'I-201', roomType: 'Single Room', pricePerMonth: 1900000, capacity: 1, area: 16, genderType: 'Male', status: 'RESERVED', propertyName: 'Budget Zone', address: '55 Nguyen Oanh, Go Vap', imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80', amenities: ['WiFi', 'Security'], blockName: 'I', floorNumber: 2 },
];

const ROOM_TYPES = ['Studio', 'Single Room', 'Double Room', 'Dormitory'];
const GENDER_TYPES = ['Any', 'Male', 'Female', 'Mixed'];
const SORT_OPTIONS = [
  { label: 'Newest First',     value: 'newest' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
];

function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: 'badge-success', OCCUPIED: 'badge-error',
    RESERVED: 'badge-warning', MAINTENANCE: 'badge-info',
  };
  const labels: Record<string, string> = {
    AVAILABLE: 'Available', OCCUPIED: 'Occupied',
    RESERVED: 'Reserved', MAINTENANCE: 'Maintenance',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{labels[status] ?? status}</span>;
}

export default function RoomListingPage() {
  const [searchParams] = useSearchParams();

  // Filter states → entity attributes
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [types, setTypes] = useState<string[]>(
    searchParams.get('type') ? [searchParams.get('type')!] : []
  );
  const [gender, setGender] = useState('Any');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Apply filters (entity-attribute driven)
  const filtered = ALL_ROOMS.filter((r) => {
    if (location && !r.address.toLowerCase().includes(location.toLowerCase()) &&
        !r.propertyName.toLowerCase().includes(location.toLowerCase())) return false;
    if (minPrice && r.pricePerMonth < Number(minPrice)) return false;
    if (maxPrice && r.pricePerMonth > Number(maxPrice)) return false;
    if (types.length > 0 && !types.includes(r.roomType)) return false;
    if (gender !== 'Any' && r.genderType !== gender) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'price_asc') return a.pricePerMonth - b.pricePerMonth;
    if (sort === 'price_desc') return b.pricePerMonth - a.pricePerMonth;
    return Number(b.id) - Number(a.id);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleType(t: string) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setCurrentPage(1);
  }

  function clearFilters() {
    setLocation(''); setMinPrice(''); setMaxPrice('');
    setTypes([]); setGender('Any'); setCurrentPage(1);
  }

  const hasActiveFilters = location || minPrice || maxPrice || types.length > 0 || gender !== 'Any';

  return (
    <PublicLayout>
      <div className="container-wide section-pad-sm">
        <div className="flex gap-8">

          {/* ── FILTER SIDEBAR ── */}
          <aside
            className="hidden lg:block flex-shrink-0"
            style={{ width: 280 }}
          >
            <div
              className="card sticky top-20"
              style={{ padding: 24 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="heading-sm" style={{ color: 'var(--ink)' }}>Filter Rooms</h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="body-sm font-semibold"
                    style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Location → Property.address */}
              <div className="mb-5">
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Location</label>
                <input
                  type="text"
                  className="input-field-rect"
                  placeholder="City, district, street…"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {/* Price Range → Room.pricePerMonth */}
              <div className="mb-5">
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Price Range (₫/month)</label>
                <div className="flex gap-2">
                  <input type="number" className="input-field-rect" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }} />
                  <input type="number" className="input-field-rect" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }} />
                </div>
              </div>

              {/* Room Type → Room.roomType */}
              <div className="mb-5">
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Room Type</label>
                <div className="flex flex-col gap-2">
                  {ROOM_TYPES.map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={types.includes(t)}
                        onChange={() => toggleType(t)}
                        style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                      />
                      <span className="body-sm" style={{ color: 'var(--ink)' }}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender Type → Room.genderType */}
              <div className="mb-5">
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Gender Type</label>
                <div className="flex flex-col gap-2">
                  {GENDER_TYPES.map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === g}
                        onChange={() => { setGender(g); setCurrentPage(1); }}
                        style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                      />
                      <span className="body-sm" style={{ color: 'var(--ink)' }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <p className="body-md" style={{ color: 'var(--charcoal)' }}>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>{filtered.length}</span> rooms found
              </p>
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="input-field-rect body-sm"
                  style={{ width: 'auto', height: 38, paddingTop: 0, paddingBottom: 0 }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--hairline)' }}>
                  {(['grid', 'list'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className="px-3 py-2 transition-colors"
                      style={{
                        background: view === v ? 'var(--surface-dark)' : 'var(--surface-card)',
                        color: view === v ? 'var(--on-dark)' : 'var(--charcoal)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      {v === 'grid' ? '⊞' : '≡'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty State */}
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>No rooms match your filters</h3>
                <p className="body-md mb-6" style={{ color: 'var(--charcoal)' }}>Try adjusting your filters to see more results.</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                {/* Room Grid */}
                <div className={`${view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-4'}`}>
                  {paginated.map((room) => (
                    view === 'grid' ? (
                      <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                        <div
                          className="card overflow-hidden transition-all duration-200 h-full flex flex-col"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(32,32,32,0.10)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                        >
                          <div className="relative" style={{ height: 180 }}>
                            <img src={room.imageUrl} alt={room.roomNumber} className="w-full h-full object-cover" />
                            <div className="absolute top-3 left-3"><StatusBadge status={room.status} /></div>
                          </div>
                          <div className="p-4 flex flex-col flex-1 gap-2">
                            <p className="caption" style={{ color: 'var(--ash)' }}>{room.propertyName}</p>
                            <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>{room.roomNumber} — {room.roomType}</h3>
                            <p className="body-sm flex items-center gap-1" style={{ color: 'var(--charcoal)' }}>📍 {room.address}</p>
                            <div className="flex gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                              <span>👥 {room.capacity}</span><span>📐 {room.area}m²</span><span>⚤ {room.genderType}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 mt-auto border-t" style={{ borderColor: 'var(--hairline)' }}>
                              <span>
                                <span className="font-bold" style={{ color: 'var(--primary)', fontSize: 17 }}>{formatPrice(room.pricePerMonth)}</span>
                                <span className="caption" style={{ color: 'var(--ash)' }}>/mo</span>
                              </span>
                              <span className="btn-outline" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>View →</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      /* List view */
                      <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                        <div
                          className="card overflow-hidden flex transition-all duration-200"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(32,32,32,0.10)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                        >
                          <img src={room.imageUrl} alt={room.roomNumber} style={{ width: 160, height: 120, objectFit: 'cover', flexShrink: 0 }} />
                          <div className="flex-1 p-4 flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>{room.roomNumber} — {room.roomType}</h3>
                                <StatusBadge status={room.status} />
                              </div>
                              <p className="body-sm" style={{ color: 'var(--ash)' }}>{room.propertyName} · {room.address}</p>
                              <div className="flex gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                                <span>👥 {room.capacity}</span><span>📐 {room.area}m²</span><span>⚤ {room.genderType}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="font-bold" style={{ color: 'var(--primary)', fontSize: 18 }}>{formatPrice(room.pricePerMonth)}</div>
                              <div className="caption mb-2" style={{ color: 'var(--ash)' }}>/month</div>
                              <span className="btn-outline" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>View Details</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      className="btn-outline"
                      style={{ height: 36, padding: '0 14px', fontSize: 13 }}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className="rounded-full font-semibold text-sm transition-colors"
                        style={{
                          width: 36, height: 36,
                          background: p === currentPage ? 'var(--ink)' : 'var(--surface-card)',
                          color: p === currentPage ? 'var(--on-dark)' : 'var(--charcoal)',
                          border: '1px solid var(--hairline)',
                          cursor: 'pointer',
                        }}
                      >{p}</button>
                    ))}
                    <button
                      className="btn-outline"
                      style={{ height: 36, padding: '0 14px', fontSize: 13 }}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
