'use client';

import { cn } from '@/app/lib/utils';

interface SettingsRowProps {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
  valueClassName?: string;
  showDivider?: boolean;
  className?: string;
}

export default function SettingsRow({
  label,
  value,
  onClick,
  valueClassName,
  showDivider = true,
  className,
}: SettingsRowProps) {
  const base = cn(
    'w-full flex justify-between items-center py-2 text-left',
    showDivider && 'border-b border-white/10',
    className
  );

  const content = (
    <>
      <span className="text-white/70 text-sm sm:text-base">{label}</span>
      <span className={cn('text-white font-medium text-sm sm:text-base flex items-center gap-2', valueClassName)}>
        {value}
        {onClick && (
          <svg className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </span>
    </>
  );

  if (!onClick) {
    return <div className={base}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={cn(base, 'hover:bg-white/5 transition-colors')}>
      {content}
    </button>
  );
}