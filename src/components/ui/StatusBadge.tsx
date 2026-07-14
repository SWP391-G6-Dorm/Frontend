import React from 'react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface StatusBadgeProps {
  status: string;
  variant: StatusVariant;
  className?: string;
}

// Per component-library.md:
// Visuals: radius-full, padding 4px 12px, text-caption uppercase tracking-wide.
// Colors: ALWAYS uses a 10% opacity background of the semantic color, with 100% opacity text.
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant, className = '' }) => {
  const variantClasses = {
    success: 'bg-[#10B981]/10 text-[#10B981]',
    warning: 'bg-[#F59E0B]/10 text-[#B45309]', // Darkened warning text for contrast
    danger: 'bg-[#EF4444]/10 text-[#EF4444]',
    info: 'bg-[#3B82F6]/10 text-[#2563EB]',
    neutral: 'bg-[#64748B]/10 text-[#64748B]',
    primary: 'bg-[#0F766E]/10 text-[#0F766E]'
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide whitespace-nowrap ${variantClasses[variant]} ${className}`}>
      {status}
    </span>
  );
};
