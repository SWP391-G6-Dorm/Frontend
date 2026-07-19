import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { FALLBACK_IMAGE, resolveMediaUrl } from '../../utils/mediaUrl';

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
};

/** Room/property image with fallback when URL is missing or fails to load. */
export default function SafeImage({ src, alt, onError, ...props }: SafeImageProps) {
  const resolved = resolveMediaUrl(src);
  const [failed, setFailed] = useState(false);

  // Reset the error state whenever the source changes so slider/gallery
  // updates actually swap the displayed image instead of getting stuck.
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  return (
    <img
      {...props}
      src={failed ? FALLBACK_IMAGE : resolved}
      alt={alt ?? ''}
      onError={(e) => {
        if (!failed) setFailed(true);
        onError?.(e);
      }}
    />
  );
}
