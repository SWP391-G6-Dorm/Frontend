import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_PROPERTIES, MOCK_ROOMS, MOCK_BLOCKS, StatusBadge, KpiCard, PageHeader, FilterBar, formatDate, formatPrice } from './shared';

// SCR-35 — Property List
export function PropertyListPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_PROPERTIES.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <PageHeader title="My Properties" sub={`${MOCK_PROPERTIES.length} properties`}
          action={<Link to="/landlord/properties/create" className="btn-primary" style={{ height: 40, padding: '0 20px', fontSize: 14, textDecoration: 'none' }}>+ Add Property</Link>}
        />
        <FilterBar search={search} onSearch={setSearch} />

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <div className="text-5xl mb-3">🏢</div>
            <h3 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>No properties found</h3>
            <Link to="/landlord/properties/create" className="btn-primary mt-3">Add Your First Property</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(prop => {
              const occ = Math.round(prop.occupiedRooms / prop.totalRooms * 100);
              return (
                <div key={prop.id} className="card overflow-hidden flex flex-col">
                  <div className="h-40 overflow-hidden" style={{ background: 'var(--surface-bone)' }}>
                    <img
                      src={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=480&q=70&sig=${prop.id}`}
                      alt={prop.name} className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>{prop.name}</h3>
                      <StatusBadge status={prop.status} />
                    </div>
                    <p className="body-sm mb-4 flex items-center gap-1" style={{ color: 'var(--charcoal)' }}>
                      📍 {prop.address}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: 'Total Rooms', value: prop.totalRooms },
                        { label: 'Occupied',    value: prop.occupiedRooms },
                        { label: 'Occupancy',   value: `${occ}%` },
                      ].map(s => (
                        <div key={s.label} className="text-center rounded-lg py-2" style={{ background: 'var(--surface-bone)' }}>
                          <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{s.value}</p>
                          <p className="caption" style={{ color: 'var(--ash)', fontSize: 10 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Occupancy bar */}
                    <div className="rounded-full overflow-hidden mb-4" style={{ height: 4, background: 'var(--surface-bone)' }}>
                      <div className="rounded-full h-full" style={{ width: `${occ}%`, background: occ > 80 ? 'var(--success)' : occ > 50 ? 'var(--warning)' : 'var(--error)' }} />
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link to={`/landlord/properties/${prop.id}`} className="btn-primary flex-1" style={{ height: 36, justifyContent: 'center', fontSize: 13, textDecoration: 'none' }}>
                        View
                      </Link>
                      <Link to={`/landlord/properties/${prop.id}/edit`} className="btn-outline" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
                        ✏️
                      </Link>
                      <Link to={`/landlord/rooms?property=${prop.id}`} className="btn-ghost" style={{ height: 36, padding: '0 14px', fontSize: 13, color: 'var(--charcoal)' }}>
                        Rooms
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}

// SCR-36 — Property Detail
export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const property = MOCK_PROPERTIES.find(p => p.id === id) ?? MOCK_PROPERTIES[0];
  const rooms = MOCK_ROOMS.filter(r => r.propertyId === property.id);
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;

  return (
    <LandlordLayout>
      <div className="animate-fade-up">
        <nav className="flex items-center gap-2 mb-5 body-sm" style={{ color: 'var(--ash)' }}>
          <Link to="/landlord/properties" style={{ color: 'var(--ash)', textDecoration: 'none' }}>Properties</Link>
          <span>/</span><span style={{ color: 'var(--ink)' }}>{property.name}</span>
        </nav>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{property.name}</h1>
              <StatusBadge status={property.status} />
            </div>
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>📍 {property.address}</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/landlord/properties/${property.id}/edit`} className="btn-outline" style={{ height: 38, padding: '0 18px', fontSize: 13 }}>✏️ Edit</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <KpiCard icon="🏠" label="Total Rooms"  value={rooms.length}  sub="across all blocks" />
          <KpiCard icon="✅" label="Occupied"      value={occupied}       sub={`${Math.round(occupied/rooms.length*100)||0}% occupancy`} color="var(--success)" />
          <KpiCard icon="🔑" label="Available"     value={rooms.filter(r=>r.status==='AVAILABLE').length} sub="ready to rent" color="var(--primary)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Info card */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>Property Details</h3>
            {[
              { label: 'Address',     value: property.address },
              { label: 'Status',      value: null, node: <StatusBadge status={property.status} /> },
              { label: 'Created',     value: formatDate(property.createdAt) },
              { label: 'Facilities',  value: (property as any).facilities || 'None' },
              { label: 'Description', value: property.description },
            ].map(row => (
              <div key={row.label} className="py-2.5 border-b" style={{ borderColor: 'var(--hairline)' }}>
                <p className="caption mb-1" style={{ color: 'var(--ash)' }}>{row.label}</p>
                {row.node ?? <p className="body-sm" style={{ color: 'var(--ink)' }}>{row.value}</p>}
              </div>
            ))}
          </div>

          {/* Room table */}
          <div className="card lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
              <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Rooms</h3>
              <Link to={`/landlord/rooms/create?property=${property.id}`} className="btn-primary" style={{ height: 34, padding: '0 16px', fontSize: 13, textDecoration: 'none' }}>+ Add Room</Link>
            </div>
            {rooms.map((room, i) => (
              <Link key={room.id} to={`/landlord/rooms/${room.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors"
                style={{ textDecoration: 'none', borderBottom: i < rooms.length - 1 ? '1px solid var(--hairline)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-bone)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{room.roomNumber}</p>
                  <p className="caption" style={{ color: 'var(--ash)' }}>{room.roomType} · {room.blockName} F{room.floorNumber}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="body-sm font-semibold" style={{ color: 'var(--primary)' }}>{formatPrice(room.pricePerMonth)}</p>
                  <StatusBadge status={room.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

// SCR-37 / SCR-38 — Add / Edit Property (shared form)
export function PropertyFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const existing = mode === 'edit' ? MOCK_PROPERTIES.find(p => p.id === id) : null;

  const [name, setName]           = useState(existing?.name ?? '');
  const [address, setAddress]     = useState(existing?.address ?? '');
  const [description, setDesc]    = useState(existing?.description ?? '');
  const [status, setStatus]       = useState(existing?.status ?? 'DRAFT');
  const [facilities, setFacilities] = useState((existing as any)?.facilities ?? '');
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Property name is required.';
    if (!address.trim()) e.address = 'Address is required.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === 'create') {
        const newProp = {
          id: `p-${Math.random().toString(36).substr(2, 9)}`,
          name,
          address,
          description,
          status,
          facilities,
          createdAt: new Date().toISOString().split('T')[0],
          totalRooms: 0,
          occupiedRooms: 0
        };
        MOCK_PROPERTIES.push(newProp);
      } else {
        const idx = MOCK_PROPERTIES.findIndex(p => p.id === id);
        if (idx !== -1) {
          MOCK_PROPERTIES[idx] = {
            ...MOCK_PROPERTIES[idx],
            name,
            address,
            description,
            status,
            facilities
          } as any;
        }
      }
      navigate('/landlord/properties');
    }, 1000);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 640 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/landlord/properties" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{mode === 'create' ? 'Add Property' : 'Edit Property'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            <div className="flex flex-col gap-5">
              {/* Property.name */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Property Name <span style={{ color: 'var(--error)' }}>*</span></label>
                <input id="prop-name" type="text" className="input-field-rect" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunset Apartments" maxLength={200} />
                {errors.name && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.name}</p>}
              </div>

              {/* Property.address */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Address <span style={{ color: 'var(--error)' }}>*</span></label>
                <input id="prop-address" type="text" className="input-field-rect" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" />
                {errors.address && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.address}</p>}
              </div>

              {/* Property.description */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Description</label>
                <textarea className="textarea-field" rows={4} value={description} onChange={e => setDesc(e.target.value)} placeholder="Describe the property…" />
              </div>

              {/* Property.facilities */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Facilities / Attributes (comma-separated)</label>
                <input id="prop-facilities" type="text" className="input-field-rect" value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="e.g. Elevator, Security 24/7, Swimming Pool, Parking" />
              </div>

              {/* Property.status */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Status</label>
                <select className="input-field-rect" value={status} onChange={e => setStatus(e.target.value)} style={{ cursor: 'pointer' }}>
                  {['DRAFT','ACTIVE','SUSPENDED'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}>
                {loading ? '…' : mode === 'create' ? '🏢 Create Property' : '💾 Save Changes'}
              </button>
              <Link to="/landlord/properties" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}

// SCR-39 — Block/Floor Management
export function BlockFloorPage() {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const property = propertyId ? MOCK_PROPERTIES.find(p => p.id === propertyId) : MOCK_PROPERTIES[0];
  const blocks = MOCK_BLOCKS.filter(b => b.propertyId === (property?.id ?? 'p-001'));
  const [showAdd, setShowAdd] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [floorNum, setFloorNum] = useState('');

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 720 }}>
        <PageHeader title="Block / Floor Management"
          sub={`Property: ${property?.name}`}
          action={<button className="btn-primary" style={{ height: 40, padding: '0 18px', fontSize: 14 }} onClick={() => setShowAdd(true)}>+ Add Block</button>}
        />

        {showAdd && (
          <div className="card mb-5" style={{ padding: 24 }}>
            <h3 className="heading-sm mb-4" style={{ color: 'var(--ink)' }}>New Block / Floor</h3>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1" style={{ minWidth: 160 }}>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Block Name <span style={{ color: 'var(--error)' }}>*</span></label>
                <input type="text" className="input-field-rect" value={blockName} onChange={e => setBlockName(e.target.value)} placeholder="e.g. Block C" />
              </div>
              <div style={{ width: 160 }}>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Floor Number <span style={{ color: 'var(--error)' }}>*</span></label>
                <input type="number" className="input-field-rect" value={floorNum} onChange={e => setFloorNum(e.target.value)} placeholder="e.g. 3" min="1" max="50" />
              </div>
              <div className="flex items-end gap-2">
                <button className="btn-primary" style={{ height: 44, padding: '0 20px' }} onClick={() => setShowAdd(false)}>Save</button>
                <button className="btn-ghost" style={{ height: 44, padding: '0 16px' }} onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="grid gap-4 px-5 py-3 border-b"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Block Name', 'Floor No.', 'Rooms', ''].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {blocks.map((block, i) => {
            const blockRooms = MOCK_ROOMS.filter(r => r.blockFloorId === block.id);
            return (
              <div key={block.id} className="grid gap-4 px-5 py-4 items-center"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: i < blocks.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{block.blockName}</p>
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>Floor {block.floorNumber}</p>
                <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{blockRooms.length} rooms</p>
                <div className="flex gap-2">
                  <button className="btn-ghost" style={{ height: 30, padding: '0 12px', fontSize: 12, color: 'var(--charcoal)' }}>✏️ Edit</button>
                  <button className="btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 12, color: 'var(--error)' }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LandlordLayout>
  );
}
