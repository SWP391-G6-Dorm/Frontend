import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ 
  children, 
  className = '', 
  elevated = false, 
  padding = 'lg',
  hoverable = false 
}: CardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-md
        border border-[#dddddd]
        ${elevated ? 'shadow-card-hover border-transparent' : ''}
        ${hoverable ? 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
