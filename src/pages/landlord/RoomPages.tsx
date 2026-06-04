import { useState, useRef } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_ROOMS, MOCK_PROPERTIES, MOCK_BLOCKS, StatusBadge, PageHeader, FilterBar, formatPrice, formatDate } from './shared';

// SCR-40 — Room Management List
export function RoomListPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [searchParams]            = useSearchParams();
  const propFilter                = searchParams.get('property');

  const filtered = MOCK_ROOMS
    .filter(r => !propFilter || r.propertyId === propFilter)
    .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
    .filter(r =>
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.propertyName.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="Room Management" sub={`${filtered.length} rooms`}
          action={<Link to="/landlord/rooms/create" className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14, textDecoration: 'none' }}>+ Add Room</Link>}
        />
        <FilterBar search={search} onSearch={setSearch}>
          {/* Room.status filter */}
          <select className="input-field-rect" style={{ height: 38, width: 160, cursor: 'pointer' }}
            value={statusFilter} onChange={e => setStatus(e.target.value)}>
            {['ALL','AVAILABLE','OCCUPIED','MAINTENANCE','DRAFT','ARCHIVED'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </FilterBar>

        <div className="card overflow-hidden">
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 0.8fr 1fr 100px', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Room No.', 'Property / Block', 'Type', 'Rent', 'Capacity', 'Status', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((room, i) => (
            <div key={room.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 0.8fr 1fr 100px', gap: '12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}
            >
              <div>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{room.roomNumber}</p>
                <p className="caption code-md" style={{ color: 'var(--ash)' }}>{room.code}</p>
              </div>
              <div>
                <p className="body-sm" style={{ color: 'var(--ink)' }}>{room.propertyName}</p>
                <p className="caption" style={{ color: 'var(--ash)' }}>{room.blockName} · F{room.floorNumber}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.roomType}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--primary)' }}>{formatPrice(room.pricePerMonth)}</p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.capacity}</p>
              <StatusBadge status={room.status} />
              <div className="flex gap-1">
                <Link to={`/landlord/rooms/${room.id}`} className="btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 12, color: 'var(--charcoal)' }}>View</Link>
                <Link to={`/landlord/rooms/${room.id}/edit`} className="btn-ghost" style={{ height: 30, padding: '0 8px', fontSize: 12, color: 'var(--charcoal)' }}>✏️</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// SCR-41 — Room Detail Management
export function RoomDetailManagementPage() {
  const { id } = useParams<{ id: string }>();
  const room = MOCK_ROOMS.find(r => r.id === id) ?? MOCK_ROOMS[0];

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 900 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/rooms" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Rooms</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{room.roomNumber}</span>
        </nav>

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{room.roomNumber} — {room.roomType}</h1>
              <StatusBadge status={room.status} />
            </div>
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{room.propertyName} · {room.blockName} · Floor {room.floorNumber}</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/landlord/rooms/${room.id}/media`} className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>📷 Media</Link>
            <Link to={`/landlord/rooms/${room.id}/edit`} className="btn-primary" style={{ height: 38, padding: '0 18px', fontSize: 13, textDecoration: 'none' }}>✏️ Edit</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Room info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Room Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: 'Room Number', value: room.roomNumber },
                  { label: 'Room Code',   value: room.code, mono: true },
                  { label: 'Type',        value: room.roomType },
                  { label: 'Gender Type', value: room.genderType },
                  { label: 'Capacity',    value: `${room.capacity} persons` },
                  { label: 'Area',        value: `${room.area} m²` },
                  { label: 'Monthly Rent', value: formatPrice(room.pricePerMonth), bold: true },
                  { label: 'Status',      value: null, badge: room.status },
                ].map(row => (
                  <div key={row.label}>
                    <p className="caption" style={{ color: 'var(--ash)' }}>{row.label}</p>
                    {row.badge ? <StatusBadge status={row.badge} /> :
                     row.mono ? <p className="code-md" style={{ color: 'var(--ink)' }}>{row.value}</p> :
                     <p className="body-sm" style={{ color: row.bold ? 'var(--primary)' : 'var(--ink)', fontWeight: row.bold ? 700 : 500 }}>{row.value}</p>
                    }
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map(a => <span key={a} className="badge badge-neutral px-3 py-1">{a}</span>)}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-4">
            <div className="card" style={{ padding: 20 }}>
              <h3 className="heading-sm mb-3" style={{ color: 'var(--ink)' }}>Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Link to={`/landlord/rooms/${room.id}/edit`} className="btn-outline w-full" style={{ height: 38, justifyContent: 'center', fontSize: 13 }}>✏️ Edit Room</Link>
                <Link to={`/landlord/rooms/${room.id}/media`} className="btn-ghost w-full" style={{ height: 38, justifyContent: 'center', fontSize: 13, color: 'var(--charcoal)' }}>📷 Manage Photos</Link>
                <Link to={`/landlord/rooms?property=${room.propertyId}`} className="btn-ghost w-full" style={{ height: 38, justifyContent: 'center', fontSize: 13, color: 'var(--charcoal)' }}>← All Rooms</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

// SCR-42 / SCR-43 — Add / Edit Room (shared form)
export function RoomFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existing = mode === 'edit' ? MOCK_ROOMS.find(r => r.id === id) : null;

  const [propertyId, setPropertyId]   = useState(existing?.propertyId ?? searchParams.get('property') ?? '');
  const [blockId, setBlockId]         = useState(existing?.blockFloorId ?? '');
  const [roomNumber, setRoomNumber]   = useState(existing?.roomNumber ?? '');
  const [roomType, setRoomType]       = useState(existing?.roomType ?? 'Studio');
  const [capacity, setCapacity]       = useState(String(existing?.capacity ?? 1));
  const [genderType, setGenderType]   = useState(existing?.genderType ?? 'MIXED');
  const [price, setPrice]             = useState(String(existing?.pricePerMonth ?? ''));
  const [area, setArea]               = useState(String(existing?.area ?? ''));
  const [description, setDesc]        = useState('');
  const [amenities, setAmenities]     = useState(existing?.amenities.join(', ') ?? '');
  const [status, setStatus]           = useState(existing?.status ?? 'DRAFT');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const blocks = MOCK_BLOCKS.filter(b => b.propertyId === propertyId);

  function validate() {
    const e: Record<string, string> = {};
    if (!propertyId) e.property = 'Property is required.';
    if (!roomNumber.trim()) e.roomNumber = 'Room number is required.';
    if (!price || Number(price) <= 0) e.price = 'Monthly rent is required.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/landlord/rooms'); }, 1000);
  }

  const ROOM_TYPES   = ['Studio', 'Single Room', 'Double Room', 'Dormitory'];
  const GENDER_TYPES = ['MALE', 'FEMALE', 'MIXED'];
  const STATUSES     = ['DRAFT', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'ARCHIVED'];

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 700 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/landlord/rooms" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{mode === 'create' ? 'Add Room' : `Edit Room ${existing?.roomNumber}`}</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            <div className="flex flex-col gap-5">
              {/* Room.property */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Property <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={propertyId} onChange={e => { setPropertyId(e.target.value); setBlockId(''); }}>
                    <option value="">Select property…</option>
                    {MOCK_PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {errors.property && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.property}</p>}
                </div>
                {/* BlockFloor */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Block / Floor</label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={blockId} onChange={e => setBlockId(e.target.value)} disabled={!propertyId}>
                    <option value="">Select block…</option>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.blockName} F{b.floorNumber}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Room.roomNumber */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Room Number <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="text" className="input-field-rect" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. A-301" />
                  {errors.roomNumber && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.roomNumber}</p>}
                </div>
                {/* Room.roomType */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Room Type</label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={roomType} onChange={e => setRoomType(e.target.value)}>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Room.pricePerMonth */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Rent / Month (₫) <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="number" className="input-field-rect" value={price} onChange={e => setPrice(e.target.value)} placeholder="3500000" min="0" />
                  {errors.price && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.price}</p>}
                </div>
                {/* Room.capacity */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Capacity</label>
                  <input type="number" className="input-field-rect" value={capacity} onChange={e => setCapacity(e.target.value)} min="1" max="20" />
                </div>
                {/* Room.area */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Area (m²)</label>
                  <input type="number" className="input-field-rect" value={area} onChange={e => setArea(e.target.value)} placeholder="25" min="1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Room.genderType */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Gender Type</label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={genderType} onChange={e => setGenderType(e.target.value)}>
                    {GENDER_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                {/* Room.status */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Status</label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Room.amenities (JSON) */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Amenities (comma-separated)</label>
                <input type="text" className="input-field-rect" value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="WiFi, AC, Kitchen, Parking…" />
              </div>

              {/* Room.description */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Description</label>
                <textarea className="textarea-field" rows={4} value={description} onChange={e => setDesc(e.target.value)} placeholder="Room description…" />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}>
                {loading ? '…' : mode === 'create' ? '🏠 Create Room' : '💾 Save Changes'}
              </button>
              <Link to="/landlord/rooms" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}

// SCR-44 — Room Media Management
export function RoomMediaPage() {
  const { id } = useParams<{ id: string }>();
  const room = MOCK_ROOMS.find(r => r.id === id) ?? MOCK_ROOMS[0];
  const fileRef = useRef<HTMLInputElement>(null);

  const MOCK_IMAGES = [
    { id: 'ri-1', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=70', isPrimary: true,  sortOrder: 1 },
    { id: 'ri-2', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=70', isPrimary: false, sortOrder: 2 },
    { id: 'ri-3', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=70', isPrimary: false, sortOrder: 3 },
  ];

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 800 }}>
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/rooms" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Rooms</Link>
          <span>/</span>
          <Link to={`/landlord/rooms/${room.id}`} style={{ color: 'var(--ash)', textDecoration: 'none' }}>{room.roomNumber}</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>Media</span>
        </nav>
        <PageHeader title={`Media — ${room.roomNumber}`} sub="Manage RoomImage collection"
          action={<button className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14 }} onClick={() => fileRef.current?.click()}>+ Upload Photos</button>}
        />
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MOCK_IMAGES.map(img => (
            <div key={img.id} className="card overflow-hidden">
              <div className="relative" style={{ height: 160 }}>
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 badge badge-primary" style={{ fontSize: 10 }}>PRIMARY</span>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <p className="caption" style={{ color: 'var(--ash)' }}>Sort: {img.sortOrder}</p>
                <div className="flex gap-1">
                  {!img.isPrimary && (
                    <button className="btn-ghost" style={{ height: 28, padding: '0 10px', fontSize: 11, color: 'var(--primary)' }}>Set Primary</button>
                  )}
                  <button className="btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11, color: 'var(--error)' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
          {/* Upload placeholder */}
          <div
            className="card flex flex-col items-center justify-center cursor-pointer transition-all"
            style={{ height: 220, border: '2px dashed var(--hairline)' }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
          >
            <span className="text-3xl mb-2">📤</span>
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>Upload Photos</p>
            <p className="caption" style={{ color: 'var(--ash)' }}>JPG, PNG · Max 5MB</p>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
