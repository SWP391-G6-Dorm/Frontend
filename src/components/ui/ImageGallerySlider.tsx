import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SafeImage from './SafeImage';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface ImageGallerySliderProps {
  images: { id?: string; imageUrl: string; sortOrder?: number }[];
  alt: string;
  /** Chế độ controlled — dùng trong lightbox */
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Chế độ uncontrolled — gallery inline */
  initialIndex?: number;
}

function imageKey(images: { id?: string; imageUrl: string }[]) {
  return images.map((img) => img.id ?? img.imageUrl).join('|');
}

export default function ImageGallerySlider({
  images,
  alt,
  currentIndex,
  onIndexChange,
  initialIndex = 0,
}: ImageGallerySliderProps) {
  const slides = useMemo(() => {
    const urls = images
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((img) => resolveMediaUrl(img.imageUrl));
    return urls.length > 0 ? urls : [resolveMediaUrl(null)];
  }, [images]);

  const isControlled = currentIndex !== undefined && onIndexChange !== undefined;
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const index = isControlled ? currentIndex : internalIndex;
  const touchStartX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const imagesKey = imageKey(images);

  useEffect(() => {
    if (isControlled) return;
    setInternalIndex(Math.min(initialIndex, Math.max(slides.length - 1, 0)));
  }, [imagesKey, initialIndex, slides.length, isControlled]);

  useEffect(() => {
    const el = thumbsRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [index]);

  const setIndex = useCallback(
    (next: number | ((prev: number) => number)) => {
      const resolved =
        typeof next === 'function'
          ? next(isControlled ? currentIndex! : internalIndex)
          : next;
      const clamped = slides.length === 0 ? 0 : ((resolved % slides.length) + slides.length) % slides.length;
      if (isControlled) onIndexChange!(clamped);
      else setInternalIndex(clamped);
    },
    [currentIndex, internalIndex, isControlled, onIndexChange, slides.length],
  );

  const go = useCallback((delta: number) => setIndex((i) => i + delta), [setIndex]);
  const goTo = useCallback((next: number) => setIndex(next), [setIndex]);

  const hasMultiple = slides.length > 1;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) go(-1);
    else go(1);
  }

  return (
    <div className="image-gallery-slider">
      <div
        className="image-gallery-slider-main"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <SafeImage
          src={slides[index]}
          alt={alt}
          className="image-gallery-slider-img"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              className="image-gallery-slider-nav image-gallery-slider-nav--prev"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="image-gallery-slider-nav image-gallery-slider-nav--next"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              ›
            </button>
            <div className="image-gallery-slider-counter">
              {index + 1} / {slides.length}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div ref={thumbsRef} className="image-gallery-slider-thumbs">
          {slides.map((src, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              className={`image-gallery-slider-thumb${i === index ? ' image-gallery-slider-thumb--active' : ''}`}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
            >
              <SafeImage src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
