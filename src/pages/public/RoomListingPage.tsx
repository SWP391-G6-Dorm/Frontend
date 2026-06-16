import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

const ROOM_TYPES = ['Studio', 'Standard', 'Deluxe', 'Suite', 'Villa'];
const MOCK_ROOMS = [
  { id: '1', roomNumber: 'Villa 01',    roomType: 'Villa',    pricePerNight: 2500000, capacity: 4, area: 80, status: 'AVAILABLE',   primaryImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=280&fit=crop', propertyName: 'Sunset Resort Đà Nẵng',   location: 'Đà Nẵng',  rating: 4.8, reviews: 124 },
  { id: '2', roomNumber: 'Deluxe 05',  roomType: 'Deluxe',   pricePerNight: 1200000, capacity: 2, area: 35, status: 'AVAILABLE',   primaryImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=280&fit=crop', propertyName: 'Mountain View Homestay',        location: 'Đà Lạt',   rating: 4.6, reviews: 89  },
  { id: '3', roomNumber: 'Suite 03',   roomType: 'Suite',    pricePerNight: 1800000, capacity: 3, area: 55, status: 'RESERVED',    primaryImageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=280&fit=crop', propertyName: 'Hội An Garden Villa',         location: 'Hội An',   rating: 4.9, reviews: 210 },
  { id: '4', roomNumber: 'Standard 12',roomType: 'Standard', pricePerNight:  750000, capacity: 2, area: 28, status: 'AVAILABLE',   primaryImageUrl: 'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=400&h=280&fit=crop', propertyName: 'Phú Quốc Beach House',        location: 'Phú Quốc', rating: 4.4, reviews: 67  },
  { id: '5', roomNumber: 'Studio 08',  roomType: 'Studio',   pricePerNight:  600000, capacity: 1, area: 20, status: 'AVAILABLE',   primaryImageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=280&fit=crop', propertyName: 'Hà Nội Old Quarter Inn',       location: 'Hà Nội',   rating: 4.2, reviews: 43  },
  { id: '6', roomNumber: 'Deluxe 09',  roomType: 'Deluxe',   pricePerNight: 1350000, capacity: 2, area: 40, status: 'MAINTENANCE', primaryImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=280&fit=crop', propertyName: 'Nha Trang Beach Resort',         location: 'Nha Trang', rating: 4.5, reviews: 156 },
];

// Unique locations derived from mock data
const ALL_LOCATIONS = [...new Set(MOCK_ROOMS.map(r => r.location))];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    AVAILABLE:       { cls: 'badge-success', label: 'Available' },
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending' },
    RESERVED:        { cls: 'badge-info',    label: 'Reserved' },
    OCCUPIED:        { cls: 'badge-neutral', label: 'Occupied' },
    MAINTENANCE:     { cls: 'badge-neutral', label: 'Maintenance' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#ea2804' : '#e5e7eb'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
      <span className="body-sm text-charcoal" style={{ marginLeft: 2 }}>{rating}</span>
    </div>
  );
}

export function RoomListingContent() {
  const [params] = useSearchParams();

  // Pre-fill filters from URL params
  const urlLocation  = params.get('location')  || '';
  const urlGuests    = params.get('guests')     || '';
  const urlCheckIn   = params.get('checkIn')    || '';
  const urlCheckOut  = params.get('checkOut')   || '';

  // If URL location matches one of our known locations exactly, pre-check it
  const initLocations = ALL_LOCATIONS.filter(l =>
    urlLocation && l.toLowerCase().includes(urlLocation.toLowerCase())
  );

  const [filters, setFilters] = useState({
    location: initLocations,   // string[]
    roomType: [] as string[],
    minPrice: '',
    maxPrice: '',
    guests: urlGuests,
    checkIn: urlCheckIn,
    checkOut: urlCheckOut,
  });
  const [sort, setSort] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = MOCK_ROOMS.filter(r => {
    if (filters.location.length && !filters.location.includes(r.location)) return false;
    if (filters.roomType.length && !filters.roomType.includes(r.roomType))  return false;
    if (filters.minPrice && r.pricePerNight < Number(filters.minPrice)) return false;
    if (filters.maxPrice && r.pricePerNight > Number(filters.maxPrice)) return false;
    if (filters.guests && r.capacity < Number(filters.guests)) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'price-asc')  return a.pricePerNight - b.pricePerNight;
    if (sort === 'price-desc') return b.pricePerNight - a.pricePerNight;
    if (sort === 'rating')     return b.rating - a.rating;
    return 0;
  });

  function toggleType(t: string) {
    setFilters(p => ({
      ...p,
      roomType: p.roomType.includes(t) ? p.roomType.filter(x => x !== t) : [...p.roomType, t],
    }));
  }

  function toggleLocation(loc: string) {
    setFilters(p => ({
      ...p,
      location: p.location.includes(loc) ? p.location.filter(x => x !== loc) : [...p.location, loc],
    }));
  }

  function clearFilters() {
    setFilters({ location: [], roomType: [], minPrice: '', maxPrice: '', guests: '', checkIn: '', checkOut: '' });
  }

  const FilterPanel = () => (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h3 className="heading-sm">Filters</h3>
        <button className="btn-ghost btn-sm" onClick={clearFilters} style={{ color: 'var(--primary)' }}>Clear All</button>
      </div>

      {/* Location */}
      <div style={{ marginBottom: 20 }}>
        <p className="form-label" style={{ marginBottom: 10 }}>Location</p>
        {ALL_LOCATIONS.map(loc => (
          <label key={loc} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={filters.location.includes(loc)} onChange={() => toggleLocation(loc)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }} />
            <span className="body-sm">{loc}</span>
          </label>
        ))}
      </div>

      {/* Check-in / Check-out */}
      <div style={{ marginBottom: 20 }}>
        <p className="form-label">Check-in Date</p>
        <input type="date" className="input" value={filters.checkIn} onChange={e => setFilters(p => ({ ...p, checkIn: e.target.value }))} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <p className="form-label">Check-out Date</p>
        <input type="date" className="input" value={filters.checkOut} onChange={e => setFilters(p => ({ ...p, checkOut: e.target.value }))} />
      </div>

      {/* Room type */}
      <div style={{ marginBottom: 20 }}>
        <p className="form-label" style={{ marginBottom: 10 }}>Room Type</p>
        {ROOM_TYPES.map(type => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={filters.roomType.includes(type)} onChange={() => toggleType(type)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }} />
            <span className="body-sm">{type}</span>
          </label>
        ))}
      </div>

      {/* Price range */}
      <div style={{ marginBottom: 20 }}>
        <p className="form-label" style={{ marginBottom: 10 }}>Price Range (₫/night)</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" className="input" placeholder="Min" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
          <input type="number" className="input" placeholder="Max" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
        </div>
      </div>

      {/* Guests */}
      <div style={{ marginBottom: 20 }}>
        <p className="form-label">Minimum Guests</p>
        <input type="number" min={1} max={20} className="input" placeholder="2" value={filters.guests} onChange={e => setFilters(p => ({ ...p, guests: e.target.value }))} />
      </div>

      <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSidebarOpen(false)}>
        Apply Filters
      </button>
    </div>
  );

  return (
    <div className="container-wide section-pad-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 24 }}>
        <Link to="/" className="text-primary" style={{ textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <span className="text-ink" style={{ fontWeight: 600 }}>All Rooms</span>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Desktop Filter Sidebar — sticky so it follows scroll */}
        <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 80, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <FilterPanel />
        </div>

        {/* Mobile filter button */}
        <button className="lg:hidden btn-outline btn-sm" onClick={() => setSidebarOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>
          Filters {(filters.roomType.length || filters.minPrice || filters.maxPrice || filters.guests) ? `(active)` : ''}
        </button>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-80 p-4 overflow-y-auto" style={{ background: 'var(--surface-card)' }} onClick={e => e.stopPropagation()}>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <p className="body-md text-charcoal">
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{filtered.length}</span> rooms found
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="body-sm text-charcoal">Sort by:</span>
              <select className="select" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', paddingRight: 36, fontSize: 14, height: 38 }}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {(filters.location.length > 0 || filters.roomType.length > 0 || filters.minPrice || filters.maxPrice || filters.checkIn || filters.checkOut || filters.guests) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {filters.location.map(loc => (
                <button key={loc} onClick={() => toggleLocation(loc)} className="badge badge-primary" style={{ cursor: 'pointer' }}>
                  📍 {loc} ×
                </button>
              ))}
              {filters.checkIn && <button onClick={() => setFilters(p => ({ ...p, checkIn: '' }))} className="badge badge-tag" style={{ cursor: 'pointer', border: '1px solid var(--hairline)' }}>Check-in: {filters.checkIn} ×</button>}
              {filters.checkOut && <button onClick={() => setFilters(p => ({ ...p, checkOut: '' }))} className="badge badge-tag" style={{ cursor: 'pointer', border: '1px solid var(--hairline)' }}>Check-out: {filters.checkOut} ×</button>}
              {filters.guests && <button onClick={() => setFilters(p => ({ ...p, guests: '' }))} className="badge badge-tag" style={{ cursor: 'pointer', border: '1px solid var(--hairline)' }}>{filters.guests} Guests ×</button>}
              {filters.roomType.map(t => (
                <button key={t} onClick={() => toggleType(t)} className="badge badge-tag" style={{ cursor: 'pointer', border: '1px solid var(--hairline)' }}>
                  {t} ×
                </button>
              ))}
              {filters.minPrice && <button onClick={() => setFilters(p => ({ ...p, minPrice: '' }))} className="badge badge-tag" style={{ cursor: 'pointer' }}>Min ₫{Number(filters.minPrice).toLocaleString()} ×</button>}
              {filters.maxPrice && <button onClick={() => setFilters(p => ({ ...p, maxPrice: '' }))} className="badge badge-tag" style={{ cursor: 'pointer' }}>Max ₫{Number(filters.maxPrice).toLocaleString()} ×</button>}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 32px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 className="heading-sm" style={{ marginBottom: 8 }}>No rooms match your filters</h3>
              <p className="body-md text-charcoal" style={{ marginBottom: 20 }}>Try adjusting or clearing your filters</p>
              <button className="btn-outline" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(room => (
                <div key={room.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(32,32,32,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
                  <div style={{ position: 'relative' }}>
                    <img src={room.primaryImageUrl} alt={room.roomNumber} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <StatusBadge status={room.status} />
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p className="body-sm text-charcoal" style={{ marginBottom: 3 }}>{room.propertyName}</p>
                    <h3 className="heading-sm" style={{ marginBottom: 6, fontSize: 17 }}>{room.roomNumber} — {room.roomType}</h3>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }} className="body-sm text-charcoal">
                      <span>👥 {room.capacity}</span>
                      <span>📐 {room.area}m²</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <StarRating rating={room.rating} />
                      <span className="body-sm text-charcoal">({room.reviews})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <div>
                        <span className="heading-sm text-primary">₫{room.pricePerNight.toLocaleString()}</span>
                        <span className="body-sm text-charcoal">/night</span>
                      </div>
                      <Link to={`/rooms/${room.id}`} className="btn-outline btn-sm" onClick={e => e.stopPropagation()}>View Detail</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export: standalone page with its own layout
export default function RoomListingPage() {
  return (
    <PublicLayout>
      <RoomListingContent />
    </PublicLayout>
  );
}
