'use client';

import { cn } from '@/app/lib/utils';

interface ToggleSliderProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
  className?: string;
}

export default function ToggleSlider({
  checked,
  onChange,
  leftLabel = 'Off',
  rightLabel = 'On',
  disabled = false,
  className,
}: ToggleSliderProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center gap-3 px-1 py-1 rounded-full transition-all duration-200',
        'bg-white/10 backdrop-blur-sm border border-white/20',
        !disabled && 'hover:bg-white/15 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Left Label */}
      <span
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 z-10 relative',
          !checked
            ? 'text-white'
            : 'text-white/40'
        )}
      >
        {leftLabel}
      </span>

      {/* Right Label */}
      <span
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 z-10 relative',
          checked
            ? 'text-white'
            : 'text-white/40'
        )}
      >
        {rightLabel}
      </span>

      {/* Slider Background - Active State */}
      <div
        className={cn(
          'absolute inset-1 rounded-full transition-all duration-300 shadow-lg',
          checked
            ? 'bg-green-500/70 border border-green-400/50'
            : 'bg-red-500/70 border border-red-400/50'
        )}
        style={{
          left: checked ? '50%' : '4px',
          right: checked ? '4px' : '50%',
        }}
      />
    </button>
  );
}