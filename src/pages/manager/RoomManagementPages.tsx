// ─── RoomManagementPages.tsx — SCR-37 through 44 ─────────────────────────────
// All pages now fetch real data from API.

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import {
  fetchRoomById, createRoom, updateRoom, updateRoomStatus,
  uploadRoomImages, deleteRoomImage,
  fetchPropertyOptions,
  type RoomDetail,
} from '../../api/roomsApi';
import { floorApi, type FloorSummary } from '../../api/floorApi';

const ROOM_TYPES = ['Studio', 'Standard', 'Deluxe', 'Suite', 'Villa'];

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    AVAILABLE:       { cls: 'badge-success', l: 'Available' },
    PENDING_DEPOSIT: { cls: 'badge-warning', l: 'Pending' },
    RESERVED:        { cls: 'badge-info',    l: 'Reserved' },
    OCCUPIED:        { cls: 'badge-error',   l: 'Occupied' },
    MAINTENANCE:     { cls: 'badge-neutral', l: 'Maintenance' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

function useRoom(id: string | undefined) {
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchRoomById(id)
      .then(setRoom)
      .catch(() => setError('Không tải được thông tin phòng.'))
      .finally(() => setLoading(false));
  }, [id]);
  return { room, loading, error, setRoom };
}

// SCR-37: Re-export from dedicated file (real API implementation)
export { default as StructureTreePage } from './StructureTreePage';

// SCR-38: Re-export from dedicated file (real API implementation)
export { default as FloorManagementPage } from './FloorManagementPage';

// SCR-39: Re-export from dedicated file (real API implementation)
export { default as RoomListPage } from './RoomListPage';

// ── SCR-40: Room Detail (Manager) ─────────────────────────────────────────────
export function RoomDetailMgmtPage() {
  const { id } = useParams();
  const { room: r, loading, error } = useRoom(id);

  if (loading) return <ManagerLayout><div style={{ padding: 48, textAlign: 'center' }}><p className="body-md text-charcoal">Đang tải...</p></div></ManagerLayout>;
  if (error || !r) return <ManagerLayout><div className="alert alert-error" style={{ margin: 24 }}>{error || 'Không tìm thấy phòng.'}</div></ManagerLayout>;

  const primaryImage = r.images?.find(i => i.isPrimary)?.imageUrl ?? r.images?.[0]?.imageUrl;

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>{r.roomNumber}</span>
      </div>

      <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">{r.roomNumber} — {r.roomType}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge s={r.status} />
          <Link to={`/manager/rooms/${r.id}/edit`} className="btn-outline btn-sm">Edit</Link>
          <Link to={`/manager/rooms/${r.id}/gallery`} className="btn-ghost btn-sm">Gallery</Link>
          <Link to={`/manager/rooms/${r.id}/status`} className="btn-ghost btn-sm">Status</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          {primaryImage && (
            <img src={primaryImage} alt={r.roomNumber} style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
          )}
          <div className="card" style={{ padding: 24 }}>
            <h2 className="heading-sm" style={{ marginBottom: 12 }}>Mô tả</h2>
            <p className="body-md text-body">{r.description || '—'}</p>
          </div>
          {r.amenities?.length > 0 && (
            <div className="card" style={{ padding: 24, marginTop: 16 }}>
              <h2 className="heading-sm" style={{ marginBottom: 12 }}>Tiện nghi</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {r.amenities.map(a => <span key={a} className="badge badge-neutral">{a}</span>)}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { l: 'Property', v: r.propertyName },
            { l: 'Floor', v: `Floor ${r.floorNumber}` },
            { l: 'Type', v: r.roomType },
            { l: 'Capacity', v: `${r.capacity} guests` },
            { l: 'Area', v: r.area ? `${r.area} m²` : '—' },
            { l: 'Price/Night', v: `₫${Number(r.pricePerNight).toLocaleString()}` },
            { l: 'Rating', v: r.averageRating ? `⭐ ${r.averageRating.toFixed(1)} (${r.totalReviews})` : 'No reviews' },
          ].map(item => (
            <div key={item.l} className="card" style={{ padding: '12px 16px' }}>
              <p className="body-sm text-charcoal">{item.l}</p>
              <p style={{ fontWeight: 600, marginTop: 2 }}>{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-41: Add Room ──────────────────────────────────────────────────────────
export function AddRoomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    propertyId: '', floorId: '',
    roomNumber: '', roomType: 'Standard',
    pricePerNight: '', capacity: '', area: '', description: '',
  });
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPropertyOptions().then(setProperties).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.propertyId) { setFloors([]); setForm(p => ({ ...p, floorId: '' })); return; }
    floorApi.getByProperty(form.propertyId).then(res => {
      setFloors(res.data);
      if (res.data.length > 0) setForm(p => ({ ...p, floorId: res.data[0].id }));
    }).catch(() => {});
  }, [form.propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.propertyId || !form.floorId) { setError('Vui lòng chọn Property và Floor.'); return; }
    setLoading(true);
    setError('');
    try {
      await createRoom({
        propertyId: form.propertyId,
        floorId: form.floorId,
        roomNumber: form.roomNumber,
        roomType: form.roomType,
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        area: form.area ? Number(form.area) : undefined,
        description: form.description || undefined,
      });
      navigate('/manager/rooms');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Tạo phòng thất bại.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <ManagerLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Thêm phòng</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Thêm phòng mới</h1>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label form-label-required">Property</label>
              <select className="select" value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))} required>
                <option value="">-- Chọn property --</option>
                {properties.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label form-label-required">Floor</label>
              <select className="select" value={form.floorId} onChange={e => setForm(p => ({ ...p, floorId: e.target.value }))} required disabled={floors.length === 0}>
                <option value="">-- Chọn floor --</option>
                {floors.map(f => <option key={f.id} value={f.id}>Floor {f.floorNumber}{f.description ? ` — ${f.description}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label form-label-required">Số phòng</label>
              <input className="input" placeholder="VD: Villa 01" value={form.roomNumber} onChange={e => setForm(p => ({ ...p, roomNumber: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Loại phòng</label>
              <select className="select" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label form-label-required">Giá / đêm (₫)</label>
              <input type="number" className="input" placeholder="VD: 1500000" value={form.pricePerNight} onChange={e => setForm(p => ({ ...p, pricePerNight: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label form-label-required">Sức chứa (người)</label>
              <input type="number" min={1} max={20} className="input" placeholder="VD: 2" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Diện tích (m²)</label>
              <input type="number" className="input" placeholder="VD: 35" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Mô tả</label>
            <textarea className="textarea" rows={3} placeholder="Mô tả phòng..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Thêm phòng'}</button>
            <Link to="/manager/rooms" className="btn-ghost">Hủy</Link>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-42: Edit Room ─────────────────────────────────────────────────────────
export function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { room, loading: roomLoading, error: roomError } = useRoom(id);
  const [form, setForm] = useState({ roomNumber: '', roomType: 'Standard', pricePerNight: '', capacity: '', area: '', description: '' });
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (room && !initialized.current) {
      initialized.current = true;
      setForm({
        roomNumber:    room.roomNumber,
        roomType:      room.roomType,
        pricePerNight: String(room.pricePerNight),
        capacity:      String(room.capacity),
        area:          room.area ? String(room.area) : '',
        description:   room.description ?? '',
      });
      if (room.propertyId) {
        floorApi.getByProperty(room.propertyId).then(res => setFloors(res.data)).catch(() => {});
      }
    }
  }, [room]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await updateRoom(id, {
        roomNumber:    form.roomNumber,
        roomType:      form.roomType,
        pricePerNight: Number(form.pricePerNight),
        capacity:      Number(form.capacity),
        area:          form.area ? Number(form.area) : undefined,
        description:   form.description || undefined,
      });
      navigate(`/manager/rooms/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cập nhật thất bại.';
      setError(msg);
      setSaving(false);
    }
  }

  if (roomLoading) return <ManagerLayout><div style={{ padding: 48, textAlign: 'center' }}><p>Đang tải...</p></div></ManagerLayout>;
  if (roomError || !room) return <ManagerLayout><div className="alert alert-error" style={{ margin: 24 }}>{roomError || 'Không tìm thấy phòng.'}</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to={`/manager/rooms/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>{room.roomNumber}</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>Chỉnh sửa</span>
        </div>
        <h1 className="heading-md" style={{ marginBottom: 24 }}>Chỉnh sửa: {room.roomNumber}</h1>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="card-lg" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label className="form-label form-label-required">Số phòng</label><input className="input" value={form.roomNumber} onChange={e => setForm(p => ({ ...p, roomNumber: e.target.value }))} required /></div>
            <div><label className="form-label">Loại phòng</label>
              <select className="select" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="form-label">Giá / đêm (₫)</label><input type="number" className="input" value={form.pricePerNight} onChange={e => setForm(p => ({ ...p, pricePerNight: e.target.value }))} /></div>
            <div><label className="form-label">Sức chứa</label><input type="number" min={1} className="input" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
            <div><label className="form-label">Diện tích (m²)</label><input type="number" className="input" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
            <div>
              <label className="form-label">Floor hiện tại</label>
              <input className="input" readOnly value={floors.find(f => f.id === room.floorId)?.let?.(() => '') ?? `Floor ${room.floorNumber}`} style={{ background: 'var(--surface-bone)' }} />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}><label className="form-label">Mô tả</label><textarea className="textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            <Link to={`/manager/rooms/${id}`} className="btn-ghost">Hủy</Link>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-43: Room Gallery ──────────────────────────────────────────────────────
export function RoomGalleryPage() {
  const { id } = useParams();
  const { room, loading, error, setRoom } = useRoom(id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !id) return;
    setUploading(true);
    setUploadError('');
    try {
      await uploadRoomImages(id, Array.from(files));
      const updated = await fetchRoomById(id);
      setRoom(updated);
    } catch {
      setUploadError('Upload thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm('Xóa ảnh này?') || !id) return;
    setDeletingId(imageId);
    try {
      await deleteRoomImage(imageId);
      const updated = await fetchRoomById(id);
      setRoom(updated);
    } catch {
      alert('Xóa ảnh thất bại.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <ManagerLayout><div style={{ padding: 48, textAlign: 'center' }}><p>Đang tải...</p></div></ManagerLayout>;
  if (error || !room) return <ManagerLayout><div className="alert alert-error" style={{ margin: 24 }}>{error || 'Không tìm thấy phòng.'}</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to={`/manager/rooms/${room.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{room.roomNumber}</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Gallery</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Gallery: {room.roomNumber}</h1>
        <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Đang upload...' : '+ Upload ảnh'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
      {uploadError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{uploadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {(room.images ?? []).map(img => (
          <div key={img.id} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', border: '1px solid var(--hairline)' }}>
            <img src={img.imageUrl} alt="room" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <button
              onClick={() => handleDelete(img.id)}
              disabled={deletingId === img.id}
              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {deletingId === img.id ? '…' : '×'}
            </button>
            {img.isPrimary && (
              <div style={{ position: 'absolute', bottom: 6, left: 6 }}><span className="badge badge-success" style={{ fontSize: 10 }}>Primary</span></div>
            )}
          </div>
        ))}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed var(--hairline)', borderRadius: 10, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-bone)', color: 'var(--ash)' }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>+</div>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Thêm ảnh</p>
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── SCR-44: Room Status ───────────────────────────────────────────────────────
export function RoomStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { room, loading, error } = useRoom(id);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { if (room) setStatus(room.status); }, [room]);

  const STATUSES = ['AVAILABLE', 'MAINTENANCE'];

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateRoomStatus(id, status);
      navigate(`/manager/rooms/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cập nhật thất bại.';
      setSaveError(msg);
      setSaving(false);
    }
  }

  if (loading) return <ManagerLayout><div style={{ padding: 48, textAlign: 'center' }}><p>Đang tải...</p></div></ManagerLayout>;
  if (error || !room) return <ManagerLayout><div className="alert alert-error" style={{ margin: 24 }}>{error || 'Không tìm thấy phòng.'}</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to={`/manager/rooms/${room.id}`} className="text-primary" style={{ textDecoration: 'none' }}>{room.roomNumber}</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Trạng thái</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Cập nhật trạng thái: {room.roomNumber}</h1>

      <div style={{ maxWidth: 480 }}>
        <div className="card-lg" style={{ padding: 28 }}>
          <p className="heading-sm" style={{ marginBottom: 20 }}>Chọn trạng thái</p>
          {saveError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{saveError}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {STATUSES.map(s => {
              const m: Record<string, { color: string; desc: string }> = {
                AVAILABLE:   { color: 'var(--success)', desc: 'Phòng sẵn sàng nhận đặt chỗ mới' },
                MAINTENANCE: { color: 'var(--charcoal)', desc: 'Đang bảo trì, không thể đặt phòng' },
              };
              const meta = m[s] ?? { color: 'var(--charcoal)', desc: s };
              return (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: `1.5px solid ${status === s ? meta.color : 'var(--hairline)'}`, borderRadius: 10, cursor: 'pointer', background: status === s ? `${meta.color}12` : 'var(--surface-card)', transition: 'all 0.15s' }}>
                  <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} style={{ accentColor: meta.color }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{s.replace(/_/g,' ')}</p>
                    <p className="body-sm text-charcoal">{meta.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving || status === room.status}>{saving ? 'Đang lưu...' : 'Cập nhật'}</button>
            <Link to={`/manager/rooms/${room.id}`} className="btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
