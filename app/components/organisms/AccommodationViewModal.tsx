'use client';

import { cn } from '@/app/lib/utils';
import type { AccommodationOption } from '@/app/lib/types/accommodation';

interface AccommodationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodation: AccommodationOption | null;
}

export default function AccommodationViewModal({
  isOpen,
  onClose,
  accommodation,
}: AccommodationViewModalProps) {
  if (!isOpen || !accommodation) return null;

  const calculateNights = () => {
    if (!accommodation.check_in_date || !accommodation.check_out_date) return null;
    const checkIn = new Date(accommodation.check_in_date);
    const checkOut = new Date(accommodation.check_out_date);
    const diff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : null;
  };

  const nights = calculateNights();

  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
    shortlisted: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    confirmed: 'bg-green-500/20 text-green-300 border-green-400/30',
    not_selected: 'bg-red-500/20 text-red-300 border-red-400/30',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto',
          'bg-gray-900/95 backdrop-blur-xl',
          'border border-white/20 rounded-2xl',
          'shadow-2xl'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Accommodation Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status & Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full border',
              statusColors[accommodation.status]
            )}>
              {accommodation.status.replace('_', ' ')}
            </span>
            {accommodation.type_name && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {accommodation.type_name}
              </span>
            )}
          </div>

          {/* Name & Location */}
          {accommodation.accommodation_name && (
            <div>
              <h3 className="text-xl font-bold text-white">{accommodation.accommodation_name}</h3>
              {accommodation.location && (
                <p className="text-white/60 mt-1">{accommodation.location}</p>
              )}
            </div>
          )}

          {/* Address */}
          {accommodation.address && (
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-white/50 text-xs mb-1">Address</p>
              <p className="text-white/80 text-sm">{accommodation.address}</p>
            </div>
          )}

          {/* Check-in / Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-white/50 text-xs mb-1">Check-in</p>
              <p className="text-white font-medium">
                {accommodation.check_in_date || '-'}
                {accommodation.check_in_time && ` at ${accommodation.check_in_time}`}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-white/50 text-xs mb-1">Check-out</p>
              <p className="text-white font-medium">
                {accommodation.check_out_date || '-'}
                {accommodation.check_out_time && ` at ${accommodation.check_out_time}`}
              </p>
            </div>
          </div>

          {/* Nights & Rooms */}
          <div className="grid grid-cols-2 gap-3">
            {nights && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                <p className="text-white/50 text-xs mb-1">Duration</p>
                <p className="text-white font-medium">{nights} night{nights > 1 ? 's' : ''}</p>
              </div>
            )}
            {accommodation.num_rooms > 0 && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                <p className="text-white/50 text-xs mb-1">Rooms</p>
                <p className="text-white font-medium">{accommodation.num_rooms} room{accommodation.num_rooms > 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {/* Price */}
          {(accommodation.total_price || accommodation.price_per_night) && (
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-white/50 text-xs mb-1">Price</p>
              <div className="flex items-baseline gap-3">
                {accommodation.total_price && (
                  <p className="text-xl font-bold text-green-400">
                    {accommodation.currency_code} {accommodation.total_price.toLocaleString()}
                  </p>
                )}
                {accommodation.price_per_night && (
                  <p className="text-sm text-white/50">
                    ({accommodation.currency_code} {accommodation.price_per_night.toLocaleString()}/night)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Booking Info */}
          {(accommodation.booking_reference || accommodation.booking_source) && (
            <div className="grid grid-cols-2 gap-3">
              {accommodation.booking_reference && (
                <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                  <p className="text-white/50 text-xs mb-1">Booking Reference</p>
                  <p className="text-white font-medium font-mono">{accommodation.booking_reference}</p>
                </div>
              )}
              {accommodation.booking_source && (
                <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                  <p className="text-white/50 text-xs mb-1">Booked via</p>
                  <p className="text-white font-medium">{accommodation.booking_source}</p>
                </div>
              )}
            </div>
          )}

          {/* Travelers */}
          {accommodation.travelers && accommodation.travelers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Travelers</h3>
              <div className="flex flex-wrap gap-2">
                {accommodation.travelers.map(t => (
                  <span
                    key={t.traveler_id}
                    className="px-2 py-1 text-sm bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-lg"
                  >
                    {t.traveler_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {accommodation.notes && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 p-3">
                {accommodation.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}