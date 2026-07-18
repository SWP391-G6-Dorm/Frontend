// EditPropertyPage.tsx — SCR-36: Edit Property
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { propertyApi, PropertySummary } from '../../api/propertyApi';
import { PropertyForm, PropertyFormData, StatusBadge, formatDate } from './_propertyShared';

// ── Toast Component (local) ──────────────────────────────────────────────────

function Toast({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className="animate-fade-up"
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        background: isSuccess ? '#202020' : '#fee2e2',
        color: isSuccess ? '#fcfcfc' : '#991b1b',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(32,32,32,0.18)',
        maxWidth: 380,
        minWidth: 260,
        borderLeft: isSuccess ? '4px solid #2b9a66' : '4px solid #DC2626',
      }}
    >
      {isSuccess ? (
        <span
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#2b9a66',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <span className="body-sm" style={{ flex: 1, fontWeight: 500, color: isSuccess ? '#fcfcfc' : '#991b1b' }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: isSuccess ? 'rgba(252,252,252,0.6)' : '#991b1b',
          padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0,
        }}
        aria-label="Đóng thông báo"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function EditPropertySkeleton() {
  return (
    <ManagerLayout>
      {/* Breadcrumb skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 8, height: 8, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 8, height: 8, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 40, height: 14, borderRadius: 999 }} />
      </div>

      {/* Title skeleton */}
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 220, height: 32, borderRadius: 8, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 340, height: 16, borderRadius: 999 }} />
      </div>

      {/* Two-column skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Form skeleton */}
        <div className="card-lg" style={{ padding: 32 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 999, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 999 }} />
            </div>
          ))}
          <div style={{ marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 999, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 10 }} />
          </div>
          <div style={{ marginBottom: 32 }}>
            <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 999, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="skeleton" style={{ flex: 1, height: 64, borderRadius: 10 }} />
              <div className="skeleton" style={{ flex: 1, height: 64, borderRadius: 10 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, paddingTop: 24, borderTop: '1px solid var(--hairline)' }}>
            <div className="skeleton" style={{ width: 160, height: 44, borderRadius: 999 }} />
            <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 999 }} />
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="skeleton" style={{ borderRadius: 16, minHeight: 300 }} />
      </div>
    </ManagerLayout>
  );
}

// ── Error State ──────────────────────────────────────────────────────────────

function EditPropertyError({ message }: { message: string }) {
  return (
    <ManagerLayout>
      <div className="alert alert-error animate-fade-in" style={{ maxWidth: 560 }} role="alert">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Không thể tải property</p>
          <p>{message}</p>
          <Link
            to="/manager/properties"
            className="body-sm"
            style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-block', marginTop: 8, fontWeight: 600 }}
          >
            ← Quay về danh sách Properties
          </Link>
        </div>
      </div>
    </ManagerLayout>
  );
}

// ── Tips Sidebar (giống Add) ─────────────────────────────────────────────────

function EditTipsSidebar({ property }: { property: PropertySummary }) {
  const tips = [
    {
      icon: '✏️',
      title: 'Chỉnh sửa cẩn thận',
      desc: 'Tên và địa chỉ sẽ hiển thị cho khách hàng — đảm bảo thông tin chính xác.',
    },
    {
      icon: '🔄',
      title: 'Thay đổi Status',
      desc: 'Chuyển sang "Tạm đóng" nếu property không nhận đặt phòng trong thời gian tới.',
    },
    {
      icon: '📝',
      title: 'Cập nhật mô tả',
      desc: 'Mô tả tốt giúp khách hàng hiểu rõ hơn về property và tăng tỷ lệ đặt phòng.',
    },
    {
      icon: '💡',
      title: 'Bước tiếp theo',
      desc: 'Sau khi lưu, bạn có thể quản lý tầng và phòng từ trang Property Detail.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tips card */}
      <div
        className="card-lg"
        style={{ padding: 24, background: 'var(--surface-bone)', border: '1px solid var(--hairline)', borderRadius: 16 }}
      >
        <p
          className="body-sm"
          style={{ fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}
        >
          Hướng dẫn
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--surface-card)', border: '1px solid var(--hairline)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                }}
              >
                {tip.icon}
              </span>
              <div>
                <p className="body-sm" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                  {tip.title}
                </p>
                <p className="caption" style={{ color: 'var(--charcoal)', lineHeight: 1.5 }}>
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick info card */}
      <div className="card-lg" style={{ padding: 20 }}>
        <p
          className="body-sm"
          style={{ fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}
        >
          Thông tin hiện tại
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Tổng số tầng', value: property.totalFloors },
            { label: 'Tổng số phòng', value: property.totalRooms },
            { label: 'Phòng trống', value: property.availableRooms },
            { label: 'Tạo ngày', value: formatDate(property.createdAt) },
            { label: 'Cập nhật', value: formatDate(property.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="body-sm" style={{ color: 'var(--charcoal)' }}>{label}</span>
              <span className="body-sm" style={{ fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Quick nav links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
          <Link
            to={`/manager/properties/${property.id}`}
            className="btn-outline btn-sm"
            style={{ textDecoration: 'none', justifyContent: 'center' }}
            id="btn-view-property-detail"
          >
            Xem Property Detail
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Dirty Check Helper ───────────────────────────────────────────────────────

function useIsDirty(initial: PropertyFormData, current: PropertyFormData) {
  return (
    current.name        !== initial.name        ||
    current.address     !== initial.address     ||
    current.description !== initial.description ||
    current.status      !== initial.status
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function EditPropertyPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [property, setProperty] = useState<PropertySummary | null>(null);
  const [loadErr, setLoadErr]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);

  // Track current form values for dirty check
  const [currentForm, setCurrentForm] = useState<PropertyFormData>({
    name: '', address: '', description: '', status: 'ACTIVE',
  });

  // Load property on mount
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    propertyApi.getById(id)
      .then(res => {
        if (res.success && res.data) {
          setProperty(res.data);
          const initial: PropertyFormData = {
            name:        res.data.name        || '',
            address:     res.data.address     || '',
            description: res.data.description || '',
            status:      (res.data.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
          };
          setCurrentForm(initial);
        }
      })
      .catch(() => setLoadErr('Không tìm thấy property. Vui lòng kiểm tra lại.'))
      .finally(() => setLoading(false));
  }, [id]);

  const initialForm: PropertyFormData = {
    name:        property?.name        || '',
    address:     property?.address     || '',
    description: property?.description || '',
    status:      (property?.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
  };

  const isDirty = useIsDirty(initialForm, currentForm);

  // Handle Cancel with dirty check
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm('Bạn có thay đổi chưa lưu. Thoát mà không lưu?');
      if (!ok) return;
    }
    navigate(`/manager/properties/${id}`);
  }, [isDirty, id, navigate]);

  // Handle form submit
  async function handleSubmit(form: PropertyFormData) {
    if (!id) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await propertyApi.update(id, {
        name:        form.name.trim(),
        address:     form.address.trim(),
        description: form.description.trim() || undefined,
        status:      form.status,
      });
      if (res.success) {
        setToast('Property updated successfully!');
        setTimeout(() => {
          navigate(`/manager/properties/${id}`);
        }, 800);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        'Failed to update property. Please try again.';
      setSaveErr(msg);
      setSaving(false);
    }
  }

  // ── Render states ─────────────────────────────────────────────

  if (loading) return <EditPropertySkeleton />;
  if (loadErr || !property) return <EditPropertyError message={loadErr || 'Unknown error'} />;

  return (
    <ManagerLayout>
      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <Toast message={toast} type="success" onClose={() => setToast(null)} />
      )}

      {/* ── Breadcrumb ────────────────────────────── */}
      <nav
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}
        aria-label="breadcrumb"
      >
        <Link
          to="/manager/properties"
          className="body-sm"
          style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          Properties
        </Link>
        <span className="body-sm" style={{ color: 'var(--stone)' }}>/</span>
        <Link
          to={`/manager/properties/${id}`}
          className="body-sm"
          style={{ color: 'var(--primary)', textDecoration: 'none', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={property.name}
        >
          {property.name}
        </Link>
        <span className="body-sm" style={{ color: 'var(--stone)' }}>/</span>
        <span className="body-sm" style={{ color: 'var(--ink)', fontWeight: 600 }}>Edit</span>
      </nav>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <h1 className="display-md">Edit Property</h1>
          <StatusBadge status={property.status} />
          {isDirty && (
            <span
              className="body-sm"
              style={{ color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
              Unsaved changes
            </span>
          )}
        </div>
        <p className="body-md" style={{ color: 'var(--charcoal)' }}>
          Chỉnh sửa thông tin cho: <strong style={{ color: 'var(--ink)' }}>{property.name}</strong>
        </p>
      </div>

      {/* ── Save Error Alert ───────────────────────── */}
      {saveErr && (
        <div
          className="alert alert-error animate-fade-in"
          style={{ marginBottom: 24 }}
          role="alert"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>Cập nhật thất bại</p>
            <p>{saveErr}</p>
          </div>
          <button
            onClick={() => setSaveErr(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b', flexShrink: 0 }}
            aria-label="Đóng thông báo lỗi"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Two-column Layout ─────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left: Form — pre-filled */}
        <div>
          <PropertyForm
            initial={initialForm}
            onSubmit={(form) => {
              setCurrentForm(form);
              handleSubmit(form);
            }}
            loading={saving}
            submitLabel="Save Changes"
            cancelPath={`/manager/properties/${id}`}
            onFormChange={setCurrentForm}
            onCancel={handleCancel}
          />
        </div>

        {/* Right: Tips sidebar (sticky) */}
        <div style={{ position: 'sticky', top: 80 }}>
          <EditTipsSidebar property={property} />
        </div>
      </div>
    </ManagerLayout>
  );
}
