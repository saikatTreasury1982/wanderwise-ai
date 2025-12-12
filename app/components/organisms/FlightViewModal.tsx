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
    <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
      {total > 1 && (
        <p className="text-xs text-white/50 mb-2">Leg {index + 1}</p>
      )}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg font-bold text-white">{leg.departure_airport}</span>
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span className="text-lg font-bold text-white">{leg.arrival_airport}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-white/50 text-xs">Departure</p>
          <p className="text-white">{leg.departure_date} {leg.departure_time && `at ${leg.departure_time}`}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs">Arrival</p>
          <p className="text-white">{leg.arrival_date} {leg.arrival_time && `at ${leg.arrival_time}`}</p>
        </div>
        {(leg.airline || leg.flight_number) && (
          <div>
            <p className="text-white/50 text-xs">Flight</p>
            <p className="text-white">{[leg.airline, leg.flight_number].filter(Boolean).join(' ')}</p>
          </div>
        )}
        <div>
          <p className="text-white/50 text-xs">Duration / Stops</p>
          <p className="text-white">
            {formatDuration(leg.duration_minutes) || '-'} • {getStopsLabel(leg.stops_count)}
          </p>
        </div>
      </div>
    </div>
  );

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
          <h2 className="text-lg font-semibold text-white">Flight Details</h2>
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
          <div className="flex items-center gap-2">
            <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full border',
            flight.status === 'shortlisted' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            flight.status === 'confirmed' && 'bg-green-500/20 text-green-300 border-green-500/30',
            flight.status === 'not_selected' && 'bg-red-500/20 text-red-300 border-red-500/30',
            flight.status === 'draft' && 'bg-white/10 text-white/70 border-white/20'
            )}>
            {flight.status || 'draft'}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/70 border border-white/20">
              {flight.flight_type.replace('_', ' ')}
            </span>
          </div>

          {/* Outbound Flight */}
          {flight.legs && flight.legs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">
                {flight.flight_type === 'round_trip' ? 'Outbound' : 'Flight'}
              </h3>
              <div className="space-y-2">
                {flight.legs.map((leg, i) => renderLeg(leg, i, flight.legs!.length))}
              </div>
            </div>
          )}

          {/* Return Flight */}
          {flight.flight_type === 'round_trip' && flight.return_legs && flight.return_legs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Return</h3>
              <div className="space-y-2">
                {flight.return_legs.map((leg, i) => renderLeg(leg, i, flight.return_legs!.length))}
              </div>
            </div>
          )}

          {/* Price */}
          {flight.unit_fare && (
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-white/50 text-xs mb-1">Fare</p>
              <div className="flex items-baseline gap-3">
                <p className="text-xl font-bold text-green-400">
                  {flight.currency_code} {(flight.unit_fare * (flight.travelers?.length || 1)).toLocaleString()}
                </p>
                <span className="text-sm text-white/50">total</span>
              </div>
              {flight.travelers && flight.travelers.length > 0 && (
                <p className="text-sm text-white/50 mt-1">
                  {flight.currency_code} {flight.unit_fare.toLocaleString()} × {flight.travelers.length} traveler{flight.travelers.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Travelers */}
          {flight.travelers && flight.travelers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Travelers</h3>
              <div className="flex flex-wrap gap-2">
                {flight.travelers.map(t => (
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
          {flight.notes && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 p-3">
                {flight.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}