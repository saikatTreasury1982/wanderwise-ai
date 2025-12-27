'use client';

import { cn } from '@/app/lib/utils';
import type { FlightOption } from '@/app/lib/types/flight';

interface FlightViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightOption | null;
  dateFormat?: string;
}

export default function FlightViewModal({
  isOpen,
  onClose,
  flight,
}: FlightViewModalProps) {
  if (!isOpen || !flight) return null;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStopsLabel = (stops: number) => {
    if (stops === 0) return 'Direct';
    if (stops === 1) return '1 stop';
    return `${stops} stops`;
  };

  const renderLeg = (leg: any, index: number, total: number) => (
    <div key={index} className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
      {total > 1 && (
        <p className="text-xs text-white/50 mb-2">Leg {index + 1}</p>
      )}
      <div className="flex items-center gap-2 sm:gap-3 mb-3">
        <span className="text-base sm:text-lg font-bold text-white">{leg.departure_airport}</span>
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span className="text-base sm:text-lg font-bold text-white">{leg.arrival_airport}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-white/50 text-xs mb-1">Departure</p>
          <p className="text-white text-sm sm:text-base">{leg.departure_date}</p>
          {leg.departure_time && <p className="text-white/70 text-xs sm:text-sm">at {leg.departure_time}</p>}
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">Arrival</p>
          <p className="text-white text-sm sm:text-base">{leg.arrival_date}</p>
          {leg.arrival_time && <p className="text-white/70 text-xs sm:text-sm">at {leg.arrival_time}</p>}
        </div>
        {(leg.airline || leg.flight_number) && (
          <div>
            <p className="text-white/50 text-xs mb-1">Flight</p>
            <p className="text-white text-sm sm:text-base">{[leg.airline, leg.flight_number].filter(Boolean).join(' ')}</p>
          </div>
        )}
        <div>
          <p className="text-white/50 text-xs mb-1">Duration / Stops</p>
          <p className="text-white text-sm sm:text-base">
            {formatDuration(leg.duration_minutes) || '-'} • {getStopsLabel(leg.stops_count)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        .modal-scroll::-webkit-scrollbar {
          width: 6px !important;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent !important;
          margin: 12px 0 !important;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 10px !important;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
        .modal-scroll::-webkit-scrollbar-button {
          display: none !important;
          height: 0 !important;
          width: 0 !important;
        }
        .modal-scroll::-webkit-scrollbar-button:single-button {
          display: none !important;
        }
        .modal-scroll::-webkit-scrollbar-button:vertical:start:decrement,
        .modal-scroll::-webkit-scrollbar-button:vertical:end:increment {
          display: none !important;
          height: 0 !important;
        }
        @media (max-width: 640px) {
          .modal-scroll::-webkit-scrollbar {
            display: none !important;
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
            'relative z-10 w-full max-w-lg md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto',
            'bg-gray-900/95 backdrop-blur-xl',
            'border border-white/20 rounded-lg',
            'shadow-2xl'
          )}
          onClick={e => e.stopPropagation()}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
            // @ts-ignore
            WebkitScrollbarWidth: '8px',
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4 sm:p-5 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Flight Details</h2>
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
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                'px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full border',
                flight.status === 'shortlisted' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                flight.status === 'confirmed' && 'bg-green-500/20 text-green-300 border-green-500/30',
                flight.status === 'not_selected' && 'bg-red-500/20 text-red-300 border-red-500/30',
                flight.status === 'draft' && 'bg-white/10 text-white/70 border-white/20'
              )}>
                {flight.status || 'draft'}
              </span>
              <span className="px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full bg-white/10 text-white/70 border border-white/20">
                {flight.flight_type.replace('_', ' ')}
              </span>
            </div>

            {/* Outbound Flight */}
            {flight.legs && flight.legs.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">
                  {flight.flight_type === 'round_trip' ? 'Outbound' : 'Flight'}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {flight.legs.map((leg, i) => renderLeg(leg, i, flight.legs!.length))}
                </div>
              </div>
            )}

            {/* Return Flight */}
            {flight.flight_type === 'round_trip' && flight.return_legs && flight.return_legs.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">Return</h3>
                <div className="space-y-2 sm:space-y-3">
                  {flight.return_legs.map((leg, i) => renderLeg(leg, i, flight.return_legs!.length))}
                </div>
              </div>
            )}

            {/* Price */}
            {flight.unit_fare && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                <p className="text-white/50 text-xs sm:text-sm mb-1.5">Fare</p>
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    {flight.currency_code} {(flight.unit_fare * (flight.travelers?.length || 1)).toLocaleString()}
                  </p>
                  <span className="text-sm text-white/50">total</span>
                </div>
                {flight.travelers && flight.travelers.length > 0 && (
                  <p className="text-sm text-white/50 mt-1.5">
                    {flight.currency_code} {flight.unit_fare.toLocaleString()} × {flight.travelers.length} traveler{flight.travelers.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Travelers */}
            {flight.travelers && flight.travelers.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">Travelers</h3>
                <div className="flex flex-wrap gap-2">
                  {flight.travelers.map(t => (
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
            {flight.notes && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">Notes</h3>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                  <ul className="list-disc list-inside space-y-1.5">
                    {flight.notes.split('\n').filter(line => line.trim()).map((line, i) => (
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