'use client';

import { useState, useEffect } from 'react';
import { X, Plane, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import type { AccommodationOption } from '@/app/lib/types/accommodation';
import { formatDateRange } from '@/app/lib/utils';

interface TripReferencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  accommodations: AccommodationOption[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onDayClick?: (dayNumber: number) => void;
}

interface Leg {
  leg_id: number;
  departure_airport_code: string;
  arrival_airport_code: string;
  departure_datetime: string | null;
  airline: string | null;
  flight_number: string | null;
}

export default function TripReferencePanel({
  isOpen,
  onClose,
  tripId,
  accommodations,
  dateFormat,
}: TripReferencePanelProps) {
  const [flightsCollapsed, setFlightsCollapsed] = useState(false);
  const [accommodationsCollapsed, setAccommodationsCollapsed] = useState(false);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(false);

  // Fetch bookings, flatten to time-sorted legs, whenever panel opens
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoadingFlights(true);
      try {
        const res = await fetch(`/api/flights/bookings?trip_id=${tripId}`);
        if (res.ok) {
          const { bookings } = await res.json();
          const all: Leg[] = (bookings || []).flatMap((b: any) => b.legs || []);
          all.sort((a, b) => (a.departure_datetime ?? '').localeCompare(b.departure_datetime ?? ''));
          setLegs(all);
        }
      } finally {
        setLoadingFlights(false);
      }
    })();
  }, [isOpen, tripId]);

  const fmtDateTime = (dt: string | null) => {
    if (!dt) return '';
    const [date, time] = dt.split('T');
    return time ? `${date} ${time.slice(0, 5)}` : date;
  };

  const calculateNights = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return null;
    const n = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
    return n > 0 ? n : null;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'shortlisted': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const relevantAccommodations = accommodations
    .filter(a => a.status === 'confirmed' || a.status === 'shortlisted')
    .sort((a, b) => {
      if (!a.check_in_date || !b.check_in_date) return 0;
      return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
    });

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />}

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-black/30 backdrop-blur-xl border-l border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📌</span>
            <h2 className="text-lg font-semibold text-white">Trip Reference</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)] p-6 space-y-6 custom-scrollbar">

          {/* Flights */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <button onClick={() => setFlightsCollapsed(!flightsCollapsed)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary-300" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Flights</h3>
                <span className="text-xs text-white/50">({legs.length})</span>
              </div>
              {flightsCollapsed ? <ChevronRight className="w-4 h-4 text-primary-300" /> : <ChevronDown className="w-4 h-4 text-primary-300" />}
            </button>

            {!flightsCollapsed && (
              <div className="px-4 pb-4 pt-1">
                {loadingFlights ? (
                  <p className="text-white/40 text-sm py-2">Loading…</p>
                ) : legs.length === 0 ? (
                  <p className="text-white/50 text-sm py-2">No booked flights yet</p>
                ) : (
                  <div className="space-y-2">
                    {legs.map(l => (
                      <div key={l.leg_id} className="flex items-center gap-3 text-sm">
                        <span className="text-white font-medium whitespace-nowrap w-24">{l.departure_airport_code} → {l.arrival_airport_code}</span>
                        <span className="text-white/60 truncate flex-1">{l.airline || ''}</span>
                        <span className="text-white/50 whitespace-nowrap">{fmtDateTime(l.departure_datetime)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accommodations */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <button onClick={() => setAccommodationsCollapsed(!accommodationsCollapsed)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-300" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Lodging</h3>
                <span className="text-xs text-white/50">({relevantAccommodations.length})</span>
              </div>
              {accommodationsCollapsed ? <ChevronRight className="w-4 h-4 text-primary-300" /> : <ChevronDown className="w-4 h-4 text-primary-300" />}
            </button>

            {!accommodationsCollapsed && (
              <div className="px-4 pt-1 pb-4">
                {relevantAccommodations.length === 0 ? (
                  <p className="text-white/50 text-sm py-2">No confirmed or shortlisted lodging</p>
                ) : (
                  <div className="space-y-3">
                    {relevantAccommodations.map(a => {
                      const nights = calculateNights(a.check_in_date, a.check_out_date);
                      return (
                        <div key={a.accommodation_option_id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(a.status)}`}>{a.status}</span>
                            {a.type_name && <span className="text-xs text-primary-300">{a.type_name}</span>}
                          </div>
                          {a.accommodation_name && <div className="text-white font-medium">{a.accommodation_name}</div>}
                          {a.location && <div className="text-sm text-white/70">{a.location}</div>}
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <span>📅 {formatDateRange(a.check_in_date, a.check_out_date, dateFormat)}</span>
                            {nights && <span className="text-primary-300">({nights}N)</span>}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white/50">
                            {a.check_in_time && <span>In: {a.check_in_time}</span>}
                            {a.check_out_time && <span>Out: {a.check_out_time}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Empty state — both sections empty */}
          {legs.length === 0 && relevantAccommodations.length === 0 && !loadingFlights && (
            <div className="text-center py-8">
              <p className="text-white/50">Nothing booked yet.</p>
              <p className="text-white/30 text-sm mt-1">Booked flights and confirmed lodging appear here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}