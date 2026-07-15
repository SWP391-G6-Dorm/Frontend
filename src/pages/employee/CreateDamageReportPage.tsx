import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import {
  createDamageReport,
  getEligibleDamageRooms,
  uploadDamagePhotos,
  type DamageItem,
  type EligibleDamageRoom,
} from '../../api/employeeApi';
import { TOUCH, fmtVnd, fmtDate, extractErr, Spinner, ErrBanner } from './EmployeeShared';

interface DamageItemRow extends DamageItem {
  _key: string;
}

interface LocationState {
  roomId?: string;
  fromInspection?: boolean;
}

// ── SCR-64: Create Damage Report ───────────────────────────────────────────────

export default function CreateDamageReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefRoomId = (location.state as LocationState | null)?.roomId;

  const [eligible, setEligible] = useState<EligibleDamageRoom[]>([]);
  const [inspectionId, setInspectionId] = useState('');
  const [items, setItems] = useState<DamageItemRow[]>([
    { _key: crypto.randomUUID(), name: '', estimatedCost: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadEligible() {
      setLoadingRooms(true);
      setRoomsError(null);
      try {
        const res = await getEligibleDamageRooms();
        if (cancelled) return;
        if (!res.success) {
          setEligible([]);
          setRoomsError('Không tải được danh sách phòng cần báo cáo.');
          return;
        }
        const list = res.data ?? [];
        setEligible(list);
        if (list.length === 0) return;

        const preferred =
          (prefRoomId && list.find((r) => r.roomId === prefRoomId)) || list[0];
        setInspectionId(preferred.inspectionId);
      } catch (err) {
        if (!cancelled) {
          setEligible([]);
          setRoomsError(extractErr(err, 'Không tải được danh sách phòng cần báo cáo.'));
        }
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    }
    loadEligible();
    return () => {
      cancelled = true;
    };
  }, [prefRoomId]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only revoke on unmount
  }, []);

  const selected = eligible.find((r) => r.inspectionId === inspectionId);
  const roomId = selected?.roomId ?? '';
  const totalCost = items.reduce((sum, i) => sum + (Number(i.estimatedCost) || 0), 0);

  function addItem() {
    setItems((prev) => [...prev, { _key: crypto.randomUUID(), name: '', estimatedCost: 0 }]);
  }

  function removeItem(key: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateItem(key: string, field: 'name' | 'estimatedCost', value: string | number) {
    setItems((prev) => prev.map((i) => (i._key === key ? { ...i, [field]: value } : i)));
  }

  async function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const remaining = 5 - photoUrls.length;
    if (remaining <= 0) {
      setError('Tối đa 5 ảnh minh chứng.');
      return;
    }
    const toUpload = files.slice(0, remaining);

    setUploadingPhotos(true);
    setError(null);
    try {
      const urls = await uploadDamagePhotos(toUpload);
      const blobs = toUpload.map((f) => URL.createObjectURL(f));
      setPhotoUrls((prev) => [...prev, ...urls]);
      setPhotoPreviews((prev) => [...prev, ...blobs]);
    } catch (err) {
      setError(extractErr(err, 'Tải ảnh thất bại.'));
    } finally {
      setUploadingPhotos(false);
    }
  }

  function removePhoto(idx: number) {
    setPhotoPreviews((prev) => {
      const url = prev[idx];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!inspectionId || !roomId) errs.roomId = 'Vui lòng chọn phòng / kiểm tra Failed';
    if (items.some((i) => !i.name.trim())) errs.items = 'Tất cả tên hư hại không được để trống';
    if (items.some((i) => Number(i.estimatedCost) <= 0)) errs.costs = 'Phí ước tính phải lớn hơn 0';
    if (photoUrls.length === 0) errs.photos = 'Cần ít nhất một ảnh minh chứng';
    return errs;
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setShowSummary(true);
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      setShowSummary(false);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await createDamageReport({
        roomId,
        inspectionId,
        items: items.map((i) => ({ name: i.name.trim(), estimatedCost: Number(i.estimatedCost) })),
        attachments: photoUrls.map((url) => ({ url, type: 'IMAGE' })),
        notes: notes.trim() || undefined,
      });
      if (res.success) navigate('/employee/damage');
      else {
        setError('Tạo báo cáo thất bại.');
        setShowSummary(false);
      }
    } catch (err) {
      setError(extractErr(err, 'Tạo báo cáo thất bại.'));
      setShowSummary(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 560, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 20 }}>
          <Link to="/employee/damage" className="body-sm text-primary" style={{ textDecoration: 'none' }}>
            ← Báo cáo của tôi
          </Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginTop: 8, marginBottom: 2 }}>
            Tạo báo cáo hư hại
          </h1>
          <p className="body-sm text-charcoal">Ghi nhận hư hại sau kiểm tra phòng thất bại</p>
        </div>

        {error && <ErrBanner msg={error} />}
        {roomsError && (
          <div style={{ marginBottom: 12 }}>
            <ErrBanner msg={roomsError} />
            <button
              type="button"
              className="btn-outline"
              style={{ ...TOUCH, marginTop: 4, borderRadius: 10, fontSize: 13 }}
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        )}

        {showSummary && (
          <div className="card" style={{ padding: 20, marginBottom: 16, border: '2px solid var(--primary)' }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--ink)' }}>
              Xác nhận nộp báo cáo
            </p>
            <div style={{ marginBottom: 12 }}>
              {[
                { label: 'Phòng', value: selected?.roomNumber || roomId },
                { label: 'Số mục hư hại', value: `${items.length} mục` },
                { label: 'Tổng phí ước tính', value: fmtVnd(totalCost) },
                { label: 'Ảnh đính kèm', value: `${photoUrls.length} ảnh` },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--hairline)',
                  }}
                >
                  <span className="body-sm text-charcoal">{r.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.value}</span>
                </div>
              ))}
            </div>
            {totalCost > 5_000_000 && (
              <div className="alert alert-error" style={{ marginBottom: 12, fontSize: 13 }}>
                Tổng phí &gt; {fmtVnd(5_000_000)} — báo cáo sẽ được escalate lên Admin sau khi nộp.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, ...TOUCH, borderRadius: 12, fontWeight: 700 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Đang nộp...' : 'Xác nhận nộp'}
              </button>
              <button
                className="btn-ghost"
                style={{ ...TOUCH, borderRadius: 12 }}
                onClick={() => setShowSummary(false)}
                disabled={submitting}
              >
                Sửa lại
              </button>
            </div>
          </div>
        )}

        {!showSummary && (
          <form onSubmit={handlePreview}>
            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <label className="form-label form-label-required" htmlFor="damage-room">
                Phòng / kiểm tra Failed
              </label>
              {loadingRooms ? (
                <Spinner />
              ) : eligible.length === 0 ? (
                <div style={{ padding: '12px 0' }}>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>
                    Không có phòng nào cần báo cáo. Hãy FAIL một kiểm tra phòng trước (SCR-62).
                  </p>
                  <Link to="/employee/inspections" className="btn-outline" style={{ ...TOUCH, borderRadius: 10, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '0 14px' }}>
                    Đi kiểm tra phòng
                  </Link>
                </div>
              ) : (
                <select
                  id="damage-room"
                  className="input"
                  style={{ ...TOUCH }}
                  value={inspectionId}
                  onChange={(e) => setInspectionId(e.target.value)}
                >
                  {eligible.map((r) => (
                    <option key={r.inspectionId} value={r.inspectionId}>
                      {r.roomNumber || 'Phòng'}
                      {r.inspectedAt ? ` — ${fmtDate(r.inspectedAt)}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {formErrors.roomId && <p className="form-error">{formErrors.roomId}</p>}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Danh sách hư hại</p>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{fmtVnd(totalCost)}</p>
              </div>
              {(formErrors.items || formErrors.costs) && (
                <ErrBanner msg={formErrors.items || formErrors.costs || ''} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item, idx) => (
                  <div key={item._key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      {idx === 0 && (
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Tên hư hại
                        </label>
                      )}
                      <input
                        className="input"
                        style={{ ...TOUCH }}
                        placeholder="VD: TV bị vỡ"
                        value={item.name}
                        onChange={(e) => updateItem(item._key, 'name', e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {idx === 0 && (
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Phí ước tính (VNĐ)
                        </label>
                      )}
                      <input
                        className="input"
                        type="number"
                        min={1}
                        style={{ ...TOUCH }}
                        placeholder="0"
                        value={item.estimatedCost || ''}
                        onChange={(e) => updateItem(item._key, 'estimatedCost', Number(e.target.value))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item._key)}
                      style={{
                        ...TOUCH,
                        width: 44,
                        background: 'none',
                        border: '1px solid var(--hairline)',
                        borderRadius: 8,
                        cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                        color: 'var(--error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        alignSelf: idx === 0 ? 'flex-end' : 'auto',
                      }}
                      disabled={items.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="btn-ghost"
                style={{
                  marginTop: 12,
                  width: '100%',
                  ...TOUCH,
                  borderRadius: 10,
                  borderStyle: 'dashed',
                  borderWidth: 1.5,
                  fontSize: 14,
                }}
              >
                + Thêm mục hư hại
              </button>
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>
                Ảnh hư hại <span style={{ color: 'var(--danger, #c0392b)' }}>*</span>
              </p>
              {formErrors.photos && <ErrBanner msg={formErrors.photos} />}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                capture="environment"
                onChange={handlePhotoAdd}
                style={{ display: 'none' }}
                id="damage-photo-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhotos || photoUrls.length >= 5}
                style={{
                  width: '100%',
                  ...TOUCH,
                  borderRadius: 10,
                  background: 'var(--surface-bone)',
                  border: '1.5px dashed var(--hairline)',
                  cursor: uploadingPhotos ? 'wait' : 'pointer',
                  fontSize: 14,
                  color: 'var(--charcoal)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {uploadingPhotos ? 'Đang tải ảnh...' : 'Chụp / Chọn ảnh (tối đa 5)'}
              </button>
              {photoPreviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                  {photoPreviews.map((src, idx) => (
                    <div key={`${photoUrls[idx]}-${idx}`} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt={`Ảnh ${idx + 1}`}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid var(--hairline)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--error)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
              <label className="form-label" htmlFor="damage-notes">
                Ghi chú
              </label>
              <textarea
                id="damage-notes"
                className="textarea"
                rows={3}
                maxLength={2000}
                placeholder="Mô tả thêm về tình trạng hư hại..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {totalCost > 0 && (
              <div
                style={{
                  background: totalCost > 5_000_000 ? 'rgba(220,38,38,0.08)' : 'rgba(15,118,110,0.08)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>Tổng ước tính:</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    color: totalCost > 5_000_000 ? '#dc2626' : 'var(--primary)',
                  }}
                >
                  {fmtVnd(totalCost)}
                </span>
              </div>
            )}
            {totalCost > 5_000_000 && (
              <div className="alert alert-error" style={{ marginBottom: 14, fontSize: 13 }}>
                Tổng phí &gt; {fmtVnd(5_000_000)} — sẽ được escalate lên Admin để co-approve.
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loadingRooms || eligible.length === 0 || uploadingPhotos}
              style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 16, marginBottom: 24 }}
            >
              Xem trước & Xác nhận →
            </button>
          </form>
        )}
      </div>
    </EmployeeLayout>
  );
}
