import { ReactNode } from 'react';

function formatVnd(n: number) {
  return `₫${Number(n).toLocaleString('vi-VN')}`;
}

export interface StickyOrderSummaryProps {
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  /** VNPay-only CTA area (SCR-20) */
  children?: ReactNode;
  className?: string;
}

/**
 * SCR-20 right panel — sticky order summary (snapshot amounts, not recalculated).
 * Tokens: color-surface-card, radius-lg, shadow-md
 */
export default function StickyOrderSummary({
  totalAmount,
  depositAmount,
  remainingAmount,
  children,
  className = '',
}: StickyOrderSummaryProps) {
  return (
    <aside
      className={`card p-5 lg:sticky lg:top-6 shadow-md rounded-2xl bg-[var(--surface-card,#fff)] ${className}`}
      aria-labelledby="order-summary-heading"
    >
      <h2 id="order-summary-heading" className="heading-sm mb-4">
        Tóm tắt đơn hàng
      </h2>
      <div className="space-y-3 body-md">
        <div className="flex justify-between gap-4">
          <span className="text-charcoal">Tổng tiền</span>
          <span className="font-semibold">{formatVnd(totalAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-charcoal">Tiền cọc (40%)</span>
          <span className="font-semibold text-primary">{formatVnd(depositAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-charcoal">Còn lại (60%)</span>
          <span className="font-semibold">{formatVnd(remainingAmount)}</span>
        </div>
      </div>
      <div className="divider my-4" />
      <p className="body-sm text-charcoal mb-2">Phương thức thanh toán</p>
      <p className="body-md font-semibold mb-4">VNPay</p>
      {children}
    </aside>
  );
}
