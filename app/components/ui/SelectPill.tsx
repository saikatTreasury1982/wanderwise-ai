'use client';

import { cn } from '@/app/lib/utils';

export interface SelectPillOption {
  value: string;
  label: string;
}

interface SelectPillProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectPillOption[];
  /** Optional leading option, e.g. { value: 'all', label: 'All Years' }. */
  placeholderOption?: SelectPillOption;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

export default function SelectPill({
  value,
  onChange,
  options,
  placeholderOption,
  ariaLabel,
  className,
  disabled = false,
}: SelectPillProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'px-4 py-1 rounded-full',
        'bg-white/10 backdrop-blur-sm border border-white/20',
        'text-white/90 hover:bg-white/15 transition-all cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        '[&>option]:bg-gray-800 [&>option]:text-white',
        className
      )}
    >
      {placeholderOption && (
        <option value={placeholderOption.value}>{placeholderOption.label}</option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
