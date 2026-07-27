'use client';

import { cn } from '@/app/lib/utils';

interface NoteFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function NoteField({
  value,
  onChange,
  placeholder = 'One point per line',
  rows = 3,
  className,
}: NoteFieldProps) {
  const lines = value.split('\n').filter((l) => l.trim());

  return (
    <div className={className}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400 transition-colors resize-none"
      />
      {lines.length > 0 && (
        <ul className="mt-2 space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/60">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}