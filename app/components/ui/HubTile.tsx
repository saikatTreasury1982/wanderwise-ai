'use client';

import { cn } from '@/app/lib/utils';

interface HubTileProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  countLabel?: string;
  subtitle?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export default function HubTile({
  title,
  icon,
  count,
  countLabel,
  subtitle,
  onClick,
  className,
}: HubTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col',
        'w-full aspect-square',
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-2xl p-4',
        'transition-all duration-200',
        'hover:bg-white/15 hover:border-white/30 hover:scale-105',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent',
        'text-left',
        className
      )}
    >
      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <div 
          className="absolute bottom-3 right-3 min-w-8 h-8 px-2 flex items-center justify-center rounded-full bg-purple-500/80 text-white text-xs font-semibold"
          title={countLabel || 'Total'}
        >
          {count}
        </div>
      )}

      {/* Header: Icon + Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-purple-400 shrink-0">
          {icon}
        </div>
        <span className="text-white font-semibold text-base">
          {title}
        </span>
      </div>

      {/* Subtitle/Content */}
      {subtitle && (
        <div className="text-sm text-white/70 space-y-1">
          {subtitle}
        </div>
      )}
    </button>
  );
}