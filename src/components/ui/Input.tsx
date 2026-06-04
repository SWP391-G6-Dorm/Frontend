import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, required, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-caption text-[#6a6a6a] mb-1.5">
            {label} {required && <span className="text-[#c13515]">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`
              w-full h-14 bg-white text-[#222222] text-body-md
              border border-[#dddddd] rounded-sm px-[12px]
              focus:outline-none focus:border-2 focus:border-[#222222] focus:px-[11px]
              disabled:bg-[#f7f7f7] disabled:text-[#929292] disabled:cursor-not-allowed
              placeholder:text-[#929292]
              transition-all duration-150
              ${icon ? 'pl-[38px] focus:pl-[37px]' : ''}
              ${error ? '!border-[#c13515] !focus:border-[#c13515]' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <p className={`mt-1.5 text-caption-sm ${error ? 'text-[#c13515]' : 'text-[#6a6a6a]'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
