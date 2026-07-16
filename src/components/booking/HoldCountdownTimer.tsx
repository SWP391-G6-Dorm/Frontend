import { useEffect, useState } from 'react';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface HoldCountdownTimerProps {
  holdExpiresAt: string | null | undefined;
  onExpire?: () => void;
  className?: string;
}

/**
 * SCR-20 — countdown from Booking.holdExpiresAt (default hold 10 min).
 * Calls onExpire once when the window ends.
 */
export default function HoldCountdownTimer({
  holdExpiresAt,
  onExpire,
  className = '',
}: HoldCountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() => {
    if (!holdExpiresAt) return null;
    return new Date(holdExpiresAt).getTime() - Date.now();
  });
  const [expiredNotified, setExpiredNotified] = useState(false);

  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      const ms = new Date(holdExpiresAt).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0 && !expiredNotified) {
        setExpiredNotified(true);
        onExpire?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [holdExpiresAt, onExpire, expiredNotified]);

  if (!holdExpiresAt || remainingMs === null) return null;

  const expired = remainingMs <= 0;

  return (
    <div
      className={`rounded-lg px-4 py-3 border ${
        expired
          ? 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#EF4444]'
          : 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#B45309]'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {expired ? (
        <p className="body-md font-semibold">Payment window expired</p>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="body-md font-semibold">Thời hạn thanh toán cọc</p>
          <p className="font-mono text-lg font-bold tabular-nums" aria-label={`${formatRemaining(remainingMs)} còn lại`}>
            {formatRemaining(remainingMs)}
          </p>
        </div>
      )}
      {!expired && (
        <p className="body-sm mt-1 opacity-90">Vui lòng thanh toán trước khi hết giờ giữ chỗ (mặc định 10 phút).</p>
      )}
    </div>
  );
}

export function isHoldExpired(holdExpiresAt: string | null | undefined): boolean {
  if (!holdExpiresAt) return false;
  return new Date(holdExpiresAt).getTime() <= Date.now();
}
