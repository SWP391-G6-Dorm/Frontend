import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import {
  GalleryImage,
  fetchGalleryImages,
  uploadRoomImages,
  setPrimaryImage,
  deleteRoomImage,
} from '../../api/galleryApi';

// ── Constants ──────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Validation ────────────────────────────────────────────────────────────────

function validateFiles(files: File[]): string | null {
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a valid format. Use JPG, PNG or WebP.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `"${file.name}" exceeds 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }
  }
  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            borderRadius: 12,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
      ))}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
      <h2 className="heading-sm" style={{ marginBottom: 8 }}>No images yet</h2>
      <p className="body-md" style={{ color: 'var(--charcoal)', marginBottom: 24 }}>
        Upload the first photo to showcase this room.
      </p>
      <button className="btn-primary" onClick={onUpload}>
        + Upload First Photo
      </button>
    </div>
  );
}

// Image card with hover overlay
function ImageCard({
  image,
  onSetPrimary,
  onDelete,
  settingPrimaryId,
  deletingId,
}: {
  image: GalleryImage;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  settingPrimaryId: string | null;
  deletingId: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const isProcessing = settingPrimaryId === image.id || deletingId === image.id;

  return (
    <div
      style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', cursor: 'default', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <img
        src={image.imageUrl}
        alt="Room"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
        onError={e => {
            const target = e.currentTarget as HTMLImageElement;
            target.onerror = null; // prevent infinite loop
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
      />

      {/* Primary badge */}
      {image.isPrimary && (
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span
            style={{
              background: '#2b9a66',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 9999,
              padding: '3px 10px',
              letterSpacing: 0.3,
            }}
          >
            PRIMARY
          </span>
        </div>
      )}

      {/* Processing spinner overlay */}
      {isProcessing && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
        </div>
      )}

      {/* Hover action overlay */}
      {hovered && !isProcessing && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.48)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'opacity 0.15s',
          }}
        >
          {/* Set Primary button */}
          {!image.isPrimary && (
            <button
              onClick={() => onSetPrimary(image.id)}
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              ☆ Set Primary
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={() => onDelete(image.id)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(220,38,38,0.90)',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              cursor: 'pointer',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            title="Delete image"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// Upload drop zone
function DropZone({
  dragOver,
  uploading,
  uploadingCount,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  dragOver: boolean;
  uploading: boolean;
  uploadingCount: number;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragOver ? '#D41B2C' : 'var(--hairline)'}`,
        borderRadius: 12,
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: dragOver ? 'rgba(212,27,44,0.04)' : 'var(--surface-bone)',
        transition: 'all 0.15s ease',
        marginBottom: 24,
        userSelect: 'none',
      }}
    >
      {uploading ? (
        <>
          <span className="spinner" style={{ width: 24, height: 24 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
            Uploading {uploadingCount} file{uploadingCount !== 1 ? 's' : ''}…
          </p>
        </>
      ) : dragOver ? (
        <>
          <span style={{ fontSize: 32 }}>📂</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Drop files here</p>
        </>
      ) : (
        <>
          <span style={{ fontSize: 32 }}>📷</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
            Drag & drop JPG / PNG / WebP here, or click to select
          </p>
          <p className="body-sm" style={{ color: 'var(--stone)' }}>Max 5 MB per file</p>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RoomGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────

  const [roomName, setRoomName]         = useState('');
  const [images, setImages]             = useState<GalleryImage[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState('');

  const [uploading, setUploading]       = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError]   = useState('');
  const [dragOver, setDragOver]         = useState(false);

  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [deletingId, setDeletingId]             = useState<string | null>(null);
  const [actionError, setActionError]           = useState('');

  // ── Load images on mount ──────────────────────────────────────────────────

  const loadImages = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchGalleryImages(id);
      setRoomName(data.roomName);
      setImages(data.images.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err: any) {
      setLoadError(err?.response?.data?.message ?? 'Failed to load gallery.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadImages(); }, [loadImages]);

  // ── Upload ────────────────────────────────────────────────────────────────

  async function handleUpload(files: File[]) {
    if (!id || files.length === 0) return;

    setUploadError('');
    const err = validateFiles(files);
    if (err) { setUploadError(err); return; }

    setUploading(true);
    setUploadingCount(files.length);
    try {
      // First-ever upload → backend auto-sets primary via isFirstEver logic
      const newImages = await uploadRoomImages(id, files);
      setImages(prev => {
        // If any of newImages is primary, clear previous primary in local state
        const hasPrimaryInNew = newImages.some(i => i.isPrimary);
        const updated = hasPrimaryInNew
          ? prev.map(i => ({ ...i, isPrimary: false }))
          : [...prev];
        return [...updated, ...newImages].sort((a, b) => a.sortOrder - b.sortOrder);
      });
    } catch (err: any) {
      setUploadError(err?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleUpload(files);
    e.target.value = ''; // reset so same file can be re-selected
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files);
  }

  // ── Set Primary ───────────────────────────────────────────────────────────

  async function handleSetPrimary(imageId: string) {
    setActionError('');
    setSettingPrimaryId(imageId);
    try {
      await setPrimaryImage(imageId);
      // Optimistic update — clear all, set this one
      setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === imageId })));
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Failed to set primary image.');
    } finally {
      setSettingPrimaryId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(imageId: string) {
    if (!window.confirm('Delete this image? This cannot be undone.')) return;
    setActionError('');
    setDeletingId(imageId);
    try {
      await deleteRoomImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Failed to delete image.');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render: Load error ───────────────────────────────────────────────────

  if (loadError) {
    return (
      <ManagerLayout>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 className="heading-sm" style={{ marginBottom: 8 }}>Failed to load gallery</h2>
          <p className="body-md" style={{ color: 'var(--charcoal)', marginBottom: 24 }}>{loadError}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={loadImages}>Retry</button>
            <Link to="/manager/rooms" className="btn-ghost">Back to Rooms</Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  // ── Render: Main ─────────────────────────────────────────────────────────

  const primaryCount = images.filter(i => i.isPrimary).length;

  return (
    <ManagerLayout>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 body-sm" style={{ marginBottom: 20, color: 'var(--charcoal)' }}>
        <Link to="/manager/rooms" className="text-primary" style={{ textDecoration: 'none' }}>Rooms</Link>
        <span style={{ color: 'var(--stone)' }}>›</span>
        <Link to={`/manager/rooms/${id}`} className="text-primary" style={{ textDecoration: 'none' }}>
          {roomName || id}
        </Link>
        <span style={{ color: 'var(--stone)' }}>›</span>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Gallery</span>
      </div>

      {/* ── Header row ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
      >
        <div>
          <h1 className="heading-md" style={{ marginBottom: 4 }}>
            Room Gallery: {roomName}
          </h1>
          {!loading && images.length > 0 && (
            <p className="body-sm" style={{ color: 'var(--charcoal)' }}>
              {images.length} image{images.length !== 1 ? 's' : ''} total
              {primaryCount > 0 ? ' · 1 primary set' : ' · ⚠ No primary set'}
            </p>
          )}
        </div>
        <button
          id="scr43-upload-btn"
          className="btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          + Upload Images
        </button>
      </div>

      {/* ── Error banners ── */}
      {(uploadError || actionError) && (
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
          <div>
            <p style={{ fontSize: 14, color: '#991B1B', fontWeight: 500 }}>
              {uploadError || actionError}
            </p>
            <button
              style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
              onClick={() => { setUploadError(''); setActionError(''); }}
            >
              Dismiss ×
            </button>
          </div>
        </div>
      )}

      {/* ── Upload drop zone ── */}
      <DropZone
        dragOver={dragOver}
        uploading={uploading}
        uploadingCount={uploadingCount}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      />

      {/* ── Gallery grid or states ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : images.length === 0 ? (
        <EmptyState onUpload={() => fileInputRef.current?.click()} />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {images.map(img => (
              <ImageCard
                key={img.id}
                image={img}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDelete}
                settingPrimaryId={settingPrimaryId}
                deletingId={deletingId}
              />
            ))}
          </div>

          {/* Hint */}
          {primaryCount === 0 && images.length > 0 && (
            <div
              style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: 10,
                padding: '10px 16px',
                marginTop: 20,
              }}
            >
              <p style={{ fontSize: 13, color: '#92400E' }}>
                ⚠ No primary image set. Hover over an image and click "☆ Set Primary" to choose the cover photo.
              </p>
            </div>
          )}
        </>
      )}
    </ManagerLayout>
  );
}
