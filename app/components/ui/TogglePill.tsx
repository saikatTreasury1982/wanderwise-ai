'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';

export interface TogglePillOption<T extends string> {
  value: T;
  label: string;
}

interface TogglePillProps<T extends string> {
  value: T;
  options: TogglePillOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export default function TogglePill<T extends string>({
  value,
  options,
  onChange,
  className,
}: TogglePillProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const activeIndex = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const btn = btnRefs.current[activeIndex];
    const container = containerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setIndicator({ left: bRect.left - cRect.left, width: bRect.width });
    }
  }, [activeIndex, options.length]);

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex gap-1 p-1 rounded-full bg-white/5 border border-white/15', className)}
    >
      {/* sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-primary-500/30 border border-primary-400 transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => { btnRefs.current[i] = el; }}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap',
              active ? 'text-white' : 'text-white/60 hover:text-white'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}