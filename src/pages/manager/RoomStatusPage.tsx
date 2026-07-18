import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerRoomV1,
  updateRoomStatusV1,
  type UpdateRoomStatusPayload,
  type RoomDetail,
} from '../../api/roomsApi';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  AVAILABLE:            { label: 'Trống',           variant: 'success' },
  PENDING_DEPOSIT:      { label: 'Chờ cọc',         variant: 'warning' },
  RESERVED:             { label: 'Đã đặt',          variant: 'info' },
  OCCUPIED:             { label: 'Đang ở',          variant: 'primary' },
  PENDING_CLEANING:     { label: 'Chờ dọn',         variant: 'warning' },
  CLEANING_IN_PROGRESS: { label: 'Đang dọn',        variant: 'info' },
  MAINTENANCE:          { label: 'Bảo trì',         variant: 'danger' },
  OUT_OF_SERVICE:       { label: 'Ngưng phục vụ',   variant: 'neutral' },
};

const MANUAL_STATUSES = ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'] as const;
type ManualStatus = (typeof MANUAL_STATUSES)[number];

const AUTO_STATUSES = Object.keys(STATUS_VI).filter(
  s => !MANUAL_STATUSES.includes(s as ManualStatus),
);

function needsDatesAndReason(status: ManualStatus): boolean {
  return status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE';
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

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-600 mt-1 font-medium">{msg}</p>;
}

export default function RoomStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<ManualStatus>('AVAILABLE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const loadRoom = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetchManagerRoomV1(id);
      setRoom(r);
      if (MANUAL_STATUSES.includes(r.status as ManualStatus)) {
        setSelectedStatus(r.status as ManualStatus);
      } else {
        setSelectedStatus('AVAILABLE');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể tải thông tin phòng.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  const showDates = needsDatesAndReason(selectedStatus);
  const isDirty = room ? selectedStatus !== room.status : false;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (showDates) {
      if (!startDate) errs.startDate = 'Vui lòng chọn từ ngày';
      if (!endDate) errs.endDate = 'Vui lòng chọn đến ngày';
      if (startDate && endDate && endDate < startDate) {
        errs.endDate = 'Đến ngày phải sau hoặc bằng từ ngày';
      }
      if (!reason.trim()) errs.reason = 'Vui lòng nhập lý do';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isDirty || !id) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: UpdateRoomStatusPayload = {
        status: selectedStatus,
        ...(showDates
          ? { startDate, endDate, reason: reason.trim() }
          : {}),
      };
      await updateRoomStatusV1(id, payload);
      setToast('Cập nhật trạng thái thành công');
      setTimeout(() => navigate('/manager/rooms'), 1200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể cập nhật trạng thái. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <ManagerLayout>
        <div className="card p-10 text-center max-w-md mx-auto">
          <h2 className="heading-sm mb-2">Không tải được phòng</h2>
          <p className="body-md text-charcoal mb-6">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={loadRoom}>Thử lại</button>
            <Link to="/manager/rooms" className="btn-ghost">Quay lại danh sách</Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  const currentMeta = room ? STATUS_VI[room.status] : null;

  return (
    <ManagerLayout>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      <div className="flex items-center gap-2 body-sm mb-5 text-charcoal">
        <Link to="/manager/rooms" className="text-primary no-underline">Phòng</Link>
        <span className="text-stone">›</span>
        <Link to={`/manager/rooms/${id}`} className="text-primary no-underline">
          {room?.roomNumber ?? id}
        </Link>
        <span className="text-stone">›</span>
        <span className="font-semibold text-ink">Trạng thái</span>
      </div>

      <div className="card p-6 max-w-xl">
        <h1 className="heading-md mb-6">
          Trạng thái — {loading ? '…' : room?.roomNumber}
        </h1>

        {error && (
          <div className="mb-4">
            <Alert variant="error" message={error} closeable onClose={() => setError('')} />
          </div>
        )}

        {loading ? (
          <p className="body-md text-stone">Đang tải…</p>
        ) : room && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="rounded-lg border border-hairline bg-surface-bone p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold text-lg text-ink">{room.roomNumber}</p>
                <p className="body-sm text-charcoal mt-0.5">
                  {room.propertyName} · Tầng {room.floorNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-stone uppercase mb-1">Hiện tại</p>
                {currentMeta ? (
                  <StatusBadge status={currentMeta.label} variant={currentMeta.variant} />
                ) : (
                  <StatusBadge status={room.status} variant="neutral" />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="room-status" className="form-label">
                Trạng thái mới <span className="text-red-600">*</span>
              </label>
              <select
                id="room-status"
                className="select w-full"
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value as ManualStatus);
                  setFieldErrors({});
                  setError('');
                }}
              >
                {MANUAL_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {STATUS_VI[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <p className="body-sm text-stone mt-1">
                Manager chỉ có thể đặt Trống, Bảo trì hoặc Ngưng phục vụ.
              </p>
            </div>

            {showDates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="form-label">
                    Từ ngày <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="input w-full"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setFieldErrors(prev => ({ ...prev, startDate: '' }));
                    }}
                  />
                  {fieldErrors.startDate && <FieldError msg={fieldErrors.startDate} />}
                </div>
                <div>
                  <label htmlFor="end-date" className="form-label">
                    Đến ngày <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="input w-full"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setFieldErrors(prev => ({ ...prev, endDate: '' }));
                    }}
                  />
                  {fieldErrors.endDate && <FieldError msg={fieldErrors.endDate} />}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="reason" className="form-label">
                Lý do
                {showDates && <span className="text-red-600"> *</span>}
              </label>
              <textarea
                id="reason"
                className="textarea w-full"
                rows={3}
                maxLength={1000}
                placeholder={
                  showDates
                    ? 'VD: Sửa điều hòa, thay ống nước…'
                    : 'Tùy chọn — ghi chú khi đổi trạng thái'
                }
                value={reason}
                onChange={e => {
                  setReason(e.target.value);
                  setFieldErrors(prev => ({ ...prev, reason: '' }));
                }}
              />
              {fieldErrors.reason && <FieldError msg={fieldErrors.reason} />}
              <p className="body-sm text-stone mt-1 text-right">{reason.length} / 1000</p>
            </div>

            {AUTO_STATUSES.includes(room.status) && (
              <Alert
                variant="warning"
                message={`Phòng đang ở trạng thái hệ thống "${STATUS_VI[room.status]?.label ?? room.status}". Bạn có thể chuyển sang Trống, Bảo trì hoặc Ngưng phục vụ.`}
              />
            )}

            <div className="flex gap-3 items-center flex-wrap pt-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={!isDirty || saving}
              >
                {saving ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
              </button>
              <Link to="/manager/rooms" className="btn-ghost">Hủy</Link>
              {!isDirty && !saving && (
                <span className="body-sm text-stone">Chưa có thay đổi</span>
              )}
            </div>
          </form>
        )}
      </div>
    </ManagerLayout>
  );
}
