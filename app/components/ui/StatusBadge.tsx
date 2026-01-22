interface StatusBadgeProps {
  status: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const statusConfig = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-300',
      borderColor: 'border-gray-400/30',
    },
    shortlisted: {
      label: 'Shortlisted',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-300',
      borderColor: 'border-yellow-400/30',
    },
    confirmed: {
      label: 'Confirmed',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-300',
      borderColor: 'border-green-400/30',
    },
    not_selected: {
      label: 'Not Selected',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-300',
      borderColor: 'border-red-400/30',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
        font-medium
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.textColor.replace('text-', 'bg-')}`} />
      {config.label}
    </span>
  );
}