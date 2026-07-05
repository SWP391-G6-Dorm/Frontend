import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { fetchRoomById, updateRoom, type RoomDetail } from '../../api/roomsApi';
import { floorApi, type FloorSummary } from '../../api/floorApi';

const ROOM_TYPES = ['Studio', 'Standard', 'Deluxe', 'Suite', 'Villa'];

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
  return { room, loading, error };
}

export default function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { room, loading: roomLoading, error: roomError } = useRoom(id);
  const [form, setForm] = useState({
    roomNumber: '',
    roomType: 'Standard',
    pricePerNight: '',
    capacity: '',
    area: '',
    description: '',
  });
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (room && !initialized.current) {
      initialized.current = true;
      setForm({
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        pricePerNight: String(room.pricePerNight),
        capacity: String(room.capacity),
        area: room.area ? String(room.area) : '',
        description: room.description ?? '',
      });
      if (room.propertyId) {
        floorApi.getByProperty(room.propertyId).then((res) => setFloors(res.data)).catch(() => {});
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
        roomNumber: form.roomNumber,
        roomType: form.roomType,
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        area: form.area ? Number(form.area) : undefined,
        description: form.description || undefined,
      });
      navigate(`/manager/rooms/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cập nhật thất bại.';
      setError(msg);
      setSaving(false);
    }
  }

  if (roomLoading) {
    return (
      <ManagerLayout>
        <div style={{ padding: 48, textAlign: 'center' }}><p>Đang tải...</p></div>
      </ManagerLayout>
    );
  }
  if (roomError || !room) {
    return (
      <ManagerLayout>
        <div className="alert alert-error" style={{ margin: 24 }}>{roomError || 'Không tìm thấy phòng.'}</div>
      </ManagerLayout>
    );
  }

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
            <div>
              <label className="form-label form-label-required">Số phòng</label>
              <input className="input" value={form.roomNumber} onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Loại phòng</label>
              <select className="select" value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))}>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Giá / đêm (₫)</label>
              <input type="number" className="input" value={form.pricePerNight} onChange={(e) => setForm((p) => ({ ...p, pricePerNight: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Sức chứa</label>
              <input type="number" min={1} className="input" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Diện tích (m²)</label>
              <input type="number" className="input" value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Floor hiện tại</label>
              <input
                className="input"
                readOnly
                value={floors.find((f) => f.id === room.floorId)?.description ?? `Floor ${room.floorNumber}`}
                style={{ background: 'var(--surface-bone)' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Mô tả</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            <Link to={`/manager/rooms/${id}`} className="btn-ghost">Hủy</Link>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}
