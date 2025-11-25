import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const baseStyles =
      'w-full rounded-lg px-4 py-2.5 text-base font-normal text-neutral-800 placeholder:text-neutral-400 transition-all duration-250 ease-in-out focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      default:
        'bg-white border border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-primary-200',
      glass:
        'bg-white/95 border border-white/40 focus:border-primary-400 focus:ring-primary-300/50 shadow-lg',
    };

    const errorStyles = error
      ? 'border-error-main focus:border-error-main focus:ring-error-light/30'
      : '';

    const iconPadding = {
      left: leftIcon ? 'pl-11' : '',
      right: rightIcon ? 'pr-11' : '',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-white mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseStyles,
              variants[variant],
              errorStyles,
              iconPadding.left,
              iconPadding.right,
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-400 animate-slide-down font-medium">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;