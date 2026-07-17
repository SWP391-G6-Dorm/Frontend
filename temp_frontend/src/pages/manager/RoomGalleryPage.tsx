import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import {
  GalleryImage,
  fetchGalleryImagesV1,
  uploadRoomImagesV1,
  setPrimaryImageV1,
  deleteRoomImageV1,
  reorderRoomImagesV1,
} from '../../api/galleryApi';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function validateFiles(files: File[]): string | null {
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" không đúng định dạng. Chỉ chấp nhận JPG, PNG hoặc WebP.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `"${file.name}" vượt quá 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }
  }
  return null;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-[#F1F5F9] animate-pulse" />
      ))}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card p-6 max-w-sm w-full">
        <h3 className="font-semibold text-[#0F172A] mb-2">{title}</h3>
        <p className="text-sm text-[#64748B] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ background: '#DC2626', borderColor: '#DC2626' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xóa…' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageCard({
  image,
  index,
  onSetPrimary,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  settingPrimaryId,
  deletingId,
  dragOverIndex,
}: {
  image: GalleryImage;
  index: number;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  settingPrimaryId: string | null;
  deletingId: string | null;
  dragOverIndex: number | null;
}) {
  const [hovered, setHovered] = useState(false);
  const isProcessing = settingPrimaryId === image.id || deletingId === image.id;

  return (
    <div
      draggable={!isProcessing}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative aspect-square rounded-lg overflow-hidden shadow-sm cursor-grab active:cursor-grabbing ${
        dragOverIndex === index ? 'ring-2 ring-primary' : ''
      }`}
    >
      <img
        src={image.imageUrl}
        alt="Phòng"
        className="w-full h-full object-cover block"
        loading="lazy"
        draggable={false}
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14'%3EẢnh lỗi%3C/text%3E%3C/svg%3E";
        }}
      />

      {image.isPrimary && (
        <span className="absolute top-2 left-2 bg-[#2b9a66] text-white text-[11px] font-bold rounded-full px-2.5 py-0.5">
          Ảnh đại diện
        </span>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
          <span className="spinner w-7 h-7 border-white/30 border-t-white" />
        </div>
      )}

      {hovered && !isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
          {!image.isPrimary && (
            <button
              type="button"
              onClick={() => onSetPrimary(image.id)}
              className="bg-white/90 border-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              ☆ Đặt làm đại diện
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            className="absolute top-2 right-2 bg-red-600/90 border-0 rounded-full w-7 h-7 text-white text-lg font-bold cursor-pointer flex items-center justify-center"
            title="Xóa ảnh"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default function RoomGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomName, setRoomName] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);

  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const loadImages = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchGalleryImagesV1(id);
      setRoomName(data.roomName);
      setImages(data.images.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setLoadError(axiosErr?.response?.data?.message ?? 'Không tải được thư viện ảnh.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  async function handleUpload(files: File[]) {
    if (!id || files.length === 0) return;

    setError(null);
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setUploadingCount(files.length);
    try {
      const newImages = await uploadRoomImagesV1(id, files);
      setImages((prev) => {
        const hasPrimaryInNew = newImages.some((i) => i.isPrimary);
        const updated = hasPrimaryInNew ? prev.map((i) => ({ ...i, isPrimary: false })) : [...prev];
        return [...updated, ...newImages].sort((a, b) => a.sortOrder - b.sortOrder);
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? 'Tải ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleUpload(files);
    e.target.value = '';
  }

  function handleFileDragOver(e: DragEvent) {
    e.preventDefault();
    setFileDragOver(true);
  }

  function handleFileDrop(e: DragEvent) {
    e.preventDefault();
    setFileDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files);
  }

  async function handleSetPrimary(imageId: string) {
    if (!id) return;
    setError(null);
    setSettingPrimaryId(imageId);
    try {
      await setPrimaryImageV1(id, imageId);
      setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === imageId })));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? 'Không thể đặt ảnh đại diện.');
    } finally {
      setSettingPrimaryId(null);
    }
  }

  async function confirmDelete() {
    if (!id || !deleteTarget) return;
    setError(null);
    setDeletingId(deleteTarget);
    try {
      await deleteRoomImageV1(id, deleteTarget);
      const remaining = images.filter((img) => img.id !== deleteTarget);
      const hadPrimary = images.find((img) => img.id === deleteTarget)?.isPrimary;
      if (hadPrimary && remaining.length > 0 && !remaining.some((i) => i.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      setImages(remaining);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? 'Xóa ảnh thất bại.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleImageDragStart(index: number) {
    setDragIndex(index);
  }

  function handleImageDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  async function handleImageDrop(targetIndex: number) {
    if (!id || dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const prev = [...images];
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const withOrder = reordered.map((img, i) => ({ ...img, sortOrder: i }));

    setImages(withOrder);
    setDragIndex(null);
    setDragOverIndex(null);
    setReordering(true);

    try {
      const result = await reorderRoomImagesV1(
        id,
        withOrder.map((img) => img.id),
      );
      setImages(result.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err: unknown) {
      setImages(prev);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? 'Sắp xếp ảnh thất bại.');
    } finally {
      setReordering(false);
    }
  }

  const primaryCount = images.filter((i) => i.isPrimary).length;

  if (loadError) {
    return (
      <ManagerLayout>
        <div className="card p-10 text-center max-w-md mx-auto">
          <Alert variant="error" message={loadError} />
          <div className="flex gap-3 justify-center mt-6">
            <button type="button" className="btn-primary" onClick={loadImages}>
              Thử lại
            </button>
            <Link to="/manager/rooms" className="btn-ghost">
              Quay lại
            </Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <ConfirmModal
        open={deleteTarget !== null}
        title="Xóa ảnh?"
        message="Hành động này không thể hoàn tác. Ảnh sẽ bị xóa vĩnh viễn."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingId !== null}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="flex items-center gap-2 text-sm text-[#64748B] mb-5">
        <Link to="/manager/rooms" className="text-primary no-underline hover:underline">
          Danh sách phòng
        </Link>
        <span>›</span>
        <span className="text-[#64748B]">{roomName || id}</span>
        <span>›</span>
        <span className="font-semibold text-[#0F172A]">Thư viện ảnh</span>
      </div>

      <div className="card p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="heading-md mb-1">Thư viện ảnh — Phòng {roomName}</h1>
            {!loading && images.length > 0 && (
              <p className="text-sm text-[#64748B]">
                {images.length} ảnh
                {primaryCount > 0 ? ' · Đã có ảnh đại diện' : ' · Chưa có ảnh đại diện'}
                {reordering ? ' · Đang sắp xếp…' : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            + Tải ảnh lên
          </button>
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" message={error} closeable onClose={() => setError(null)} />
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={handleFileDragOver}
          onDragLeave={() => setFileDragOver(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition-colors ${
            fileDragOver ? 'border-primary bg-primary/5' : 'border-[#E2E8F0] bg-[#F8FAFC]'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <p className="text-sm font-medium text-[#64748B]">
              Đang tải {uploadingCount} ảnh…
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-[#334155] mb-1">
                Kéo thả JPG / PNG / WebP vào đây, hoặc bấm để chọn
              </p>
              <p className="text-xs text-[#94A3B8]">Tối đa 5 MB mỗi ảnh</p>
            </>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : images.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📷</p>
            <h2 className="font-semibold text-[#0F172A] mb-2">Chưa có ảnh nào</h2>
            <p className="text-sm text-[#64748B] mb-6">Tải ảnh đầu tiên để giới thiệu phòng.</p>
            <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              + Tải ảnh đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  index={index}
                  onSetPrimary={handleSetPrimary}
                  onDelete={setDeleteTarget}
                  onDragStart={handleImageDragStart}
                  onDragOver={handleImageDragOver}
                  onDrop={handleImageDrop}
                  settingPrimaryId={settingPrimaryId}
                  deletingId={deletingId}
                  dragOverIndex={dragOverIndex}
                />
              ))}
            </div>

            {primaryCount === 0 && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-5">
                Chưa có ảnh đại diện. Di chuột vào ảnh và chọn &quot;Đặt làm đại diện&quot;.
              </p>
            )}

            <p className="text-xs text-[#94A3B8] mt-4">
              Kéo thả ảnh để thay đổi thứ tự hiển thị.
            </p>
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
