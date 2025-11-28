'use client';

import { cn } from '@/lib/utils';
import type { FlightOption } from '@/lib/types/flight';

interface FlightOptionCardProps {
  flight: FlightOption;
  onEdit: (flight: FlightOption) => void;
  onCopy: (flight: FlightOption) => void;
  onDelete: (flightId: number) => void;
  onStatusChange: (flightId: number, status: FlightOption['status']) => void;
}

export default function FlightOptionCard({
  flight,
  onEdit,
  onCopy,
  onDelete,
  onStatusChange,
}: FlightOptionCardProps) {
  const leg = flight.legs?.[0];
  
  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
    shortlisted: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    confirmed: 'bg-green-500/20 text-green-300 border-green-400/30',
    not_selected: 'bg-red-500/20 text-red-300 border-red-400/30',
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const routeDisplay = flight.legs?.map(l => l.departure_airport).join(' → ') + 
    (flight.legs?.length ? ` → ${flight.legs[flight.legs.length - 1].arrival_airport}` : '');

  const totalDuration = flight.legs?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
  const totalStops = flight.legs?.reduce((sum, l) => sum + (l.stops_count || 0), 0) || 0;

  return (
    <div
      className={cn(
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-xl p-4',
        'transition-all duration-200',
        'hover:bg-white/15 hover:border-white/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Route */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-white truncate">
              {routeDisplay}
            </span>
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', statusColors[flight.status])}>
              {flight.status.replace('_', ' ')}
            </span>
          </div>

          {/* Flight details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
            {leg?.departure_date && (
              <span>{leg.departure_date}</span>
            )}
            {leg?.departure_time && (
              <span>{leg.departure_time}</span>
            )}
            {totalDuration > 0 && (
              <span>{formatDuration(totalDuration)}</span>
            )}
            <span>{totalStops === 0 ? 'Direct' : `${totalStops} stop${totalStops > 1 ? 's' : ''}`}</span>
            {leg?.airline && (
              <span>{leg.airline}</span>
            )}
          </div>

          {/* Price */}
          {flight.total_price && (
            <div className="mt-2 text-lg font-bold text-purple-300">
              {flight.currency_code} {flight.total_price.toLocaleString()}
            </div>
          )}

          {/* Travelers count */}
          {flight.travelers && flight.travelers.length > 0 && (
            <div className="mt-1 text-xs text-white/50">
              {flight.travelers.length} traveler{flight.travelers.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          {/* Status actions */}
          {flight.status !== 'confirmed' && (
            <button
              onClick={() => onStatusChange(flight.flight_option_id, 'confirmed')}
              className="p-2 rounded-full text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-colors"
              title="Confirm this flight"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}

          {flight.status === 'draft' && (
            <button
              onClick={() => onStatusChange(flight.flight_option_id, 'shortlisted')}
              className="p-2 rounded-full text-white/70 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              title="Shortlist this flight"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => onEdit(flight)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit flight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Copy */}
          <button
            onClick={() => onCopy(flight)}
            className="p-2 rounded-full text-white/70 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Copy flight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(flight.flight_option_id)}
            className="p-2 rounded-full text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete flight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}