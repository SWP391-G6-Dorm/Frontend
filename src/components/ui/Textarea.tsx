import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

// Per component-library.md:
// Height > 44px (e.g. min-height: 96px), radius-md
// Focus: border-color-primary-base, box-shadow 0 0 0 3px color-primary-light
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, required, ...props }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-semibold mb-1.5 text-[#1E293B]">
            {label} {required && <span className="text-[#EF4444]" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            required={required}
            className={`
              w-full min-h-[96px] bg-white text-[#1E293B] text-sm
              border border-[#E2E8F0] rounded-md p-3 resize-y
              placeholder:text-[#94A3B8]
              transition-all duration-150
              outline-none
              focus:border-[#0F766E] focus:border-[1.5px] focus:shadow-[0_0_0_3px_#CCFBF1]
              disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed
              ${error ? '!border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs font-medium text-[#EF4444]" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-xs text-[#64748B]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
