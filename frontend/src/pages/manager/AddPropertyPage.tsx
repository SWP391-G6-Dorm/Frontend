// AddPropertyPage.tsx — SCR-35: Add Property
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { propertyApi } from '../../api/propertyApi';
import { PropertyForm, PropertyFormData } from './_propertyShared';

// ── Toast Component ──────────────────────────────────────────────────────────

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
      {/* Icon */}
      {isSuccess ? (
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#2b9a66',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isSuccess ? 'rgba(252,252,252,0.6)' : '#991b1b',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Close notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ── Info Sidebar ─────────────────────────────────────────────────────────────

function PropertyInfoSidebar() {
  const tips = [
    {
      icon: '🏢',
      title: 'Đặt tên rõ ràng',
      desc: 'Tên property nên bao gồm loại hình (Homestay/Resort) và vị trí địa lý để dễ nhận biết.',
    },
    {
      icon: '📍',
      title: 'Địa chỉ đầy đủ',
      desc: 'Ghi rõ số nhà, tên đường, phường/xã, quận/huyện và tỉnh/thành phố.',
    },
    {
      icon: '📝',
      title: 'Mô tả thu hút',
      desc: 'Nêu bật đặc điểm nổi bật: view đẹp, tiện nghi, gần điểm tham quan nổi tiếng…',
    },
    {
      icon: '💡',
      title: 'Bước tiếp theo',
      desc: 'Sau khi tạo property, bạn có thể thêm Tầng (Floor) và Phòng (Room) từ trang chi tiết.',
    },
  ];

  return (
    <div
      className="card-lg"
      style={{
        padding: 24,
        background: 'var(--surface-bone)',
        border: '1px solid var(--hairline)',
        borderRadius: 16,
      }}
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
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                flexShrink: 0,
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
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [toast, setToast]     = useState<string | null>(null);

  async function handleSubmit(form: PropertyFormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyApi.create({
        name:        form.name.trim(),
        address:     form.address.trim(),
        description: form.description.trim() || undefined,
        status:      form.status,
      });
      if (res.success && res.data?.id) {
        setToast('Property created successfully!');
        // Đợi 800ms rồi navigate về Property Detail
        setTimeout(() => {
          navigate(`/manager/properties/${res.data.id}`);
        }, 800);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        'Failed to create property. Please try again.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <ManagerLayout>
      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast}
          type="success"
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Breadcrumb ────────────────────────────── */}
      <nav
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
        aria-label="breadcrumb"
      >
        <Link
          to="/manager/properties"
          className="body-sm"
          style={{
            color: 'var(--primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
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
        <span className="body-sm" style={{ color: 'var(--ink)', fontWeight: 600 }}>Add Property</span>
      </nav>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="display-md" style={{ marginBottom: 6 }}>Add New Property</h1>
        <p className="body-md" style={{ color: 'var(--charcoal)' }}>
          Tạo property mới (homestay / resort). Sau khi tạo, bạn có thể thêm tầng và phòng.
        </p>
      </div>

      {/* ── Error Alert ───────────────────────────── */}
      {error && (
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
            <p style={{ fontWeight: 600, marginBottom: 2 }}>Tạo property thất bại</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b', flexShrink: 0 }}
            aria-label="Dismiss error"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
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
        {/* Left: Form */}
        <div>
          <PropertyForm
            initial={{ name: '', address: '', description: '', status: 'ACTIVE' }}
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Create Property"
            cancelPath="/manager/properties"
          />
        </div>

        {/* Right: Tips sidebar */}
        <div style={{ position: 'sticky', top: 80 }}>
          <PropertyInfoSidebar />
        </div>
      </div>
    </ManagerLayout>
  );
}
