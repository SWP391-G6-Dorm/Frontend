import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

// Per component-library.md:
// Default: Height 44px, radius-md (8px), border color-border-base (#E2E8F0)
// Focus: border-color-primary-base (#0F766E), box-shadow 0 0 0 3px color-primary-light (#CCFBF1), NO default outline
// Error: border turns color-danger (#EF4444), error message below in text-caption color-danger
// Accessibility: MUST have associated <label>
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, required, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold mb-1.5 text-[#1E293B]">
            {label} {required && <span className="text-[#EF4444]" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`
              w-full h-11 bg-white text-[#1E293B] text-sm
              border border-[#E2E8F0] rounded-md px-3
              placeholder:text-[#94A3B8]
              transition-all duration-150
              outline-none
              focus:border-[#0F766E] focus:border-[1.5px] focus:shadow-[0_0_0_3px_#CCFBF1]
              disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? '!border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-[#EF4444]" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[#64748B]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
