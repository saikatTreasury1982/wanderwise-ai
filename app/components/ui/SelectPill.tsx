'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import type { LucideIcon } from 'lucide-react';

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
  icon?: LucideIcon;
}

export default function SelectPill({
  value,
  onChange,
  options,
  placeholderOption,
  ariaLabel,
  className,
  disabled = false,
  icon: Icon,
}: SelectPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // full option list (placeholder first if provided)
  const allOptions = placeholderOption ? [placeholderOption, ...options] : options;
  const selected = allOptions.find(o => o.value === value) || placeholderOption || allOptions[0];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className={cn('relative inline-block', className)} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded-full py-2 pl-4 pr-3',
          'bg-white/[0.06] backdrop-blur-sm border border-white/15',
          'text-sm text-white/90 hover:bg-white/10 transition-all cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary-400',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {Icon && <Icon className="w-4 h-4 text-primary-300 shrink-0" />}
        <span className="truncate max-w-[140px]">{selected?.label}</span>
        <svg className={cn('w-4 h-4 text-white/50 shrink-0 transition-transform', open && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute left-0 top-full mt-1 z-50 min-w-full w-max max-w-[220px] max-h-60 overflow-y-auto custom-scrollbar bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-1"
          >
            {allOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  opt.value === value ? 'bg-primary-500/20 text-white' : 'text-white/80 hover:bg-white/10'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}