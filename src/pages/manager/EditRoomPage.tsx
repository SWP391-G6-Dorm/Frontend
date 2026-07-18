import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import {
  fetchManagerRoomV1,
  updateRoomV1,
  ROOM_TYPES,
  type RoomDetail,
} from '../../api/roomsApi';
import { floorApi, type FloorSummary } from '../../api/floorApi';

const AMENITY_OPTIONS = [
  'WiFi',
  'Điều hòa',
  'Hồ bơi riêng',
  'Bếp',
  'Bếp nhỏ',
  'View biển',
  'Bãi đỗ xe',
  'Minibar',
  'Ban công',
  'Smart TV',
  'TV',
  'Room service',
  'Tủ lạnh',
  'Bàn làm việc',
  'Máy giặt',
  'Nước nóng',
  'Tủ quần áo',
] as const;

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-600 mt-1 font-medium">{msg}</p>;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 1200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        padding: '14px 20px',
        background: '#202020',
        color: '#fcfcfc',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(32,32,32,0.18)',
        borderLeft: '4px solid #2b9a66',
      }}
    >
      {message}
    </div>
  );
}

export default function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    floorId: '',
    roomNumber: '',
    roomType: 'Standard',
    pricePerNight: '',
    capacity: '',
    area: '',
    description: '',
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [floorsLoading, setFloorsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomNumberError, setRoomNumberError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchManagerRoomV1(id)
      .then((data) => {
        setRoom(data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const msg = axiosErr?.response?.data?.message ?? 'Không tải được thông tin phòng.';
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!room || initialized.current) return;
    initialized.current = true;
    setForm({
      floorId: room.floorId,
      roomNumber: room.roomNumber,
      roomType: room.roomType ?? 'Standard',
      pricePerNight: String(room.pricePerNight),
      capacity: String(room.capacity),
      area: room.area ? String(room.area) : '',
      description: room.description ?? '',
    });
    setAmenities(room.amenities ?? []);

    if (room.propertyId) {
      setFloorsLoading(true);
      floorApi.getByProperty(room.propertyId)
        .then((res) => setFloors(res.data ?? []))
        .catch(() => setFloors([]))
        .finally(() => setFloorsLoading(false));
    }
  }, [room]);

  function handleField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'roomNumber') setRoomNumberError('');
    setError(null);
  }

  function toggleAmenity(name: string) {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setRoomNumberError('');

    if (!form.floorId) {
      setError('Vui lòng chọn tầng.');
      return;
    }
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) {
      setError('Giá/đêm phải lớn hơn 0.');
      return;
    }
    if (!form.capacity || Number(form.capacity) < 1) {
      setError('Sức chứa tối thiểu 1 người.');
      return;
    }

    setSaving(true);
    try {
      await updateRoomV1(id, {
        floorId: form.floorId,
        roomNumber: form.roomNumber.trim(),
        roomType: form.roomType,
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        area: form.area ? Number(form.area) : null,
        description: form.description.trim() || null,
        amenities,
      });
      setToast('Đã cập nhật phòng');
      setTimeout(() => navigate('/manager/rooms'), 1200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr?.response?.status;
      const message = axiosErr?.response?.data?.message ?? 'Cập nhật thất bại. Vui lòng thử lại.';

      if (status === 409) {
        setRoomNumberError(message);
      } else {
        setError(message);
      }
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ManagerLayout>
        <div className="max-w-3xl space-y-4 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#F1F5F9] rounded animate-pulse" />
          ))}
        </div>
      </ManagerLayout>
    );
  }

  if (loadError || !room) {
    return (
      <ManagerLayout>
        <div className="max-w-3xl p-4">
          <Alert variant="error" message={loadError ?? 'Không tìm thấy phòng.'} />
          <Link to="/manager/rooms" className="btn-ghost mt-4 inline-block">
            ← Quay lại danh sách
          </Link>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-2 text-sm text-[#64748B] mb-5">
        <Link to="/manager/rooms" className="text-primary no-underline hover:underline">
          Danh sách phòng
        </Link>
        <span>›</span>
        <span className="font-semibold text-[#0F172A]">Sửa phòng</span>
      </div>

      <h1 className="heading-md mb-7">Sửa phòng {room.roomNumber}</h1>

      <div className="card p-8 max-w-3xl">
        {error && (
          <div className="mb-5">
            <Alert variant="error" message={error} closeable onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label form-label-required" htmlFor="roomNumber">
                Số phòng
              </label>
              <input
                id="roomNumber"
                className="input"
                value={form.roomNumber}
                onChange={(e) => handleField('roomNumber', e.target.value)}
                required
                style={{ borderColor: roomNumberError ? '#DC2626' : undefined }}
              />
              {roomNumberError && <FieldError msg={roomNumberError} />}
            </div>

            <div>
              <label className="form-label form-label-required">Tầng</label>
              {floorsLoading ? (
                <div className="h-11 bg-[#F8FAFC] rounded-lg flex items-center px-4 text-sm text-[#64748B]">
                  Đang tải tầng…
                </div>
              ) : (
                <select
                  className="select"
                  value={form.floorId}
                  onChange={(e) => handleField('floorId', e.target.value)}
                  required
                >
                  <option value="">— Chọn tầng —</option>
                  {floors.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      Tầng {fl.floorNumber}
                      {fl.description ? ` — ${fl.description}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="roomType">Loại phòng</label>
              <select
                id="roomType"
                className="select"
                value={form.roomType}
                onChange={(e) => handleField('roomType', e.target.value)}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label form-label-required" htmlFor="pricePerNight">
                Giá/đêm (₫)
              </label>
              <input
                id="pricePerNight"
                type="number"
                className="input"
                min={1000}
                step={1000}
                value={form.pricePerNight}
                onChange={(e) => handleField('pricePerNight', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label form-label-required" htmlFor="capacity">
                Sức chứa (người)
              </label>
              <input
                id="capacity"
                type="number"
                className="input"
                min={1}
                max={20}
                value={form.capacity}
                onChange={(e) => handleField('capacity', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="area">Diện tích (m²)</label>
              <input
                id="area"
                type="number"
                className="input"
                min={0}
                step={0.5}
                value={form.area}
                onChange={(e) => handleField('area', e.target.value)}
              />
              <p className="text-xs text-[#94A3B8] mt-1">Tùy chọn</p>
            </div>
          </div>

          <div>
            <label className="form-label mb-3 block">Tiện nghi</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AMENITY_OPTIONS.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={amenities.includes(name)}
                    onChange={() => toggleAmenity(name)}
                    className="rounded border-[#CBD5E1]"
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              className="textarea"
              rows={4}
              maxLength={2000}
              placeholder="Mô tả phòng, tiện nghi nổi bật…"
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <p className="text-xs text-[#94A3B8] text-right mt-1">
              {form.description.length} / 2000
            </p>
          </div>

          <div className="flex gap-3 items-center pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            <Link to="/manager/rooms" className="btn-ghost">Hủy</Link>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}
