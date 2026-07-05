import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { createRoom, CreateRoomPayload, RoomDetail } from '../../api/roomsApi';
import { fetchPropertyOptions, PropertyOption } from '../../api/roomsApi';
import { floorApi, FloorSummary } from '../../api/floorApi';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { value: 'Studio',   label: '🏠 Studio',   desc: 'Compact, open-plan room' },
  { value: 'Standard', label: '🛏️ Standard',  desc: 'Classic room with all basics' },
  { value: 'Deluxe',   label: '✨ Deluxe',   desc: 'Enhanced comfort and amenities' },
  { value: 'Suite',    label: '🌟 Suite',    desc: 'Spacious with premium furnishings' },
  { value: 'Villa',    label: '🏡 Villa',    desc: 'Private villa with full facilities' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(raw: string): string {
  const n = Number(raw);
  if (!raw || isNaN(n) || n <= 0) return '';
  return '₫' + n.toLocaleString('vi-VN');
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h2 className="heading-sm" style={{ fontSize: 15, letterSpacing: -0.2 }}>{title}</h2>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
      ⚠ {msg}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--hairline)', margin: '20px 0' }} />;
}

// ── Preview Panel ─────────────────────────────────────────────────────────────

function PreviewPanel({
  roomType,
  priceStr,
  capacity,
  area,
}: {
  roomType: string;
  priceStr: string;
  capacity: string;
  area: string;
}) {
  const priceFormatted = fmtPrice(priceStr);
  const typeInfo = ROOM_TYPES.find(t => t.value === roomType);

  return (
    <div
      className="card"
      style={{
        background: 'var(--surface-bone)',
        border: '1px solid var(--hairline)',
        padding: 24,
        position: 'sticky',
        top: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--charcoal)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Room Preview
      </p>

      {/* Price */}
      <div>
        {priceFormatted ? (
          <>
            <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 }}>
              {priceFormatted}
            </p>
            <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 2 }}>per night</p>
          </>
        ) : (
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--stone)' }}>Price not set</p>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--hairline)' }} />

      {/* Info rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Type</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{typeInfo?.label ?? roomType}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Capacity</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            {capacity ? `${capacity} guest${Number(capacity) !== 1 ? 's' : ''}` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Area</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{area ? `${area} m²` : '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Initial status</span>
          <span
            style={{
              background: '#2b9a66',
              color: '#fff',
              borderRadius: 9999,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            AVAILABLE
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--hairline)' }} />

      {/* Tip */}
      <div
        style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 8,
          padding: '10px 12px',
        }}
      >
        <p style={{ fontSize: 12, color: '#1D4ED8', lineHeight: 1.5 }}>
          💡 After creating the room, you can upload photos from the room detail page Gallery section.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AddRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL pre-fill params (from StructureTree / FloorManagement)
  const initPropertyId = searchParams.get('propertyId') ?? '';
  const initFloorId    = searchParams.get('floorId') ?? '';

  // ── Properties dropdown ───────────────────────────────────────────────────────
  const [properties, setProperties]     = useState<PropertyOption[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initPropertyId);

  // ── Floors dropdown (dependent on property) ───────────────────────────────────
  const [floors, setFloors]               = useState<FloorSummary[]>([]);
  const [floorsLoading, setFloorsLoading] = useState(false);

  // ── Form fields ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    floorId:       initFloorId,
    roomNumber:    '',
    roomType:      'Standard',
    pricePerNight: '',
    capacity:      '',
    area:          '',
    description:   '',
  });

  // ── Submission state ──────────────────────────────────────────────────────────
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');
  const [roomNumberError, setRoomNumberError] = useState('');

  // ── Load properties on mount ──────────────────────────────────────────────────
  useEffect(() => {
    setPropsLoading(true);
    fetchPropertyOptions()
      .then(list => setProperties(list))
      .catch(() => setError('Failed to load properties. Please refresh.'))
      .finally(() => setPropsLoading(false));
  }, []);

  // ── Load floors whenever selected property changes ────────────────────────────
  const loadFloors = useCallback(async (propertyId: string) => {
    if (!propertyId) {
      setFloors([]);
      return;
    }
    setFloorsLoading(true);
    try {
      const res = await floorApi.getByProperty(propertyId);
      const floorList: FloorSummary[] = res.data ?? [];
      setFloors(floorList);

      // If URL had a floorId and it belongs to this property → pre-select it
      if (initFloorId && floorList.some(fl => fl.id === initFloorId)) {
        setForm(f => ({ ...f, floorId: initFloorId }));
      }
    } catch {
      setFloors([]);
    } finally {
      setFloorsLoading(false);
    }
  }, [initFloorId]);

  useEffect(() => {
    // When property changes: reset floor selection, then load floors
    setForm(f => ({ ...f, floorId: '' }));
    loadFloors(selectedPropertyId);
  }, [selectedPropertyId, loadFloors]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId);
    // floor reset is handled by the useEffect above
  }

  function handleField(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (field === 'roomNumber') setRoomNumberError('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setRoomNumberError('');

    // Client-side guards
    if (!selectedPropertyId) { setError('Please select a Property.'); return; }
    if (!form.floorId)       { setError('Please select a Floor.'); return; }
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) {
      setError('Price per night must be greater than 0.');
      return;
    }
    if (!form.capacity || Number(form.capacity) < 1) {
      setError('Capacity must be at least 1.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateRoomPayload = {
        propertyId:    selectedPropertyId,
        floorId:       form.floorId,
        roomNumber:    form.roomNumber.trim(),
        roomType:      form.roomType,
        pricePerNight: Number(form.pricePerNight),
        capacity:      Number(form.capacity),
        ...(form.area        ? { area: Number(form.area) } : {}),
        ...(form.description ? { description: form.description.trim() } : {}),
      };

      const created: RoomDetail = await createRoom(payload);
      navigate(`/manager/rooms/${created.id}`);    // redirect to new room detail
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message ?? 'Failed to create room. Please try again.';

      if (status === 409) {
        // Duplicate room number — show inline under Room Number field
        setRoomNumberError(message);
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const formDisabled = !selectedPropertyId || !form.floorId;

  return (
    <ManagerLayout>
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 body-sm" style={{ marginBottom: 20, color: 'var(--charcoal)' }}>
        <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
        <span style={{ color: 'var(--stone)' }}>›</span>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Add New Room</span>
      </div>

      {/* ── Page title ── */}
      <h1 className="heading-md" style={{ marginBottom: 28 }}>Add New Room</h1>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Form card ── */}
        <div className="card" style={{ padding: 32 }}>

          {/* Global error banner */}
          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 14, color: '#991B1B', fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Section: Location ── */}
            <SectionHeader icon="📍" title="Location" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
              {/* Property selector */}
              <div>
                <label className="form-label form-label-required">Property</label>
                {propsLoading ? (
                  <div
                    style={{
                      height: 44,
                      background: 'var(--surface-bone)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 16,
                      color: 'var(--charcoal)',
                      fontSize: 13,
                    }}
                  >
                    Loading properties…
                  </div>
                ) : properties.length === 0 ? (
                  <div
                    style={{
                      background: '#FEF3C7',
                      border: '1px solid #F59E0B',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#92400E',
                    }}
                  >
                    No active properties found.{' '}
                    <Link to="/manager/properties/add" style={{ color: '#92400E', textDecoration: 'underline' }}>
                      Add a property first
                    </Link>
                  </div>
                ) : (
                  <select
                    id="scr41-property"
                    className="select"
                    value={selectedPropertyId}
                    onChange={e => handlePropertyChange(e.target.value)}
                    required
                  >
                    <option value="">— Select property —</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Floor selector (dependent) */}
              <div>
                <label className="form-label form-label-required">Floor</label>
                {floorsLoading ? (
                  <div
                    style={{
                      height: 44,
                      background: 'var(--surface-bone)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 16,
                      color: 'var(--charcoal)',
                      fontSize: 13,
                    }}
                  >
                    Loading floors…
                  </div>
                ) : (
                  <select
                    id="scr41-floor"
                    className="select"
                    value={form.floorId}
                    onChange={e => handleField('floorId', e.target.value)}
                    disabled={!selectedPropertyId || floorsLoading}
                    required
                    style={{
                      opacity: !selectedPropertyId ? 0.5 : 1,
                      cursor: !selectedPropertyId ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="">
                      {!selectedPropertyId ? '— Select property first —' : '— Select floor —'}
                    </option>
                    {floors.map(fl => (
                      <option key={fl.id} value={fl.id}>
                        Floor {fl.floorNumber}{fl.description ? ` — ${fl.description}` : ''}{' '}
                        ({fl.roomCount} room{fl.roomCount !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                )}
                {selectedPropertyId && !floorsLoading && floors.length === 0 && (
                  <p className="body-sm" style={{ color: 'var(--charcoal)', marginTop: 4 }}>
                    No floors found.{' '}
                    <Link to="/manager/floors" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      Add a floor →
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <Divider />

            {/* ── Section: Room Info ── */}
            <SectionHeader icon="🏠" title="Room Info" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Room Number */}
              <div>
                <label className="form-label form-label-required" htmlFor="scr41-roomNumber">
                  Room Number
                </label>
                <input
                  id="scr41-roomNumber"
                  className="input"
                  placeholder="e.g., Suite 08, Villa 01"
                  value={form.roomNumber}
                  onChange={e => handleField('roomNumber', e.target.value)}
                  required
                  disabled={formDisabled}
                  style={{
                    borderColor: roomNumberError ? '#DC2626' : undefined,
                    boxShadow:   roomNumberError ? '0 0 0 3px rgba(220,38,38,0.12)' : undefined,
                    opacity: formDisabled ? 0.5 : 1,
                  }}
                />
                {roomNumberError && <FieldError msg={roomNumberError} />}
                <p className="body-sm" style={{ color: 'var(--stone)', marginTop: 4 }}>
                  Must be unique within the selected property
                </p>
              </div>

              {/* Room Type */}
              <div>
                <label className="form-label" htmlFor="scr41-roomType">Room Type</label>
                <select
                  id="scr41-roomType"
                  className="select"
                  value={form.roomType}
                  onChange={e => handleField('roomType', e.target.value)}
                  disabled={formDisabled}
                  style={{ opacity: formDisabled ? 0.5 : 1 }}
                >
                  {ROOM_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="body-sm" style={{ color: 'var(--stone)', marginTop: 4 }}>
                  {ROOM_TYPES.find(t => t.value === form.roomType)?.desc}
                </p>
              </div>
            </div>

            <Divider />

            {/* ── Section: Pricing & Capacity ── */}
            <SectionHeader icon="💰" title="Pricing & Capacity" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {/* Price per night */}
              <div>
                <label className="form-label form-label-required" htmlFor="scr41-price">
                  Price / Night (₫)
                </label>
                <input
                  id="scr41-price"
                  type="number"
                  className="input"
                  placeholder="e.g., 1500000"
                  min={1000}
                  step={1000}
                  value={form.pricePerNight}
                  onChange={e => handleField('pricePerNight', e.target.value)}
                  required
                  disabled={formDisabled}
                  style={{ opacity: formDisabled ? 0.5 : 1 }}
                />
                {form.pricePerNight && (
                  <p className="body-sm" style={{ color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
                    {fmtPrice(form.pricePerNight)}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="form-label form-label-required" htmlFor="scr41-capacity">
                  Capacity (guests)
                </label>
                <input
                  id="scr41-capacity"
                  type="number"
                  className="input"
                  placeholder="e.g., 2"
                  min={1}
                  max={20}
                  value={form.capacity}
                  onChange={e => handleField('capacity', e.target.value)}
                  required
                  disabled={formDisabled}
                  style={{ opacity: formDisabled ? 0.5 : 1 }}
                />
              </div>

              {/* Area */}
              <div>
                <label className="form-label" htmlFor="scr41-area">Area (m²)</label>
                <input
                  id="scr41-area"
                  type="number"
                  className="input"
                  placeholder="e.g., 35"
                  min={0}
                  step={0.5}
                  value={form.area}
                  onChange={e => handleField('area', e.target.value)}
                  disabled={formDisabled}
                  style={{ opacity: formDisabled ? 0.5 : 1 }}
                />
                <p className="body-sm" style={{ color: 'var(--stone)', marginTop: 4 }}>Optional</p>
              </div>
            </div>

            <Divider />

            {/* ── Section: Description ── */}
            <SectionHeader icon="📝" title="Description" />

            <div style={{ marginBottom: 28 }}>
              <label className="form-label" htmlFor="scr41-description">
                Room Description
              </label>
              <textarea
                id="scr41-description"
                className="textarea"
                rows={4}
                maxLength={2000}
                placeholder="Describe the room, its features, and what makes it special…"
                value={form.description}
                onChange={e => handleField('description', e.target.value)}
                disabled={formDisabled}
                style={{ opacity: formDisabled ? 0.5 : 1, resize: 'vertical' }}
              />
              <p className="body-sm" style={{ color: 'var(--stone)', textAlign: 'right', marginTop: 4 }}>
                {form.description.length} / 2000
              </p>
            </div>

            {/* ── Action row ── */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                id="scr41-submit"
                type="submit"
                className="btn-primary"
                disabled={saving || propsLoading}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    Creating Room…
                  </span>
                ) : (
                  '✓ Add Room'
                )}
              </button>
              <Link to="/manager/rooms" className="btn-ghost">Cancel</Link>

              {formDisabled && !saving && (
                <p className="body-sm" style={{ color: 'var(--charcoal)', marginLeft: 4 }}>
                  ← Select a property and floor to enable the form
                </p>
              )}
            </div>
          </form>
        </div>

        {/* ── RIGHT: Preview panel ── */}
        <PreviewPanel
          roomType={form.roomType}
          priceStr={form.pricePerNight}
          capacity={form.capacity}
          area={form.area}
        />
      </div>
    </ManagerLayout>
  );
}
