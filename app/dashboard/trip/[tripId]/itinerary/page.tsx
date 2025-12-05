'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, Plus, ChevronDown } from 'lucide-react';
import ItineraryDayCard from '@/app/components/organisms/ItineraryDayCard';
import type { ItineraryDay } from '@/app/lib/types/itinerary';

interface Trip {
  trip_id: number;
  trip_name: string;
  start_date: string | null;
  end_date: string | null;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function ItineraryPage({ params }: PageProps) {
  const { tripId } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-300">{error || 'Trip not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/trip/${tripId}`}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-white">Itinerary</h1>
              <p className="text-purple-200 text-sm">{trip.trip_name}</p>
            </div>
            <div className="flex items-center gap-2 text-purple-200 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{tripDays.length} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="max-w-4xl mx-auto px-4 py-4">
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

      {/* Selected Day Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
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
      </div>
    </div>
  );
}