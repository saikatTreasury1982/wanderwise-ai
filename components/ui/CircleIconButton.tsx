'use client';

import { cn } from '@/lib/utils';

interface CircleIconButtonProps {
  type?: 'button' | 'submit';
  variant?: 'default' | 'primary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  icon: React.ReactNode;
  className?: string;
}

export default function CircleIconButton({
  type = 'button',
  variant = 'default',
  onClick,
  disabled = false,
  isLoading = false,
  title,
  icon,
  className,
}: CircleIconButtonProps) {
  const variants = {
    default: 'bg-white/10 border-white/20 text-white/70 hover:text-white hover:bg-white/20 hover:border-white/30',
    primary: 'bg-purple-500/20 border-purple-400/30 text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 hover:text-purple-200',
    danger: 'bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 hover:border-red-400/50 hover:text-red-200',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={cn(
        'w-12 h-12 rounded-full backdrop-blur-sm border',
        'flex items-center justify-center',
        'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
    </button>
  );
}