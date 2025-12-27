'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, Users } from 'lucide-react';
import ItineraryDayCard from '@/app/components/organisms/ItineraryDayCard';
import type { ItineraryDay } from '@/app/lib/types/itinerary';
import PageBackground from '@/app/components/ui/PageBackground';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { formatDateRange } from '@/app/lib/utils';
import TripReferencePanel from '@/app/components/organisms/TripReferencePanel';
import type { FlightOption } from '@/app/lib/types/flight';
import type { AccommodationOption } from '@/app/lib/types/accommodation';
import { Pin, List } from 'lucide-react';

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_active: number;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function ItineraryPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'full'>('day');
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);

  // Calculate total days from trip duration
  const getTripDays = (): { dayNumber: number; date: string }[] => {
    if (!trip?.start_date || !trip?.end_date) return [];
    
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const daysList: { dayNumber: number; date: string }[] = [];
    
    let current = new Date(start);
    let dayNum = 1;
    
    while (current <= end) {
      daysList.push({
        dayNumber: dayNum,
        date: current.toISOString().split('T')[0],
      });
      current.setDate(current.getDate() + 1);
      dayNum++;
    }
    
    return daysList;
  };

  const tripDays = getTripDays();

  // Get selected day data
  const selectedDay = days.find(d => d.day_number === selectedDayNumber);
  const selectedDayInfo = tripDays.find(d => d.dayNumber === selectedDayNumber);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch trip details
      const tripRes = await fetch(`/api/trips/${tripId}`);
      if (!tripRes.ok) throw new Error('Failed to fetch trip');
      const tripData = await tripRes.json();
      setTrip(tripData.trip);

      // Fetch existing itinerary days
      const daysRes = await fetch(`/api/trips/${tripId}/itinerary`);
      if (!daysRes.ok) throw new Error('Failed to fetch itinerary');
      const daysData = await daysRes.json();
      setDays(daysData);

      // Fetch travelers
      const travelersRes = await fetch(`/api/trips/${tripId}/travelers`);
      if (travelersRes.ok) {
        const travelersData = await travelersRes.json();
        setTravelers(travelersData.travelers || []);
      }

      // Fetch preferences
      const prefRes = await fetch('/api/user/preferences');
      if (prefRes.ok) {
        const prefData = await prefRes.json();
        setDateFormat(prefData.preferences?.date_format || 'DD Mmm YYYY');
      }

      // Fetch flights
      const flightsRes = await fetch(`/api/trips/${tripId}/flights`);
      if (flightsRes.ok) {
        const flightsData = await flightsRes.json();
        setFlights(flightsData || []);
      }

      // Fetch accommodations
      const accommodationsRes = await fetch(`/api/trips/${tripId}/accommodations`);
      if (accommodationsRes.ok) {
        const accommodationsData = await accommodationsRes.json();
        setAccommodations(accommodationsData || []);
      }

      // Auto-select first day if none selected
      if (daysData.length > 0 && !selectedDayNumber) {
        setSelectedDayNumber(daysData[0].day_number);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDay = async (dayNumber: number) => {
    setSelectedDayNumber(dayNumber);
    setIsDropdownOpen(false);

    // Check if day exists, if not create it
    const existingDay = days.find(d => d.day_number === dayNumber);
    if (!existingDay) {
      const dayInfo = tripDays.find(d => d.dayNumber === dayNumber);
      if (dayInfo) {
        try {
          const res = await fetch(`/api/trips/${tripId}/itinerary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              day_number: dayNumber,
              day_date: dayInfo.date,
            }),
          });
          
          if (res.ok) {
            const newDay = await res.json();
            setDays(prev => [...prev, newDay].sort((a, b) => a.day_number - b.day_number));
          }
        } catch (err) {
          console.error('Error creating day:', err);
        }
      }
    }
  };

  const handleDayUpdate = (updatedDay: ItineraryDay) => {
    setDays(prev => prev.map(d => d.day_id === updatedDay.day_id ? updatedDay : d));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatHeaderDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10 text-red-300">{error || 'Trip not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative p-4 sm:p-6 pb-24">
      <PageBackground />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Hub
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Itinerary</h1>
          <p className="text-white/70 text-base sm:text-lg mb-3">{trip.trip_name}</p>
          
          <div className="flex flex-wrap items-center gap-3">
            {(trip.destination_city || trip.destination_country) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{[trip.destination_city, trip.destination_country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            
            {trip.start_date && trip.end_date && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
                </div>
                
                {(() => {
                  const start = new Date(trip.start_date);
                  const end = new Date(trip.end_date);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const nights = days - 1;
                  return (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-400/30">
                      <span className="text-sm font-medium text-purple-200">{days}D / {nights}N</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* View Mode Toggle & Travelers */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            {/* Day View Button */}
            <div className="relative group">
              <CircleIconButton
                variant={viewMode === 'day' ? 'primary' : 'default'}
                onClick={() => setViewMode('day')}
                title="Day View"
                icon={<Calendar className="w-5 h-5" />}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Day View
              </div>
            </div>

            {/* Full View Button */}
            <div className="relative group">
              <CircleIconButton
                variant={viewMode === 'full' ? 'primary' : 'default'}
                onClick={() => setViewMode('full')}
                title="Full View"
                icon={<List className="w-5 h-5" />}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Full View
              </div>
            </div>

            {/* Reference Panel Button */}
            <div className="relative group">
              <CircleIconButton
                variant="default"
                onClick={() => setIsReferencePanelOpen(true)}
                title="Trip Reference"
                icon={<Pin className="w-5 h-5" />}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Trip Reference
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">

            {/* Travelers */}
            {travelers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-300" />
                <div className="flex items-center gap-1">
                  {travelers.map((traveler, idx) => (
                    <span
                      key={traveler.traveler_id}
                      className={`text-sm ${traveler.is_active ? 'text-white' : 'text-white/50'}`}
                    >
                      {traveler.traveler_name}
                      {traveler.is_active === 0 && (
                        <span className="text-xs text-red-400 ml-1">(inactive)</span>
                      )}
                      {idx < travelers.length - 1 && <span className="text-white/30 mx-1">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Day Selector - Only show in Day View */}
        {viewMode === 'day' && (
          <div className="mb-6">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-200" />
                  </div>
                  {selectedDayNumber ? (
                    <div className="text-left">
                      <div className="font-medium">Day {selectedDayNumber}</div>
                      <div className="text-sm text-purple-200">
                        {selectedDayInfo && formatDate(selectedDayInfo.date)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-purple-200">Select a day...</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {tripDays.map((day) => {
                    const existingDay = days.find(d => d.day_number === day.dayNumber);
                    const hasContent = existingDay && existingDay.categories && existingDay.categories.length > 0;
                    
                    return (
                      <button
                        key={day.dayNumber}
                        onClick={() => handleSelectDay(day.dayNumber)}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors ${
                          selectedDayNumber === day.dayNumber ? 'bg-purple-500/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            hasContent ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white'
                          }`}>
                            {day.dayNumber}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium">Day {day.dayNumber}</div>
                            <div className="text-sm text-purple-200">{formatDate(day.date)}</div>
                          </div>
                        </div>
                        {hasContent && (
                          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                            {existingDay.categories?.length} {existingDay.categories?.length === 1 ? 'category' : 'categories'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div>
          {viewMode === 'day' ? (
            // Day View - Single day
            <>
              {selectedDayNumber && selectedDay ? (
                <ItineraryDayCard
                  tripId={Number(tripId)}
                  day={selectedDay}
                  dayDate={selectedDayInfo?.date || selectedDay.day_date}
                  onUpdate={handleDayUpdate}
                />
              ) : selectedDayNumber ? (
                <div className="text-center py-12">
                  <div className="text-purple-200 mb-4">Loading day...</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-200">Select a day to start planning</p>
                </div>
              )}
            </>
          ) : (
            // Full View - All days
            <>
              {days.length > 0 ? (
                <div className="space-y-4">
                  {days.map((day) => {
                    const dayInfo = tripDays.find(d => d.dayNumber === day.day_number);
                    return (
                      <ItineraryDayCard
                        key={day.day_id}
                        tripId={Number(tripId)}
                        day={day}
                        dayDate={dayInfo?.date || day.day_date}
                        onUpdate={handleDayUpdate}
                        defaultCollapsed={true}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-200">No days planned yet</p>
                  <p className="text-purple-300 text-sm mt-2">Switch to Day View to start planning your itinerary</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Trip Reference Panel */}
      <TripReferencePanel
        isOpen={isReferencePanelOpen}
        onClose={() => setIsReferencePanelOpen(false)}
        flights={flights}
        accommodations={accommodations}
        dateFormat={dateFormat}
      />
    </div>
  );
}