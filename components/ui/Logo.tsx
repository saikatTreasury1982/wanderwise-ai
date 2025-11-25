import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export default function Logo({
  size = 'md',
  showTagline = false,
  className,
  ...props
}: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div
      className={cn('flex flex-col items-center gap-1', className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg
            className={cn('text-primary-500', sizes[size])}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M15 9L9 15M9 9L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex items-baseline">
          <span
            className={cn(
              'font-bold text-white',
              sizes[size]
            )}
          >
            Wander
          </span>
          <span
            className={cn(
              'font-bold text-primary-500',
              sizes[size]
            )}
          >
            Wise
          </span>
        </div>
      </div>

      {showTagline && (
        <p
          className={cn(
            'font-medium text-white/70 tracking-wide',
            taglineSizes[size]
          )}
        >
          Plan Smarter, Travel Better
        </p>
      )}
    </div>
  );
}