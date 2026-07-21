import { useState, useEffect, type CSSProperties, type FocusEvent, type ReactNode, type ChangeEvent } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { promotionApi, type PromotionItem, type PromotionPayload } from '../../api/managerApi';

// ── Màu sắc hỗ trợ ────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: 'red',    label: 'Teal (Mặc định)', gradient: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)' },
  { value: 'blue',   label: 'Xanh dương', gradient: 'linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)' },
  { value: 'green',  label: 'Xanh lá', gradient: 'linear-gradient(135deg, #1a5c3a 0%, #2e9c5e 100%)' },
  { value: 'purple', label: 'Tím',    gradient: 'linear-gradient(135deg, #4c1d8f 0%, #7c3aed 100%)' },
  { value: 'orange', label: 'Cam',    gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' },
];

function getGradient(theme: string) {
  return COLOR_OPTIONS.find((c) => c.value === theme)?.gradient ?? COLOR_OPTIONS[0].gradient;
}

// ── Empty form ────────────────────────────────────────────────────────────

const EMPTY: PromotionPayload = {
  subtitle: '',
  title: '',
  description: '',
  ctaText: 'Đặt ngay →',
  ctaUrl: '/search',
  imageUrl: '',
  colorTheme: 'red',
  isActive: true,
  sortOrder: 0,
};

/** Clear, high-contrast fields for the banner create/edit modal */
const fieldLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: '#334155',
  textTransform: 'uppercase',
};

const fieldInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.5,
  color: '#0F172A',
  background: '#FFFFFF',
  border: '1.5px solid #CBD5E1',
  borderRadius: 8,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const fieldFocus = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = '#0F766E';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.15)';
};

const fieldBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = '#CBD5E1';
  e.currentTarget.style.boxShadow = 'none';
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 800,
  color: '#0F172A',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const sectionBoxStyle: CSSProperties = {
  padding: '16px 16px 4px',
  marginBottom: 14,
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabelStyle}>
        {label}
        {hint ? <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#64748B', marginLeft: 6 }}>{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

// ── Preview Card ─────────────────────────────────────────────────────────

function BannerPreview({ form }: { form: PromotionPayload }) {
  const hasImage = !!form.imageUrl?.trim();
  return (
    <div
      style={{
        borderRadius: 12,
        background: getGradient(form.colorTheme),
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 220,
        aspectRatio: '16 / 9',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {hasImage && (
        <>
          <img
            src={form.imageUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.35) 55%, rgba(15,23,42,0.2) 100%)' }} />
        </>
      )}
      <span style={{ position: 'relative', zIndex: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
        {form.subtitle || 'Subtitle'}
      </span>
      <h3 style={{ position: 'relative', zIndex: 2, fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: 0, whiteSpace: 'pre-line', textShadow: '0 1px 3px rgba(0,0,0,0.4)', fontFamily: 'Outfit, sans-serif' }}>
        {form.title || 'Tiêu đề banner'}
      </h3>
      {(form.description || !form.title) && (
        <p style={{ position: 'relative', zIndex: 2, fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.45, maxWidth: '92%', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          {form.description || 'Mô tả ngắn sẽ hiện tại đây'}
        </p>
      )}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 'auto',
          display: 'inline-block',
          background: '#fff',
          color: '#0F172A',
          fontWeight: 800,
          fontSize: 12,
          padding: '8px 16px',
          borderRadius: 8,
          width: 'fit-content',
          letterSpacing: '0.01em',
        }}
      >
        {form.ctaText || 'CTA'}
      </span>
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────

function BannerFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: PromotionPayload;
  onSave: (p: PromotionPayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<PromotionPayload>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const isEdit = !!initial.subtitle;
  const canSave = !!form.subtitle && !!form.title && !!form.ctaText && !!form.ctaUrl;
  const set = (k: keyof PromotionPayload, v: string | number | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ chọn file ảnh (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Ảnh tối đa 50MB.');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const imageUrl = await promotionApi.uploadImage(file);
      set('imageUrl', imageUrl);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosErr.response?.status;
      const serverMsg = axiosErr.response?.data?.message;
      if (status === 401 || status === 403) {
        setUploadError('Không đủ quyền. Đăng nhập lại bằng tài khoản Admin.');
      } else if (status === 404) {
        setUploadError('API upload chưa có trên server. Hãy restart backend rồi thử lại.');
      } else if (serverMsg) {
        setUploadError(serverMsg);
      } else {
        setUploadError(axiosErr.message || 'Upload thất bại. Thử lại.');
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-modal-title"
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(15,23,42,0.28)',
          border: '1px solid rgba(226,232,240,0.9)',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#0F766E', textTransform: 'uppercase' }}>
              Marketing · Banner
            </p>
            <h2 id="banner-modal-title" style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {isEdit ? 'Chỉnh sửa banner' : 'Tạo banner mới'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              Nội dung hiển thị trên slideshow trang chủ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label="Đóng"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              fontSize: 20, lineHeight: 1, cursor: uploading ? 'not-allowed' : 'pointer',
              color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
          overflow: 'hidden',
        }}>
          {/* Left: Form */}
          <div style={{ padding: '20px 24px 28px', borderRight: '1px solid #E2E8F0', overflowY: 'auto' }}>
            <div style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F766E' }} />
                Nội dung
              </h3>
              <Field label="Subtitle *" hint="dòng nhỏ phía trên">
                <input
                  style={fieldInputStyle}
                  value={form.subtitle}
                  onChange={(e) => set('subtitle', e.target.value)}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                  placeholder="VD: Ưu đãi cuối tuần"
                />
              </Field>
              <Field label="Tiêu đề lớn *" hint="xuống dòng bằng \\n">
                <textarea
                  style={{ ...fieldInputStyle, minHeight: 80, resize: 'vertical' }}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                  placeholder={'VD: Giảm 20%\nthứ 6 – chủ nhật'}
                  rows={3}
                />
              </Field>
              <Field label="Mô tả ngắn">
                <textarea
                  style={{ ...fieldInputStyle, minHeight: 72, resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                  placeholder="Áp dụng cho tất cả phòng Deluxe & Suite..."
                  rows={2}
                />
              </Field>
            </div>

            <div style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F766E' }} />
                Nút hành động (CTA)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Text nút *">
                  <input
                    style={fieldInputStyle}
                    value={form.ctaText}
                    onChange={(e) => set('ctaText', e.target.value)}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                    placeholder="Đặt ngay →"
                  />
                </Field>
                <Field label="URL *">
                  <input
                    style={fieldInputStyle}
                    value={form.ctaUrl}
                    onChange={(e) => set('ctaUrl', e.target.value)}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                    placeholder="/search"
                  />
                </Field>
              </div>
            </div>

            <div style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F766E' }} />
                Hình ảnh & giao diện
              </h3>
              <Field label="Ảnh nền" hint="slideshow trang chủ">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <label
                    style={{
                      height: 40,
                      padding: '0 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      cursor: uploading || saving ? 'not-allowed' : 'pointer',
                      opacity: uploading || saving ? 0.6 : 1,
                      margin: 0,
                      borderRadius: 8,
                      border: '1.5px solid #0F766E',
                      color: '#0F766E',
                      fontWeight: 700,
                      fontSize: 13,
                      background: 'rgba(15,118,110,0.06)',
                    }}
                  >
                    {uploading ? 'Đang upload…' : 'Chọn ảnh từ máy'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      disabled={uploading || saving}
                      onChange={handleFileChange}
                    />
                  </label>
                  {form.imageUrl?.trim() && (
                    <button
                      type="button"
                      style={{
                        height: 40, padding: '0 14px',
                        borderRadius: 8,
                        border: '1.5px solid #B91C1C',
                        color: '#B91C1C',
                        fontWeight: 700,
                        fontSize: 13,
                        background: 'rgba(185,28,28,0.08)',
                        cursor: 'pointer',
                      }}
                      disabled={uploading || saving}
                      onClick={() => set('imageUrl', '')}
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                <input
                  style={fieldInputStyle}
                  value={form.imageUrl ?? ''}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                  placeholder="Hoặc dán URL: https://... /uploads/..."
                  disabled={uploading}
                />
                {uploadError && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>{uploadError}</p>
                )}
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748B' }}>
                  JPEG / PNG / WebP / GIF · tối đa 50MB
                </p>
              </Field>

              <Field label="Chủ đề màu nền">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map((c) => {
                    const selected = form.colorTheme === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set('colorTheme', c.value)}
                        title={c.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          padding: 0,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: c.gradient,
                            border: selected ? '2.5px solid #0F766E' : '2px solid #E2E8F0',
                            boxShadow: selected ? '0 0 0 3px rgba(15,118,110,0.2)' : 'none',
                            display: 'block',
                          }}
                        />
                        <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500, color: selected ? '#0F766E' : '#64748B' }}>
                          {c.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div style={{ ...sectionBoxStyle, marginBottom: 0 }}>
              <h3 style={sectionTitleStyle}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F766E' }} />
                Hiển thị
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Thứ tự">
                  <input
                    type="number"
                    style={fieldInputStyle}
                    value={form.sortOrder}
                    min={0}
                    onChange={(e) => set('sortOrder', Number(e.target.value))}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  />
                </Field>
                <Field label="Trạng thái">
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '11px 14px',
                    border: form.isActive ? '1.5px solid #0F766E' : '1.5px solid #CBD5E1',
                    borderRadius: 8,
                    background: form.isActive ? 'rgba(15,118,110,0.06)' : '#fff',
                  }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#0F766E' }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: form.isActive ? '#0F766E' : '#475569' }}>
                      {form.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>
                  </label>
                </Field>
              </div>
            </div>
          </div>

          {/* Right: Live preview */}
          <div style={{
            padding: '20px 20px 28px',
            background: '#F1F5F9',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: '#334155', textTransform: 'uppercase' }}>
                Xem trước trực tiếp
              </p>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 9999,
                background: form.isActive ? 'rgba(15,118,110,0.12)' : 'rgba(100,116,139,0.15)',
                color: form.isActive ? '#0F766E' : '#475569',
              }}>
                {form.isActive ? 'Live' : 'Hidden'}
              </span>
            </div>
            <BannerPreview form={form} />
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
              Tỷ lệ gần đúng slide trang chủ. Thay đổi bên trái sẽ cập nhật ngay tại đây.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, padding: '14px 24px',
          borderTop: '1px solid #E2E8F0',
          background: '#FFFFFF',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
            {canSave ? 'Sẵn sàng lưu' : 'Điền đủ các trường bắt buộc (*)'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
              style={{
                height: 42, padding: '0 18px', borderRadius: 8,
                border: '1.5px solid #CBD5E1', background: '#fff',
                color: '#334155', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving || uploading || !canSave}
              onClick={() => onSave(form)}
              style={{
                height: 42, padding: '0 22px', borderRadius: 8,
                border: 'none',
                background: saving || uploading || !canSave ? '#94A3B8' : '#0F766E',
                color: '#fff', fontWeight: 800, fontSize: 14,
                cursor: saving || uploading || !canSave ? 'not-allowed' : 'pointer',
                boxShadow: saving || uploading || !canSave ? 'none' : '0 4px 12px rgba(15,118,110,0.3)',
              }}
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật banner' : 'Tạo banner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function PromotionMgmtPage() {
  const [banners, setBanners] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromotionItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await promotionApi.getAll();
      setBanners(data);
    } catch {
      setError('Không thể tải danh sách banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form: PromotionPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await promotionApi.update(editing.id, form);
      } else {
        await promotionApi.create(form);
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch {
      alert('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return;
    setDeletingId(id);
    try {
      await promotionApi.delete(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert('Xóa thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (b: PromotionItem) => { setEditing(b); setModalOpen(true); };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A' }}>Quản lý Banner</h1>
            <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 14, fontWeight: 500 }}>
              Tạo, chỉnh sửa hoặc ẩn/hiện các banner trên trang chủ
            </p>
          </div>
          <button className="btn-primary" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            + Thêm banner
          </button>
        </div>

        {/* State */}
        {loading && <p style={{ color: '#888' }}>Đang tải...</p>}
        {error && <p style={{ color: 'var(--error, #e53)' }}>{error}</p>}

        {/* Banner list */}
        {!loading && !error && (
          banners.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 24px',
              border: '2px dashed #ddd', borderRadius: 14,
              color: '#999',
            }}>
              <p style={{ fontSize: 15, marginBottom: 12 }}>Chưa có banner nào.</p>
              <button className="btn-primary" onClick={openNew}>+ Tạo banner đầu tiên</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {banners.map((b) => (
                <div
                  key={b.id}
                  style={{
                    borderRadius: 14,
                    border: b.isActive ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(15,23,42,0.08)',
                  }}
                >
                  {/* Preview — inactive: slight grayscale, keep readable */}
                  <div style={{
                    height: 160,
                    background: getGradient(b.colorTheme),
                    padding: '18px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    position: 'relative',
                    overflow: 'hidden',
                    filter: b.isActive ? undefined : 'grayscale(0.35) brightness(0.92)',
                  }}>
                    {b.imageUrl?.trim() && (
                      <>
                        <img
                          src={b.imageUrl}
                          alt=""
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.35), rgba(15,23,42,0.65))' }} />
                      </>
                    )}
                    <div style={{ position: 'absolute', top: -12, right: -12, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                    <span style={{ position: 'relative', zIndex: 2, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#fff', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>{b.subtitle}</span>
                    <h3 style={{ position: 'relative', zIndex: 2, margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.3, whiteSpace: 'pre-line', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{b.title}</h3>
                    {b.description && <p style={{ position: 'relative', zIndex: 2, margin: 0, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{b.description}</p>}
                    <span style={{ position: 'relative', zIndex: 2, display: 'inline-block', background: '#fff', fontWeight: 800, fontSize: 12, padding: '5px 14px', borderRadius: 9999, width: 'fit-content', color: '#0F172A' }}>
                      {b.ctaText}
                    </span>
                  </div>

                  {/* Meta */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 9999,
                        background: b.isActive ? 'rgba(15,118,110,0.14)' : 'rgba(100,116,139,0.16)',
                        color: b.isActive ? '#0F766E' : '#334155',
                      }}>
                        {b.isActive ? '● Đang hiển thị' : '○ Đã ẩn'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Thứ tự: {b.sortOrder}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        style={{
                          flex: 1, fontSize: 13, fontWeight: 700, padding: '8px 0',
                          background: 'rgba(15,118,110,0.08)',
                          border: '1.5px solid #0F766E',
                          borderRadius: 8, color: '#0F766E', cursor: 'pointer',
                        }}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        style={{
                          flex: 1, fontSize: 13, padding: '8px 0',
                          background: 'rgba(185,28,28,0.1)',
                          border: '1.5px solid #B91C1C',
                          borderRadius: 8, color: '#B91C1C', cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        {deletingId === b.id ? '...' : 'Xóa'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <BannerFormModal
          initial={editing ? {
            subtitle: editing.subtitle,
            title: editing.title,
            description: editing.description ?? '',
            ctaText: editing.ctaText,
            ctaUrl: editing.ctaUrl,
            imageUrl: editing.imageUrl ?? '',
            colorTheme: editing.colorTheme,
            isActive: editing.isActive,
            sortOrder: editing.sortOrder,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </AdminLayout>
  );
}
