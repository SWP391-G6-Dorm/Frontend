import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ImageGallerySlider from './ImageGallerySlider';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface RoomGalleryProps {
  images: { id?: string; imageUrl: string; sortOrder?: number }[];
  alt: string;
}

export default function RoomGallery({ images, alt }: RoomGalleryProps) {
  const slides = useMemo(
    () =>
      images
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((img) => ({ ...img, imageUrl: resolveMediaUrl(img.imageUrl) })),
    [images],
  );

  const imageCount = slides.length;
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const slidesKey = useMemo(
    () => slides.map((s) => s.id ?? s.imageUrl).join('|'),
    [slides],
  );

  useEffect(() => {
    setIndex(0);
  }, [slidesKey]);

  const navigate = useCallback(
    (delta: number) => {
      if (imageCount <= 1) return;
      setIndex((i) => (i + delta + imageCount) % imageCount);
    },
    [imageCount],
  );

  function closeLightbox() {
    setLightboxOpen(false);
  }

  useEffect(() => {
    if (!lightboxOpen) return;

    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    requestAnimationFrame(() => lightboxRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [lightboxOpen, navigate]);

  if (imageCount <= 1) {
    return (
      <div className="room-gallery">
        <ImageGallerySlider images={slides} alt={alt} />
      </div>
    );
  }

  const lightbox = lightboxOpen
    ? createPortal(
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Thư viện ảnh"
          tabIndex={0}
          className="room-gallery-lightbox"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              navigate(-1);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              navigate(1);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              closeLightbox();
            }
          }}
        >
          <div className="room-gallery-lightbox-header">
            <button type="button" className="room-gallery-lightbox-close" onClick={closeLightbox}>
              Đóng ✕
            </button>
          </div>
          <div className="room-gallery-lightbox-body">
            <ImageGallerySlider
              images={slides}
              alt={alt}
              currentIndex={index}
              onIndexChange={setIndex}
            />
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div className="room-gallery">
        <div className="room-gallery-inline">
          <ImageGallerySlider
            images={slides}
            alt={alt}
            currentIndex={index}
            onIndexChange={setIndex}
          />
          <button
            type="button"
            className="room-gallery-view-all"
            onClick={() => setLightboxOpen(true)}
          >
            Xem tất cả ảnh ({imageCount})
          </button>
        </div>
      </div>
      {lightbox}
    </>
  );
}
