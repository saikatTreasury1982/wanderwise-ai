'use client';

import { useState } from 'react';
import { X, Plane, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import type { FlightOption } from '@/app/lib/types/flight';
import type { AccommodationOption } from '@/app/lib/types/accommodation';
import { formatDateRange } from '@/app/lib/utils';

interface TripReferencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  flights: FlightOption[];
  accommodations: AccommodationOption[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onDayClick?: (dayNumber: number) => void;
}

export default function TripReferencePanel({
  isOpen,
  onClose,
  flights,
  accommodations,
  dateFormat,
  onDayClick,
}: TripReferencePanelProps) {
  
  const [flightsCollapsed, setFlightsCollapsed] = useState(true);
  const [accommodationsCollapsed, setAccommodationsCollapsed] = useState(true);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const calculateNights = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : null;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'shortlisted':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  // Filter to only show confirmed and shortlisted
  const relevantFlights = flights
  .filter(f => f.status === 'confirmed' || f.status === 'shortlisted')
  .sort((a, b) => {
    const dateA = a.legs && a.legs.length > 0 ? new Date(a.legs[0].departure_date || '') : new Date(0);
    const dateB = b.legs && b.legs.length > 0 ? new Date(b.legs[0].departure_date || '') : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  const relevantAccommodations = accommodations
    .filter(a => a.status === 'confirmed' || a.status === 'shortlisted')
    .sort((a, b) => {
      if (!a.check_in_date || !b.check_in_date) return 0;
      return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
    });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📌</span>
            <h2 className="text-lg font-semibold text-white">Trip Reference</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)] p-6 space-y-6">
          
          {/* Flights Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setFlightsCollapsed(!flightsCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-purple-300" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Flights</h3>
                <span className="text-xs text-white/50">({relevantFlights.length})</span>
              </div>
              {flightsCollapsed ? (
                <ChevronRight className="w-4 h-4 text-purple-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-300" />
              )}
            </button>
            
            {!flightsCollapsed && (
              <div className="px-4 pt-4 pb-4">
                {relevantFlights.length === 0 ? (
                  <p className="text-white/50 text-sm">No confirmed or shortlisted flights</p>
                ) : (
                  <div className="space-y-3">
                {relevantFlights.map(flight => (
                  <div 
                    key={flight.flight_option_id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(flight.status)}`}>
                        {flight.status}
                      </span>
                      <span className="text-xs text-white/50">
                        {flight.flight_type === 'round_trip' ? 'Round Trip' : flight.flight_type === 'one_way' ? 'One Way' : 'Multi City'}
                      </span>
                    </div>

                    {/* Outbound */}
                    {flight.legs && flight.legs.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-white/50 uppercase">Outbound</div>
                        <div className="text-white font-medium">
                          {flight.legs[0].departure_airport} → {flight.legs[flight.legs.length - 1].arrival_airport}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <span>📅 {formatDateRange(flight.legs[0].departure_date, flight.legs[0].arrival_date, dateFormat)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <span>🕐 {flight.legs[0].departure_time || '--:--'} → {flight.legs[flight.legs.length - 1].arrival_time || '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          {flight.legs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) > 0 && (
                            <span>⏱️ {formatDuration(flight.legs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0))}</span>
                          )}
                          <span>
                            {flight.legs.reduce((sum, l) => sum + (l.stops_count || 0), 0) === 0 
                              ? 'Direct' 
                              : `${flight.legs.reduce((sum, l) => sum + (l.stops_count || 0), 0)} stop(s)`}
                          </span>
                          {flight.legs[0].airline && <span>{flight.legs[0].airline}</span>}
                        </div>
                      </div>
                    )}

                    {/* Return */}
                    {flight.flight_type === 'round_trip' && flight.return_legs && flight.return_legs.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-white/10">
                        <div className="text-xs text-white/50 uppercase">Return</div>
                        <div className="text-white font-medium">
                          {flight.return_legs[0].departure_airport} → {flight.return_legs[flight.return_legs.length - 1].arrival_airport}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <span>📅 {formatDateRange(flight.return_legs[0].departure_date, flight.return_legs[0].arrival_date, dateFormat)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <span>🕐 {flight.return_legs[0].departure_time || '--:--'} → {flight.return_legs[flight.return_legs.length - 1].arrival_time || '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          {flight.return_legs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) > 0 && (
                            <span>⏱️ {formatDuration(flight.return_legs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0))}</span>
                          )}
                          <span>
                            {flight.return_legs.reduce((sum, l) => sum + (l.stops_count || 0), 0) === 0 
                              ? 'Direct' 
                              : `${flight.return_legs.reduce((sum, l) => sum + (l.stops_count || 0), 0)} stop(s)`}
                          </span>
                          {flight.return_legs[0].airline && <span>{flight.return_legs[0].airline}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

          {/* Accommodations Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setAccommodationsCollapsed(!accommodationsCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-300" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Accommodations</h3>
                <span className="text-xs text-white/50">({relevantAccommodations.length})</span>
              </div>
              {accommodationsCollapsed ? (
                <ChevronRight className="w-4 h-4 text-purple-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-300" />
              )}
            </button>
            
            {!accommodationsCollapsed && (
              <div className="px-4 pt-4 pb-4">
                {relevantAccommodations.length === 0 ? (
                  <p className="text-white/50 text-sm">No confirmed or shortlisted accommodations</p>
                ) : (
                  <div className="space-y-3">
                {relevantAccommodations.map(accommodation => {
                  const nights = calculateNights(accommodation.check_in_date, accommodation.check_out_date);
                  
                  return (
                    <div 
                      key={accommodation.accommodation_option_id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
                    >
                      {/* Status & Type */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(accommodation.status)}`}>
                          {accommodation.status}
                        </span>
                        {accommodation.type_name && (
                          <span className="text-xs text-purple-300">{accommodation.type_name}</span>
                        )}
                      </div>

                      {/* Name */}
                      {accommodation.accommodation_name && (
                        <div className="text-white font-medium">{accommodation.accommodation_name}</div>
                      )}

                      {/* Location */}
                      {accommodation.location && (
                        <div className="text-sm text-white/70">{accommodation.location}</div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <span>📅 {formatDateRange(accommodation.check_in_date, accommodation.check_out_date, dateFormat)}</span>
                        {nights && (
                          <span className="text-purple-300">({nights}N)</span>
                        )}
                      </div>

                      {/* Times */}
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        {accommodation.check_in_time && (
                          <span>In: {accommodation.check_in_time}</span>
                        )}
                        {accommodation.check_out_time && (
                          <span>Out: {accommodation.check_out_time}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

          {/* Empty State */}
          {relevantFlights.length === 0 && relevantAccommodations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/50">No confirmed or shortlisted items yet.</p>
              <p className="text-white/30 text-sm mt-1">Add flights and accommodations to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}