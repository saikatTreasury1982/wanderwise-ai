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
    <>
      <style jsx>{`
        .modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 12px 0;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .modal-scroll::-webkit-scrollbar-button {
          display: none !important;
          height: 0 !important;
          width: 0 !important;
        }
        @media (max-width: 640px) {
          .modal-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className={cn(
            'modal-scroll',
            'relative z-10 w-full max-w-lg md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto',
            'bg-gray-900/95 backdrop-blur-xl',
            'border border-white/20 rounded-lg',
            'shadow-2xl'
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4 sm:p-5 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Accommodation Details</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            {/* Status & Type */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full border',
                statusColors[accommodation.status]
              )}>
                {accommodation.status.replace('_', ' ')}
              </span>
              {accommodation.type_name && (
                <span className="px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {accommodation.type_name}
                </span>
              )}
            </div>

            {/* Name & Location */}
            {accommodation.accommodation_name && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{accommodation.accommodation_name}</h3>
                {accommodation.location && (
                  <p className="text-white/60 mt-1.5 text-sm sm:text-base">{accommodation.location}</p>
                )}
              </div>
            )}

            {/* Address */}
            {accommodation.address && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                <p className="text-white/50 text-xs sm:text-sm mb-1.5">Address</p>
                <p className="text-white/80 text-sm sm:text-base">{accommodation.address}</p>
              </div>
            )}

            {/* Check-in / Check-out - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                <p className="text-white/50 text-xs sm:text-sm mb-1.5">Check-in</p>
                <p className="text-white font-medium text-sm sm:text-base">
                  {accommodation.check_in_date || '-'}
                </p>
                {accommodation.check_in_time && (
                  <p className="text-white/70 text-xs sm:text-sm mt-0.5">at {accommodation.check_in_time}</p>
                )}
              </div>
              <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                <p className="text-white/50 text-xs sm:text-sm mb-1.5">Check-out</p>
                <p className="text-white font-medium text-sm sm:text-base">
                  {accommodation.check_out_date || '-'}
                </p>
                {accommodation.check_out_time && (
                  <p className="text-white/70 text-xs sm:text-sm mt-0.5">at {accommodation.check_out_time}</p>
                )}
              </div>
            </div>

            {/* Nights & Rooms - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nights && (
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                  <p className="text-white/50 text-xs sm:text-sm mb-1.5">Duration</p>
                  <p className="text-white font-medium text-sm sm:text-base">{nights} night{nights > 1 ? 's' : ''}</p>
                </div>
              )}
              {accommodation.num_rooms > 0 && (
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                  <p className="text-white/50 text-xs sm:text-sm mb-1.5">Rooms</p>
                  <p className="text-white font-medium text-sm sm:text-base">{accommodation.num_rooms} room{accommodation.num_rooms > 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            {/* Price */}
            {(accommodation.total_price || accommodation.price_per_night) && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                <p className="text-white/50 text-xs sm:text-sm mb-1.5">Price</p>
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                  {accommodation.total_price && (
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
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

            {/* Booking Info - Stack on mobile */}
            {(accommodation.booking_reference || accommodation.booking_source) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accommodation.booking_reference && (
                  <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <p className="text-white/50 text-xs sm:text-sm mb-1.5">Booking Reference</p>
                    <p className="text-white font-medium font-mono text-sm sm:text-base">{accommodation.booking_reference}</p>
                  </div>
                )}
                {accommodation.booking_source && (
                  <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <p className="text-white/50 text-xs sm:text-sm mb-1.5">Booked via</p>
                    <p className="text-white font-medium text-sm sm:text-base">{accommodation.booking_source}</p>
                  </div>
                )}
              </div>
            )}

            {/* Travelers */}
            {accommodation.travelers && accommodation.travelers.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">Travelers</h3>
                <div className="flex flex-wrap gap-2">
                  {accommodation.travelers.map(t => (
                    <span
                      key={t.traveler_id}
                      className="px-2.5 py-1.5 text-sm bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-lg"
                    >
                      {t.traveler_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes - Display as bullet points */}
            {accommodation.notes && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">Notes</h3>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                  <ul className="list-disc list-inside space-y-1.5">
                    {accommodation.notes.split('\n').filter(line => line.trim()).map((line, i) => (
                      <li key={i} className="text-white/80 text-sm sm:text-base">
                        {line.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}