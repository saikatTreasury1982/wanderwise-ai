'use client';

import { cn } from '@/app/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export default function FloatingActionButton({
  onClick,
  className,
  ariaLabel = 'Add new',
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-14 h-14 rounded-full',
        'bg-gradient-to-r from-purple-600 to-purple-700',
        'hover:from-purple-500 hover:to-purple-600',
        'shadow-lg shadow-purple-500/30',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent',
        className
      )}
    >
      <svg
        className="w-7 h-7 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  );
}