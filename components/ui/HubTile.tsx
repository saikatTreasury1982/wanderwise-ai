'use client';

import { cn } from '@/lib/utils';

interface HubTileProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  onClick: () => void;
  className?: string;
}

export default function HubTile({
  title,
  icon,
  count,
  onClick,
  className,
}: HubTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-full aspect-square',
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-2xl p-4',
        'transition-all duration-200',
        'hover:bg-white/15 hover:border-white/30 hover:scale-105',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent',
        className
      )}
    >
      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <div className="absolute top-3 right-3 min-w-6 h-6 px-2 flex items-center justify-center rounded-full bg-purple-500/80 text-white text-xs font-semibold">
          {count}
        </div>
      )}

      {/* Icon */}
      <div className="text-purple-400 mb-3">
        {icon}
      </div>

      {/* Title */}
      <span className="text-white/90 text-sm font-medium text-center">
        {title}
      </span>
    </button>
  );
}