'use client';

import { cn, formatDateRange } from '@/lib/utils';

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
}

interface TripCardProps {
  trip: Trip;
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: number) => void;
  onStartPlanning: (tripId: number) => void;
  onCardClick: (tripId: number) => void;
}

const statusConfig: Record<number, { label: string; className: string }> = {
  1: {
    label: 'Draft',
    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  2: {
    label: 'Active',
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  3: {
    label: 'Completed',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  4: {
    label: 'Cancelled',
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

export default function TripCard({
  trip,
  dateFormat,
  onEdit,
  onDelete,
  onStartPlanning,
  onCardClick,
}: TripCardProps) {
  const status = statusConfig[trip.status_code];
  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      onClick={() => onCardClick(trip.trip_id)}
      className={cn(
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-xl p-4',
        'transition-all duration-200',
        'hover:bg-white/15 hover:border-white/30',
        'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white truncate">
              {trip.trip_name}
            </h3>
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full border',
                status.className
              )}
            >
              {status.label}
            </span>
          </div>

          {destination && (
            <p className="text-white/70 text-sm mb-1 truncate">{destination}</p>
          )}

          <p className="text-white/60 text-sm">
            {formatDateRange(trip.start_date, trip.end_date, dateFormat)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(trip); }}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Edit trip"
            title="Edit trip"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          {trip.status_code === 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onStartPlanning(trip.trip_id); }}
                className="p-2 rounded-lg text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                aria-label="Start planning"
                title="Start planning"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(trip.trip_id); }}
                className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label="Delete trip"
                title="Delete trip"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}