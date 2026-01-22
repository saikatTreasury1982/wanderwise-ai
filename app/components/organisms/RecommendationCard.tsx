import StatusBadge from '@/app/components/ui/StatusBadge';
import CircleIconButton from '@/app/components/ui/CircleIconButton';

interface RecommendationCardProps {
  type: 'flight' | 'accommodation' | 'packing' | 'itinerary';
  title: string;
  subtitle?: string;
  details: { label: string; value: string }[];
  status?: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  onAdd?: () => void;
  sourceTripName?: string;
}

export default function RecommendationCard({
  type,
  title,
  subtitle,
  details,
  status,
  onAdd,
  sourceTripName,
}: RecommendationCardProps) {
  const typeIcons = {
    flight: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    accommodation: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    packing: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    itinerary: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  };

  return (
    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-purple-300 mt-0.5 flex-shrink-0">
            {typeIcons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium mb-1 break-words">{title}</h4>
            {subtitle && (
              <p className="text-white/60 text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {status && (
          <div className="flex-shrink-0 ml-2">
            <StatusBadge status={status} size="sm" />
          </div>
        )}
      </div>

      {/* Details */}
      {details.length > 0 && (
        <div className="space-y-2 mb-3">
          {details.map((detail, index) => (
            <div key={index} className="flex items-start justify-between text-sm gap-2">
              <span className="text-white/50 flex-shrink-0">{detail.label}</span>
              <span className="text-white/90 font-medium text-right break-words">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        {sourceTripName && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-purple-300 truncate">From: {sourceTripName}</span>
          </div>
        )}
        {onAdd && (
          <div className="ml-auto">
            <CircleIconButton
              variant="primary"
              onClick={onAdd}
              title="Add to trip"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}