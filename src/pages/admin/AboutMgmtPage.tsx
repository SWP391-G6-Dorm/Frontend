import {
  useState,
  useEffect,
  type CSSProperties,
  type FocusEvent,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  aboutApi,
  type AboutContentPayload,
  type AboutStatItem,
  type AboutValueItem,
} from '../../api/managerApi';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 800,
  color: '#0F172A',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const sectionBoxStyle: CSSProperties = {
  padding: '16px 16px 4px',
  marginBottom: 20,
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
};

function fieldFocus(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#0F766E';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.15)';
}

function fieldBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#CBD5E1';
  e.currentTarget.style.boxShadow = 'none';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={fieldInputStyle}
      onFocus={fieldFocus}
      onBlur={fieldBlur}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: rows * 24 }}
      onFocus={fieldFocus}
      onBlur={fieldBlur}
    />
  );
}

function ImageUploadField({
  label,
  value,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  value?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <Field label={label}>
      {value?.trim() ? (
        <div style={{ marginBottom: 10 }}>
          <img
            src={resolveMediaUrl(value)}
            alt=""
            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }}
          />
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label
          className="btn-outline btn-sm"
          style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? 'Đang tải…' : 'Chọn ảnh'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            disabled={uploading}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </label>
        {value?.trim() ? (
          <button type="button" className="btn-outline btn-sm" onClick={onClear}>
            Xóa ảnh
          </button>
        ) : null}
      </div>
    </Field>
  );
}

export default function AboutMgmtPage() {
  const [form, setForm] = useState<AboutContentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    aboutApi
      .get()
      .then((data) => setForm(data))
      .catch(() => setError('Không tải được nội dung About.'))
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof AboutContentPayload>(key: K, value: AboutContentPayload[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateStat(index: number, patch: Partial<AboutStatItem>) {
    setForm((prev) => {
      if (!prev) return prev;
      const stats = prev.stats.map((s, i) => (i === index ? { ...s, ...patch } : s));
      return { ...prev, stats };
    });
  }

  function updateValue(index: number, patch: Partial<AboutValueItem>) {
    setForm((prev) => {
      if (!prev) return prev;
      const values = prev.values.map((v, i) => (i === index ? { ...v, ...patch } : v));
      return { ...prev, values };
    });
  }

  async function handleImageUpload(
    field: 'heroImageUrl' | 'storyImage1Url' | 'storyImage2Url' | 'storyImage3Url',
    file: File,
  ) {
    setUploadingField(field);
    setError('');
    try {
      const imageUrl = await aboutApi.uploadImage(file);
      setField(field, imageUrl);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosErr.response?.status;
      const serverMsg = axiosErr.response?.data?.message;
      if (status === 401 || status === 403) {
        setError('Không đủ quyền. Đăng nhập lại bằng tài khoản Admin.');
      } else {
        setError(serverMsg || axiosErr.message || 'Upload ảnh thất bại.');
      }
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await aboutApi.update(form);
      setSuccess('Đã lưu nội dung trang About.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="heading-lg" style={{ marginBottom: 6 }}>Quản lý trang About</h1>
          <p className="body-md text-charcoal">
            Chỉnh sửa nội dung hiển thị công khai tại <code>/about</code>. Form liên hệ khách vẫn hoạt động như cũ.
          </p>
        </div>

        {loading && <div className="card p-6">Đang tải…</div>}
        {error && (
          <div className="alert alert-error mb-4" role="alert">{error}</div>
        )}
        {success && (
          <div className="alert alert-success mb-4" role="status">{success}</div>
        )}

        {!loading && form && (
          <form onSubmit={handleSave} className="card-lg" style={{ padding: 24 }}>
            <div style={sectionBoxStyle}>
              <h2 style={sectionTitleStyle}>Hero</h2>
              <Field label="Tên thương hiệu">
                <TextInput value={form.heroBrand} onChange={(v) => setField('heroBrand', v)} />
              </Field>
              <Field label="Tiêu đề chính">
                <TextInput value={form.heroTitle} onChange={(v) => setField('heroTitle', v)} />
              </Field>
              <Field label="Mô tả ngắn">
                <TextArea value={form.heroSubtitle} onChange={(v) => setField('heroSubtitle', v)} rows={3} />
              </Field>
              <ImageUploadField
                label="Ảnh hero"
                value={form.heroImageUrl}
                uploading={uploadingField === 'heroImageUrl'}
                onUpload={(file) => handleImageUpload('heroImageUrl', file)}
                onClear={() => setField('heroImageUrl', '')}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Nút chính — text">
                  <TextInput value={form.ctaPrimaryText} onChange={(v) => setField('ctaPrimaryText', v)} />
                </Field>
                <Field label="Nút chính — URL">
                  <TextInput value={form.ctaPrimaryUrl} onChange={(v) => setField('ctaPrimaryUrl', v)} />
                </Field>
              </div>
              <Field label="Nút phụ — text">
                <TextInput value={form.ctaSecondaryText ?? ''} onChange={(v) => setField('ctaSecondaryText', v)} />
              </Field>
            </div>

            <div style={sectionBoxStyle}>
              <h2 style={sectionTitleStyle}>Thống kê</h2>
              {form.stats.map((stat, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 8 }}>
                  <Field label={`Giá trị ${i + 1}`}>
                    <TextInput value={stat.value} onChange={(v) => updateStat(i, { value: v })} />
                  </Field>
                  <Field label={`Nhãn ${i + 1}`}>
                    <TextInput value={stat.label} onChange={(v) => updateStat(i, { label: v })} />
                  </Field>
                </div>
              ))}
            </div>

            <div style={sectionBoxStyle}>
              <h2 style={sectionTitleStyle}>Câu chuyện</h2>
              <Field label="Eyebrow">
                <TextInput value={form.storyEyebrow} onChange={(v) => setField('storyEyebrow', v)} />
              </Field>
              <Field label="Tiêu đề">
                <TextInput value={form.storyTitle} onChange={(v) => setField('storyTitle', v)} />
              </Field>
              <Field label="Đoạn 1">
                <TextArea value={form.storyBody1} onChange={(v) => setField('storyBody1', v)} />
              </Field>
              <Field label="Đoạn 2">
                <TextArea value={form.storyBody2} onChange={(v) => setField('storyBody2', v)} />
              </Field>
              <ImageUploadField
                label="Ảnh lớn"
                value={form.storyImage1Url}
                uploading={uploadingField === 'storyImage1Url'}
                onUpload={(file) => handleImageUpload('storyImage1Url', file)}
                onClear={() => setField('storyImage1Url', '')}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ImageUploadField
                  label="Ảnh nhỏ trái"
                  value={form.storyImage2Url}
                  uploading={uploadingField === 'storyImage2Url'}
                  onUpload={(file) => handleImageUpload('storyImage2Url', file)}
                  onClear={() => setField('storyImage2Url', '')}
                />
                <ImageUploadField
                  label="Ảnh nhỏ phải"
                  value={form.storyImage3Url}
                  uploading={uploadingField === 'storyImage3Url'}
                  onUpload={(file) => handleImageUpload('storyImage3Url', file)}
                  onClear={() => setField('storyImage3Url', '')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="CTA text">
                  <TextInput value={form.storyCtaText ?? ''} onChange={(v) => setField('storyCtaText', v)} />
                </Field>
                <Field label="CTA URL">
                  <TextInput value={form.storyCtaUrl ?? ''} onChange={(v) => setField('storyCtaUrl', v)} />
                </Field>
              </div>
            </div>

            <div style={sectionBoxStyle}>
              <h2 style={sectionTitleStyle}>Giá trị cốt lõi</h2>
              <Field label="Eyebrow">
                <TextInput value={form.valuesEyebrow} onChange={(v) => setField('valuesEyebrow', v)} />
              </Field>
              <Field label="Tiêu đề section">
                <TextInput value={form.valuesTitle} onChange={(v) => setField('valuesTitle', v)} />
              </Field>
              {form.values.map((item, i) => (
                <div key={i} style={{ marginBottom: 12, paddingTop: 8, borderTop: i > 0 ? '1px dashed #CBD5E1' : undefined }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
                    <Field label="Số">
                      <TextInput value={item.num} onChange={(v) => updateValue(i, { num: v })} />
                    </Field>
                    <Field label="Tiêu đề">
                      <TextInput value={item.title} onChange={(v) => updateValue(i, { title: v })} />
                    </Field>
                  </div>
                  <Field label="Mô tả">
                    <TextArea value={item.desc} onChange={(v) => updateValue(i, { desc: v })} rows={3} />
                  </Field>
                </div>
              ))}
            </div>

            <div style={sectionBoxStyle}>
              <h2 style={sectionTitleStyle}>Liên hệ (hiển thị)</h2>
              <Field label="Eyebrow">
                <TextInput value={form.contactEyebrow} onChange={(v) => setField('contactEyebrow', v)} />
              </Field>
              <Field label="Tiêu đề">
                <TextInput value={form.contactTitle} onChange={(v) => setField('contactTitle', v)} />
              </Field>
              <Field label="Giới thiệu">
                <TextArea value={form.contactIntro} onChange={(v) => setField('contactIntro', v)} rows={3} />
              </Field>
              <Field label="Địa chỉ">
                <TextInput value={form.address} onChange={(v) => setField('address', v)} />
              </Field>
              <Field label="Email">
                <TextInput value={form.email} onChange={(v) => setField('email', v)} />
              </Field>
              <Field label="Hotline">
                <TextInput value={form.phone} onChange={(v) => setField('phone', v)} />
              </Field>
              <Field label="Giờ làm việc">
                <TextInput value={form.workingHours} onChange={(v) => setField('workingHours', v)} />
              </Field>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: 15 }}
            >
              {saving ? 'Đang lưu…' : 'Lưu nội dung About'}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
