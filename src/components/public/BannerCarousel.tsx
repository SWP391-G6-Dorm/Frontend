import { useCallback, useEffect, useRef, useState } from 'react';
import SafeImage from '../ui/SafeImage';

export interface BannerSlide {
  src: string;
  alt: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  activeIndex: number;
  onChange: (index: number) => void;
  autoPlayMs?: number;
}

export default function BannerCarousel({
  slides,
  activeIndex,
  onChange,
  autoPlayMs = 5000,
}: BannerCarouselProps) {
  const count = slides.length;
  const touchStartX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      onChange((index + count) % count);
    },
    [count, onChange],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    if (count <= 1 || paused || autoPlayMs <= 0) return;
    const timer = window.setInterval(() => goNext(), autoPlayMs);
    return () => window.clearInterval(timer);
  }, [activeIndex, autoPlayMs, count, goNext, paused]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  if (count === 0) return null;

  const prevIndex = (activeIndex - 1 + count) % count;
  const nextIndex = (activeIndex + 1) % count;
  const current = slides[activeIndex];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  return (
    <div
      className="landing-banner-carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {count > 1 && (
        <button
          type="button"
          className="landing-banner-slide landing-banner-slide--side"
          aria-label="Ảnh trước"
          onClick={goPrev}
        >
          <SafeImage src={slides[prevIndex].src} alt="" />
        </button>
      )}

      <div
        className="landing-banner-slide landing-banner-slide--center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <SafeImage
          key={current.src + activeIndex}
          src={current.src}
          alt={current.alt}
          className="landing-banner-main-img"
        />

        {count > 1 && (
          <>
            <button type="button" className="landing-banner-arrow landing-banner-arrow--prev" aria-label="Slide trước" onClick={goPrev}>
              ‹
            </button>
            <button type="button" className="landing-banner-arrow landing-banner-arrow--next" aria-label="Slide tiếp theo" onClick={goNext}>
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <button
          type="button"
          className="landing-banner-slide landing-banner-slide--side"
          aria-label="Ảnh tiếp theo"
          onClick={goNext}
        >
          <SafeImage src={slides[nextIndex].src} alt="" />
        </button>
      )}
    </div>
  );
}
