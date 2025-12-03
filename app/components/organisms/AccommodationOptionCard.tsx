'use client';

import { cn } from '@/app/lib/utils';
import type { AccommodationOption } from '@/app/lib/types/accommodation';

interface AccommodationOptionCardProps {
  accommodation: AccommodationOption;
  onEdit: (accommodation: AccommodationOption) => void;
  onCopy: (accommodation: AccommodationOption) => void;
  onDelete: (accommodationId: number) => void;
  onStatusChange: (accommodationId: number, status: AccommodationOption['status']) => void;
}

export default function AccommodationOptionCard({
  accommodation,
  onEdit,
  onCopy,
  onDelete,
  onStatusChange,
}: AccommodationOptionCardProps) {
  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
    shortlisted: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    confirmed: 'bg-green-500/20 text-green-300 border-green-400/30',
    not_selected: 'bg-red-500/20 text-red-300 border-red-400/30',
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return date;
  };

  const calculateNights = () => {
    if (!accommodation.check_in_date || !accommodation.check_out_date) return null;
    const checkIn = new Date(accommodation.check_in_date);
    const checkOut = new Date(accommodation.check_out_date);
    const diff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : null;
  };

  const nights = calculateNights();

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
          {/* Status & Type badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', statusColors[accommodation.status])}>
              {accommodation.status.replace('_', ' ')}
            </span>
            {accommodation.type_name && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {accommodation.type_name}
              </span>
            )}
          </div>

          {/* Accommodation Name */}
          {accommodation.accommodation_name && (
            <div className="text-base font-semibold text-white mb-1">
              {accommodation.accommodation_name}
            </div>
          )}

          {/* Location */}
          {accommodation.location && (
            <div className="text-sm text-white/70 mb-2">
              {accommodation.location}
            </div>
          )}

          {/* Dates & Details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60 mb-2">
            {accommodation.check_in_date && (
              <span>
                {formatDate(accommodation.check_in_date)}
                {accommodation.check_in_time && ` ${accommodation.check_in_time}`}
              </span>
            )}
            {accommodation.check_in_date && accommodation.check_out_date && (
              <span>→</span>
            )}
            {accommodation.check_out_date && (
              <span>
                {formatDate(accommodation.check_out_date)}
                {accommodation.check_out_time && ` ${accommodation.check_out_time}`}
              </span>
            )}
            {nights && (
              <span className="text-purple-300">
                {nights} night{nights > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Rooms */}
          {accommodation.num_rooms && accommodation.num_rooms > 0 && (
            <div className="text-sm text-white/60 mb-2">
              {accommodation.num_rooms} room{accommodation.num_rooms > 1 ? 's' : ''}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            {accommodation.total_price && (
              <div className="text-lg font-bold text-purple-300">
                {accommodation.currency_code} {accommodation.total_price.toLocaleString()}
              </div>
            )}
            {accommodation.price_per_night && (
              <div className="text-sm text-white/50">
                ({accommodation.currency_code} {accommodation.price_per_night.toLocaleString()}/night)
              </div>
            )}
          </div>

          {/* Travelers count */}
          {accommodation.travelers && accommodation.travelers.length > 0 && (
            <div className="mt-1 text-xs text-white/50">
              {accommodation.travelers.length} traveler{accommodation.travelers.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          {/* Confirm */}
          {accommodation.status !== 'confirmed' && (
            <button
              onClick={() => onStatusChange(accommodation.accommodation_option_id, 'confirmed')}
              className="p-2 rounded-full text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-colors"
              title="Confirm this accommodation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}

          {/* Shortlist */}
          {accommodation.status === 'draft' && (
            <button
              onClick={() => onStatusChange(accommodation.accommodation_option_id, 'shortlisted')}
              className="p-2 rounded-full text-white/70 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              title="Shortlist this accommodation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}

          {/* Revert to Draft */}
          {(accommodation.status === 'shortlisted' || accommodation.status === 'confirmed' || accommodation.status === 'not_selected') && (
            <button
              onClick={() => onStatusChange(accommodation.accommodation_option_id, 'draft')}
              className="p-2 rounded-full text-white/70 hover:text-gray-400 hover:bg-gray-500/10 transition-colors"
              title="Revert to draft"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => onEdit(accommodation)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit accommodation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Copy */}
          <button
            onClick={() => onCopy(accommodation)}
            className="p-2 rounded-full text-white/70 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Copy accommodation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(accommodation.accommodation_option_id)}
            className="p-2 rounded-full text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete accommodation"
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