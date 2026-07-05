import api from './axiosInstance';
import { RoomDetail } from './roomsApi';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * POST /api/rooms/{id}/images
 * Upload one or more images (multipart/form-data).
 * Returns the newly created GalleryImage records so UI can update without reload.
 * If room has no images yet, the first file is auto-set as primary.
 */
export async function uploadRoomImages(
  roomId: string,
  files: File[],
  setPrimary = false,
): Promise<GalleryImage[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  const res = await api.post(
    `/api/rooms/${roomId}/images`,
    formData,
    {
      params: { setPrimary },
    },
  );
  return (res.data.data ?? []) as GalleryImage[];
}

/**
 * GET /api/rooms/{id} — reuse fetchRoomById to get current images list.
 * Returns room images sorted by sortOrder.
 */
export async function fetchGalleryImages(roomId: string): Promise<{ roomName: string; images: GalleryImage[] }> {
  const res = await api.get(`/api/rooms/${roomId}`);
  const room: RoomDetail = res.data.data;
  return {
    roomName: room.roomNumber,
    images: (room.images ?? []).map(img => ({
      id: String(img.id),
      imageUrl: img.imageUrl,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  };
}

/**
 * PATCH /api/room-images/{id}/set-primary
 * Marks this image as primary (clears all others for the same room on backend).
 */
export async function setPrimaryImage(imageId: string): Promise<void> {
  await api.patch(`/api/room-images/${imageId}/set-primary`);
}

/**
 * DELETE /api/room-images/{id}
 * Permanently deletes an image from gallery (file + DB record).
 */
export async function deleteRoomImage(imageId: string): Promise<void> {
  await api.delete(`/api/room-images/${imageId}`);
}
