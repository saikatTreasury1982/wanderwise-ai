'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatDate } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

interface DaySelectProps {
  value: number;
  totalDays: number;
  tripStartDate: string; // yyyy-mm-dd
  dateFormat?: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onChange: (day: number) => void;
  label?: string;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export default function DaySelect({ value, totalDays, tripStartDate, dateFormat = 'DD Mmm YYYY', onChange }: DaySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const dayDate = (d: number) => formatDate(addDays(tripStartDate, d - 1), dateFormat);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 min-w-[150px] px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors"
      >
        <span>Day {value} · <span className="text-white/60">{dayDate(value)}</span></span>
        <ChevronDown className={cn('w-4 h-4 text-white/50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto custom-scrollbar bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => { onChange(d); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between',
                d === value ? 'bg-primary-500/20 text-white' : 'text-white/80 hover:bg-white/10'
              )}
            >
              <span>Day {d}</span>
              <span className="text-white/50 text-xs">{dayDate(d)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}