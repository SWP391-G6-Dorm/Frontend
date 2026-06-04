import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary-text' | 'pill-rausch';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses = {
  primary: `
    bg-[#ff385c] text-white
    hover:bg-[#e00b41]
    disabled:bg-[#ffd1da] disabled:text-white disabled:cursor-not-allowed
    text-[16px] font-medium leading-[1.25]
    rounded-[8px] border-none
  `,
  secondary: `
    bg-white text-[#222222] border border-[#222222]
    hover:bg-[#f7f7f7]
    disabled:border-[#dddddd] disabled:text-[#dddddd] disabled:bg-white disabled:cursor-not-allowed
    text-[16px] font-medium leading-[1.25]
    rounded-[8px]
  `,
  'tertiary-text': `
    bg-transparent text-[#222222]
    hover:underline underline-offset-2
    disabled:text-[#dddddd] disabled:cursor-not-allowed
    text-[16px] font-medium leading-[1.25]
    p-0
  `,
  'pill-rausch': `
    bg-[#ff385c] text-white
    hover:bg-[#e00b41]
    disabled:bg-[#ffd1da] disabled:text-white disabled:cursor-not-allowed
    text-[14px] font-medium leading-[1.29]
    rounded-full px-[20px] py-[10px]
  `,
};

const sizeClasses = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6',
  lg: 'h-14 px-8 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  // Pill and tertiary don't use standard height/padding classes
  const appliedSizeClass = (variant === 'pill-rausch' || variant === 'tertiary-text') ? '' : sizeClasses[size];

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        transition-colors duration-200
        focus-ring
        ${variantClasses[variant]}
        ${appliedSizeClass}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
