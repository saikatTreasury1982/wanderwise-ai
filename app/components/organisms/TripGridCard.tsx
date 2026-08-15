'use client';

import { cn, formatDate } from '@/app/lib/utils';
import type { TripListItem, TripStatus } from '@/app/lib/types/trip';

interface Props {
  trip: TripListItem;
  statuses: TripStatus[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  selected: boolean;
  onSelect: (tripId: number) => void;
}

const statusStyles: Record<number, string> = {
  1: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  2: 'bg-green-500/20 text-green-300 border-green-500/30',
  3: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  4: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function TripGridCard({ trip, statuses, dateFormat, selected, onSelect }: Props) {
  const statusLabel = statuses.find(s => s.status_code === trip.status_code)?.status_name || 'Unknown';
  const statusStyle = statusStyles[trip.status_code] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const destination = trip.first_city ? `${trip.first_city}, ${trip.first_country}` : (trip.first_country || '');

  return (
    <button
      type="button"
      onClick={() => onSelect(trip.trip_id)}
      className={cn(
        'text-left bg-white/10 backdrop-blur-xl rounded-xl p-3.5 transition-all duration-200',
        'hover:bg-white/15',
        selected ? 'border-2 border-primary-400' : 'border border-white/20 hover:border-white/30'
      )}
    >
      <div className="mb-2">
        <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full border', statusStyle)}>
          {statusLabel}
        </span>
      </div>
      <div className="text-sm font-semibold text-white truncate">{trip.trip_name}</div>
      {destination && <div className="text-xs text-white/60 truncate mt-0.5">{destination}</div>}
      <div className="text-xs text-white/40 mt-1.5">{formatDate(trip.start_date, dateFormat)}</div>
    </button>
  );
}