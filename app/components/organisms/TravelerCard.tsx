'use client';

import { cn } from '@/app/lib/utils';

interface Traveler {
  traveler_id: number;
  trip_id: number;
  traveler_name: string;
  traveler_email: string | null;
  relationship: string | null;
  is_primary: number;
  is_cost_sharer: number;
  traveler_currency: string | null;
  is_active: number;
}

interface Relationship {
  relationship_code: string;
  relationship_name: string;
}

interface TravelerCardProps {
  traveler: Traveler;
  relationships: Relationship[];
  onEdit: (traveler: Traveler) => void;
  onCopy: (traveler: Traveler) => void;
  onDelete: (travelerId: number) => void;
}

export default function TravelerCard({
  traveler,
  relationships,
  onEdit,
  onCopy,
  onDelete,
}: TravelerCardProps) {
  const isSelf = traveler.relationship === 'self';

  return (
    <div
      className={cn(
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-xl p-4',
        'transition-all duration-200',
        'hover:bg-white/15 hover:border-white/30',
        !traveler.is_active && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white truncate">
              {traveler.traveler_name}
            </h3>
            {traveler.is_primary === 1 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Primary
              </span>
            )}
            {!traveler.is_active && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300 border border-gray-400/30">
                Inactive
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
            {traveler.relationship && (
              <span>
                {relationships.find(r => r.relationship_code === traveler.relationship)?.relationship_name || traveler.relationship}
              </span>
            )}
            {traveler.traveler_email && (
              <span className="truncate">{traveler.traveler_email}</span>
            )}
            {traveler.traveler_currency && (
              <span>{traveler.traveler_currency}</span>
            )}
            {traveler.is_cost_sharer === 1 && (
              <span className="text-green-400">Cost Sharer</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Edit button */}
          <button
            onClick={() => onEdit(traveler)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit traveler"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Copy button */}
          <button
            onClick={() => onCopy(traveler)}
            className="p-2 rounded-lg text-white/70 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Copy to form"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete button - hidden for self */}
          {!isSelf && (
            <button
              onClick={() => onDelete(traveler.traveler_id)}
              className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete traveler"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}