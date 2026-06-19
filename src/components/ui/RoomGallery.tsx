import { useMemo, useState } from 'react';
import SafeImage from './SafeImage';
import ImageGallerySlider from './ImageGallerySlider';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface RoomGalleryProps {
  images: { id?: string; imageUrl: string; sortOrder?: number }[];
  alt: string;
}

export default function RoomGallery({ images, alt }: RoomGalleryProps) {
  const slides = useMemo(() => {
    return images
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((img) => ({ ...img, url: resolveMediaUrl(img.imageUrl) }));
  }, [images]);

  const urls = slides.length > 0 ? slides.map((s) => s.url) : [resolveMediaUrl(null)];
  const [mainIndex, setMainIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const thumbs = urls.slice(0, 5);
  const sideThumbs = thumbs.filter((_, i) => i !== mainIndex).slice(0, 4);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: urls.length > 1 ? '1.5fr 1fr' : '1fr',
          gap: 8,
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: 320,
        }}
      >
        <div style={{ position: 'relative', minHeight: 280 }}>
          <SafeImage
            src={urls[mainIndex]}
            alt={alt}
            style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
            onClick={() => setLightboxOpen(true)}
          />
          {urls.length > 1 && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setLightboxOpen(true)}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: 'rgba(255,255,255,0.92)',
                borderRadius: 9999,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Xem tất cả ảnh ({urls.length})
            </button>
          )}
        </div>

        {urls.length > 1 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: 8,
              minHeight: 280,
            }}
          >
            {sideThumbs.map((url) => {
              const idx = urls.indexOf(url);
              return (
                <button
                  key={url + idx}
                  type="button"
                  onClick={() => setMainIndex(idx)}
                  style={{
                    border: mainIndex === idx ? '2px solid var(--primary)' : 'none',
                    borderRadius: 8,
                    overflow: 'hidden',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <SafeImage src={url} alt="" style={{ width: '100%', height: '100%', minHeight: 130, objectFit: 'cover' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Đóng ✕
            </button>
          </div>
          <div style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <ImageGallerySlider images={slides} alt={alt} />
          </div>
        </div>
      )}
    </>
  );
}
