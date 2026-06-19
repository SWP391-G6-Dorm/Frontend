import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Pagination from '../../components/ui/Pagination';
import {
  fetchRooms,
  fetchPropertyOptions,
  sortToApi,
  ROOM_TYPES,
  type RoomListItem,
  type PropertyOption,
} from '../../api/roomsApi';
import SafeImage from '../../components/ui/SafeImage';

const PAGE_SIZE = 12;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    AVAILABLE: { cls: 'badge-success', label: 'Available' },
    PENDING_DEPOSIT: { cls: 'badge-warning', label: 'Pending' },
    RESERVED: { cls: 'badge-info', label: 'Reserved' },
    OCCUPIED: { cls: 'badge-neutral', label: 'Occupied' },
    MAINTENANCE: { cls: 'badge-neutral', label: 'Maintenance' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#ea2804' : '#e5e7eb'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span className="body-sm text-charcoal" style={{ marginLeft: 2 }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function ListingRoomCard({ room }: { room: RoomListItem }) {
  const rating = room.averageRating ?? 0;
  const reviews = room.totalReviews ?? 0;

  return (
    <Link
      to={`/rooms/${room.id}`}
      className="card"
      style={{
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(32,32,32,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
        <SafeImage
          src={room.primaryImageUrl}
          alt={room.roomNumber}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <StatusBadge status={room.status} />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <p className="body-sm text-charcoal" style={{ marginBottom: 3 }}>
          {room.propertyName}
          {room.floorNumber != null && ` · Floor ${room.floorNumber}`}
        </p>
        <h3 className="heading-sm" style={{ marginBottom: 6, fontSize: 17 }}>
          {room.roomNumber} — {room.roomType}
        </h3>
        <div className="flex gap-3 body-sm text-charcoal" style={{ marginBottom: 8 }}>
          <span>👥 {room.capacity}</span>
          <span>📐 {room.area}m²</span>
        </div>
        {rating > 0 && (
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <StarRating rating={rating} />
            <span className="body-sm text-charcoal">({reviews})</span>
          </div>
        )}
        <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
          <div>
            <span className="heading-sm text-primary">₫{Number(room.pricePerNight).toLocaleString()}</span>
            <span className="body-sm text-charcoal">/night</span>
          </div>
          <span className="btn-outline btn-sm" style={{ borderRadius: 9999, pointerEvents: 'none' }}>
            View Detail
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return <div className="card" style={{ height: 380, background: 'var(--surface-bone)', opacity: 0.65 }} />;
}

export function RoomListingContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = Number(searchParams.get('page') || '0');
  const urlSort = searchParams.get('sort') || 'newest';
  const urlLocation = searchParams.get('location') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlPropertyId = searchParams.get('propertyId') || '';
  const urlRoomTypesKey = searchParams.get('roomType') || '';
  const urlRoomTypes = useMemo(
    () => (urlRoomTypesKey ? urlRoomTypesKey.split(',').filter(Boolean) : []),
    [urlRoomTypesKey]
  );
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';
  const urlGuests = searchParams.get('guests') || '';
  const urlCheckIn = searchParams.get('checkIn') || '';
  const urlCheckOut = searchParams.get('checkOut') || '';

  const [draft, setDraft] = useState({
    search: urlSearch || urlLocation,
    propertyId: urlPropertyId,
    roomTypes: urlRoomTypes,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    guests: urlGuests,
    checkIn: urlCheckIn,
    checkOut: urlCheckOut,
    sort: urlSort,
  });

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  useEffect(() => {
    setDraft({
      search: urlSearch || urlLocation,
      propertyId: urlPropertyId,
      roomTypes: urlRoomTypes,
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice,
      guests: urlGuests,
      checkIn: urlCheckIn,
      checkOut: urlCheckOut,
      sort: urlSort,
    });
  }, [
    searchParams,
    urlSearch,
    urlLocation,
    urlPropertyId,
    urlRoomTypesKey,
    urlMinPrice,
    urlMaxPrice,
    urlGuests,
    urlCheckIn,
    urlCheckOut,
    urlSort,
    urlRoomTypesKey,
  ]);

  useEffect(() => {
    fetchPropertyOptions()
      .then(setProperties)
      .catch(() => setProperties([]));
  }, []);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRooms({
        page: urlPage,
        size: PAGE_SIZE,
        sort: sortToApi(urlSort),
        search: urlSearch || undefined,
        location: urlLocation || undefined,
        propertyId: urlPropertyId || undefined,
        roomType: urlRoomTypes.length ? urlRoomTypes.join(',') : undefined,
        minPrice: urlMinPrice ? Number(urlMinPrice) : undefined,
        maxPrice: urlMaxPrice ? Number(urlMaxPrice) : undefined,
        capacity: urlGuests ? Number(urlGuests) : undefined,
        checkIn: urlCheckIn || undefined,
        checkOut: urlCheckOut || undefined,
        status: 'AVAILABLE',
      });
      setRooms(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch {
      setRooms([]);
      setTotalElements(0);
      setTotalPages(0);
      setError('Unable to load rooms. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [
    urlPage,
    urlSort,
    urlSearch,
    urlLocation,
    urlPropertyId,
    urlRoomTypesKey,
    urlMinPrice,
    urlMaxPrice,
    urlGuests,
    urlCheckIn,
    urlCheckOut,
  ]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function applyFilters(resetPage = true) {
    const next = new URLSearchParams();
    if (draft.search.trim()) {
      const term = draft.search.trim();
      const matchedProperty = properties.find((p) => p.name.toLowerCase() === term.toLowerCase());
      if (matchedProperty) {
        next.set('search', term);
      } else {
        next.set('location', term);
      }
    }
    if (draft.propertyId) next.set('propertyId', draft.propertyId);
    if (draft.roomTypes.length) next.set('roomType', draft.roomTypes.join(','));
    if (draft.minPrice) next.set('minPrice', draft.minPrice);
    if (draft.maxPrice) next.set('maxPrice', draft.maxPrice);
    if (draft.guests) next.set('guests', draft.guests);
    if (draft.checkIn) next.set('checkIn', draft.checkIn);
    if (draft.checkOut) next.set('checkOut', draft.checkOut);
    if (draft.sort && draft.sort !== 'newest') next.set('sort', draft.sort);
    if (!resetPage && urlPage > 0) next.set('page', String(urlPage));
    setSearchParams(next);
  }

  function clearFilters() {
    setDraft({
      search: '',
      propertyId: '',
      roomTypes: [],
      minPrice: '',
      maxPrice: '',
      guests: '',
      checkIn: '',
      checkOut: '',
      sort: 'newest',
    });
    setSearchParams({});
  }

  function toggleRoomType(type: string) {
    setDraft((p) => ({
      ...p,
      roomTypes: p.roomTypes.includes(type)
        ? p.roomTypes.filter((t) => t !== type)
        : [...p.roomTypes, type],
    }));
  }

  function handleSortChange(sort: string) {
    const next = new URLSearchParams(searchParams);
    if (sort === 'newest') next.delete('sort');
    else next.set('sort', sort);
    next.delete('page');
    setSearchParams(next);
  }

  function handlePageChange(page: number) {
    const next = new URLSearchParams(searchParams);
    if (page <= 0) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (urlLocation) chips.push({ label: `📍 ${urlLocation}`, onRemove: () => { const n = new URLSearchParams(searchParams); n.delete('location'); n.delete('page'); setSearchParams(n); } });
    if (urlSearch) chips.push({ label: `🔍 ${urlSearch}`, onRemove: () => { const n = new URLSearchParams(searchParams); n.delete('search'); n.delete('page'); setSearchParams(n); } });
    urlRoomTypes.forEach((t) => chips.push({ label: t, onRemove: () => { const n = new URLSearchParams(searchParams); const rest = urlRoomTypes.filter((x) => x !== t); if (rest.length) n.set('roomType', rest.join(',')); else n.delete('roomType'); n.delete('page'); setSearchParams(n); } }));
    if (urlMinPrice) chips.push({ label: `Min ₫${Number(urlMinPrice).toLocaleString()}`, onRemove: () => { const n = new URLSearchParams(searchParams); n.delete('minPrice'); n.delete('page'); setSearchParams(n); } });
    if (urlMaxPrice) chips.push({ label: `Max ₫${Number(urlMaxPrice).toLocaleString()}`, onRemove: () => { const n = new URLSearchParams(searchParams); n.delete('maxPrice'); n.delete('page'); setSearchParams(n); } });
    if (urlGuests) chips.push({ label: `${urlGuests} guests`, onRemove: () => { const n = new URLSearchParams(searchParams); n.delete('guests'); n.delete('page'); setSearchParams(n); } });
    if (urlPropertyId) {
      const prop = properties.find((p) => p.id === urlPropertyId);
      chips.push({ label: prop?.name ?? 'Property', onRemove: () => { const n = new URLSearchParams(searchParams); n.delete('propertyId'); n.delete('page'); setSearchParams(n); } });
    }
    return chips;
  }, [searchParams, urlLocation, urlSearch, urlRoomTypes, urlMinPrice, urlMaxPrice, urlGuests, urlPropertyId, properties, setSearchParams]);

  return (
    <div className="container-wide section-pad-sm">
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 24 }}>
        <Link to="/" className="text-primary" style={{ textDecoration: 'none' }}>
          Home
        </Link>
        <span>›</span>
        <span className="text-ink" style={{ fontWeight: 600 }}>
          All Rooms
        </span>
      </div>

      {/* Filter bar */}
      <section
        className="card"
        style={{ padding: '20px 24px', marginBottom: 28, background: 'var(--surface-bone)', border: '1px solid var(--hairline)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" style={{ marginBottom: 16 }}>
          <div>
            <label className="form-label">Search</label>
            <input
              className="input"
              placeholder="Location, property or room..."
              value={draft.search}
              onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <div>
            <label className="form-label">Property</label>
            <select
              className="select"
              value={draft.propertyId}
              onChange={(e) => setDraft((p) => ({ ...p, propertyId: e.target.value }))}
            >
              <option value="">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Min price (₫/night)</label>
            <input
              type="number"
              min={0}
              className="input"
              placeholder="500000"
              value={draft.minPrice}
              onChange={(e) => setDraft((p) => ({ ...p, minPrice: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Max price (₫/night)</label>
            <input
              type="number"
              min={0}
              className="input"
              placeholder="3000000"
              value={draft.maxPrice}
              onChange={(e) => setDraft((p) => ({ ...p, maxPrice: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p className="form-label" style={{ marginBottom: 10 }}>
            Room type
          </p>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((type) => {
              const active = draft.roomTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  className={active ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
                  style={{ borderRadius: 9999, border: active ? undefined : '1px solid var(--hairline)' }}
                  onClick={() => toggleRoomType(type)}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
          <div>
            <label className="form-label">Check-in</label>
            <input
              type="date"
              className="input"
              value={draft.checkIn}
              onChange={(e) => setDraft((p) => ({ ...p, checkIn: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Check-out</label>
            <input
              type="date"
              className="input"
              value={draft.checkOut}
              onChange={(e) => setDraft((p) => ({ ...p, checkOut: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Min guests</label>
            <input
              type="number"
              min={1}
              max={20}
              className="input"
              placeholder="2"
              value={draft.guests}
              onChange={(e) => setDraft((p) => ({ ...p, guests: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary btn-sm" onClick={() => applyFilters(true)}>
            Apply filters
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 20 }}>
        <p className="body-md text-charcoal">
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{totalElements}</span> rooms found
        </p>
        <div className="flex items-center gap-2">
          <span className="body-sm text-charcoal">Sort by:</span>
          <select
            className="select"
            value={urlSort}
            onChange={(e) => handleSortChange(e.target.value)}
            style={{ width: 'auto', paddingRight: 36, fontSize: 14, height: 38 }}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="badge badge-tag"
              style={{ cursor: 'pointer', border: '1px solid var(--hairline)' }}
              onClick={chip.onRemove}
            >
              {chip.label} ×
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="body-sm" style={{ color: 'var(--error)', textAlign: 'center', marginBottom: 16 }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>
            No rooms match your filters
          </h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 20 }}>
            Try adjusting or clearing your filters
          </p>
          <button type="button" className="btn-outline" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <ListingRoomCard key={room.id} room={room} />
            ))}
          </div>
          <Pagination page={urlPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default function RoomListingPage() {
  return (
    <PublicLayout>
      <RoomListingContent />
    </PublicLayout>
  );
}
