import { SelectHTMLAttributes, ReactNode, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, icon, options, className = '', id, required, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold mb-1.5 text-[#1E293B]">
            {label} {required && <span className="text-[#EF4444]" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={`
              w-full h-11 bg-white text-[#1E293B] text-sm
              border border-[#E2E8F0] rounded-md px-3 appearance-none
              transition-all duration-150
              outline-none
              focus:border-[#0F766E] focus:border-[1.5px] focus:shadow-[0_0_0_3px_#CCFBF1]
              disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed
              bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
              bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.25em_1.25em]
              ${icon ? 'pl-10' : ''}
              ${error ? '!border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-hint` : undefined}
            {...props}
          >
            <option value="" disabled hidden>Select {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs font-medium text-[#EF4444]" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-[#64748B]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
