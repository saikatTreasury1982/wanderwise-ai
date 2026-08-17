'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Pin } from 'lucide-react';
import ItineraryDayCard from '@/app/components/organisms/ItineraryDayCard';
import type { ItineraryDay } from '@/app/lib/types/itinerary';
import PageBackground from '@/app/components/ui/PageBackground';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { formatDateRange, cn } from '@/app/lib/utils';
import TripReferencePanel from '@/app/components/organisms/TripReferencePanel';
import RecommendationSlider from '@/app/components/organisms/RecommendationSlider';
import ItineraryAddModal from '@/app/components/organisms/Itineraryaddmodal';
import type { FlightOption } from '@/app/lib/types/flight';
import type { AccommodationOption } from '@/app/lib/types/accommodation';

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string | null;
  end_date: string | null;
}
interface Traveler { traveler_id: number; traveler_name: string; is_active: number; }
interface Props { tripId: string };

export default function ItineraryPage({ tripId }: Props) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [showRecommendationSlider, setShowRecommendationSlider] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingRecommendation, setPendingRecommendation] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingDay, setIsCreatingDay] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const getTripDays = (): { dayNumber: number; date: string }[] => {
    if (!trip?.start_date || !trip?.end_date) return [];
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const list: { dayNumber: number; date: string }[] = [];
    let current = new Date(start);
    let dayNum = 1;
    while (current <= end) {
      list.push({ dayNumber: dayNum, date: current.toISOString().split('T')[0] });
      current.setDate(current.getDate() + 1);
      dayNum++;
    }
    return list;
  };
  const tripDays = getTripDays();

  const selectedDay = days.find(d => d.day_number === selectedDayNumber);
  const selectedDayInfo = tripDays.find(d => d.dayNumber === selectedDayNumber);

  useEffect(() => { fetchData(); }, [tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const tripRes = await fetch(`/api/trips/${tripId}`);
      if (!tripRes.ok) throw new Error('Failed to fetch trip');
      const tripData = await tripRes.json();
      setTrip(tripData.trip);

      const daysRes = await fetch(`/api/trips/${tripId}/itinerary`);
      if (!daysRes.ok) throw new Error('Failed to fetch itinerary');
      const daysData = await daysRes.json();
      setDays(daysData);

      const travelersRes = await fetch(`/api/trips/${tripId}/travelers`);
      if (travelersRes.ok) setTravelers((await travelersRes.json()).travelers || []);

      const prefRes = await fetch('/api/user/preferences');
      if (prefRes.ok) setDateFormat((await prefRes.json()).preferences?.date_format || 'DD Mmm YYYY');

      const flightsRes = await fetch(`/api/trips/${tripId}/flights`);
      if (flightsRes.ok) setFlights((await flightsRes.json()) || []);

      const accommodationsRes = await fetch(`/api/trips/${tripId}/accommodations`);
      if (accommodationsRes.ok) setAccommodations((await accommodationsRes.json()) || []);

      if (daysData.length > 0 && !selectedDayNumber) setSelectedDayNumber(daysData[0].day_number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDay = async (dayNumber: number) => {
    setMobileView('detail');
    const existingDay = days.find(d => d.day_number === dayNumber);
    if (!existingDay) {
      setIsCreatingDay(true);
      setSelectedDayNumber(dayNumber);
      const dayInfo = tripDays.find(d => d.dayNumber === dayNumber);
      if (dayInfo) {
        try {
          const res = await fetch(`/api/trips/${tripId}/itinerary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_number: dayNumber, day_date: dayInfo.date }),
          });
          if (res.ok) {
            const newDay = await res.json();
            setDays(prev => [...prev, newDay].sort((a, b) => a.day_number - b.day_number));
          }
        } catch (err) {
          console.error('Error creating day:', err);
        } finally {
          setIsCreatingDay(false);
        }
      }
    } else {
      setSelectedDayNumber(dayNumber);
    }
  };

  const handleDayUpdate = (updatedDay: ItineraryDay) => {
    setDays(prev => prev.map(d => d.day_id === updatedDay.day_id ? updatedDay : d));
  };

  const monthLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdayShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10"><div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
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

  // rail — group days by month
  let lastMonth = '';
  const rail = (
    <div className="bg-white/5 border border-white/15 rounded-xl p-2 overflow-y-auto custom-scrollbar h-full">
      <div className="text-xs uppercase tracking-wide text-white/40 px-2 py-2">{tripDays.length} days</div>
      {tripDays.map((d) => {
        const existing = days.find(x => x.day_number === d.dayNumber);
        const catCount = existing?.categories?.length ?? 0;
        const title = existing?.description || '';
        const selected = selectedDayNumber === d.dayNumber;
        const m = monthLabel(d.date);
        const showMonth = m !== lastMonth;
        lastMonth = m;
        return (
          <div key={d.dayNumber}>
            {showMonth && <div className="text-[10px] uppercase text-primary-300/80 px-2 pt-3 pb-1">{m}</div>}
            <button
              onClick={() => handleSelectDay(d.dayNumber)}
              className={cn('w-full flex items-center gap-2.5 p-2 rounded-lg mb-0.5 text-left transition-colors',
                selected ? 'bg-primary-500/20 border border-primary-400/50' : 'hover:bg-white/5 border border-transparent')}
            >
              <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                catCount > 0 ? 'bg-primary-500 text-white' : 'bg-white/10 text-white/80')}>
                {d.dayNumber}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white truncate">Day {d.dayNumber}</span>
                <span className="block text-xs text-white/50 truncate">
                  {title || (catCount > 0 ? `${catCount} categor${catCount === 1 ? 'y' : 'ies'}` : 'empty')}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );

  const detail = (
    selectedDayNumber && selectedDay ? (
      <div>
        {/* Prev / Next day */}
        <div className="flex gap-2 mb-3">
          <CircleIconButton
            variant="default"
            size="small"
            onClick={() => selectedDayNumber > 1 && handleSelectDay(selectedDayNumber - 1)}
            disabled={selectedDayNumber <= 1}
            title="Previous day"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>}
          />
          <CircleIconButton
            variant="default"
            size="small"
            onClick={() => selectedDayNumber < tripDays.length && handleSelectDay(selectedDayNumber + 1)}
            disabled={selectedDayNumber >= tripDays.length}
            title="Next day"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
          />
        </div>

        <ItineraryDayCard
          tripId={Number(tripId)}
          day={selectedDay}
          dayDate={selectedDayInfo?.date || selectedDay.day_date}
          dateFormat={dateFormat}
          onUpdate={handleDayUpdate}
        />
      </div>
    ) : selectedDayNumber ? (
      <div className="text-center py-12">
        {isCreatingDay ? (
          <>
            <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-primary-200">Creating day…</div>
          </>
        ) : <div className="text-primary-200">Loading day…</div>}
      </div>
    ) : (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-primary-300 mx-auto mb-4 opacity-50" />
        <p className="text-primary-200">Select a day to start planning</p>
      </div>
    )
  );

  return (
    <div className="min-h-screen relative p-4 sm:p-6 pb-24">
      <PageBackground />
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push(`/dashboard/trip/${tripId}`)} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Trip Hub
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Itinerary</h1>
          <p className="text-white/70 text-base sm:text-lg mb-3">{trip.trip_name}</p>
          <div className="flex flex-wrap items-center gap-3">
            {(trip.destination_city || trip.destination_country) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <span className="text-sm text-white/90">{[trip.destination_city, trip.destination_country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {trip.start_date && trip.end_date && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CircleIconButton variant="default" onClick={() => setIsReferencePanelOpen(true)} title="Trip Reference" size="small" icon={<Pin className="w-4 h-4" />} />
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/40 rounded-full blur-md animate-pulse" />
              <CircleIconButton variant="default" size="small" onClick={() => setShowRecommendationSlider(true)} title="Smart Suggestions"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
            </div>
          </div>
          {travelers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-300" />
              <div className="flex items-center gap-1">
                {travelers.map((t, idx) => (
                  <span key={t.traveler_id} className={cn('text-sm', t.is_active ? 'text-white' : 'text-white/50')}>
                    {t.traveler_name}{t.is_active === 0 && <span className="text-xs text-red-400 ml-1">(inactive)</span>}
                    {idx < travelers.length - 1 && <span className="text-white/30 mx-1">•</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: two-pane */}
        <div className="hidden lg:grid grid-cols-[240px_1fr] gap-4" style={{ height: 'calc(100vh - 260px)' }}>
          {rail}
          <div className="overflow-y-auto custom-scrollbar pr-1">{detail}</div>
        </div>

        {/* Mobile: list ↔ detail */}
        <div className="lg:hidden">
          {mobileView === 'list' ? (
            <div style={{ maxHeight: 'calc(100vh - 240px)' }} className="overflow-y-auto">{rail}</div>
          ) : (
            <div>
              <button onClick={() => setMobileView('list')} className="flex items-center gap-2 text-white/70 hover:text-white mb-3 transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                All days
              </button>
              {detail}
            </div>
          )}
        </div>
      </div>

      <TripReferencePanel
        isOpen={isReferencePanelOpen}
        onClose={() => setIsReferencePanelOpen(false)}
        tripId={Number(tripId)}
        accommodations={accommodations}
        dateFormat={dateFormat}
      />

      <RecommendationSlider
        isOpen={showRecommendationSlider}
        onClose={() => setShowRecommendationSlider(false)}
        type="itinerary"
        tripId={parseInt(tripId)}
        onAddRecommendation={(rec: any, selections?: { categoryIndex: number; activityIndex: number }[]) => {
          if (!selections || selections.length === 0) { alert('Please select items in Preview before adding'); return; }
          setPendingRecommendation({ ...rec, selections });
          setShowRecommendationSlider(false);
          setIsAddModalOpen(true);
        }}
      />

      <ItineraryAddModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setPendingRecommendation(null); }}
        dayData={pendingRecommendation}
        initialSelections={pendingRecommendation?.selections || []}
        onConfirm={async (target: 'new' | number, finalSelections: { categoryIndex: number; activityIndex: number }[]) => {
          if (!pendingRecommendation) return;
          setIsProcessing(true);
          try {
            let targetDayId = target;
            let targetDayNumber: number = typeof target === 'number' ? target : 1;
            const existingDay = days.find(d => d.day_id === target);
            if (!existingDay) {
              const dayInfo = tripDays.find(d => d.dayNumber === target);
              const dayRes = await fetch(`/api/trips/${tripId}/itinerary`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day_number: target, day_date: dayInfo?.date || new Date().toISOString().split('T')[0], day_description: pendingRecommendation.day_description || `From ${pendingRecommendation.source.trip_name}` }),
              });
              if (!dayRes.ok) throw new Error('Failed to create day');
              const newDay = await dayRes.json();
              targetDayId = newDay.day_id; targetDayNumber = newDay.day_number;
            } else { targetDayNumber = existingDay.day_number; }

            const categoriesWithSelections = new Map<number, number[]>();
            finalSelections.forEach(sel => {
              if (!categoriesWithSelections.has(sel.categoryIndex)) categoriesWithSelections.set(sel.categoryIndex, []);
              categoriesWithSelections.get(sel.categoryIndex)!.push(sel.activityIndex);
            });

            for (const [categoryIndex, activityIndices] of categoriesWithSelections) {
              const category = pendingRecommendation.categories[categoryIndex];
              const catRes = await fetch(`/api/trips/${tripId}/itinerary/${targetDayId}/categories`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_name: category.category_name, category_cost: category.category_cost, currency_code: category.currency_code }),
              });
              if (catRes.ok) {
                const newCategory = await catRes.json();
                for (const activityIndex of activityIndices) {
                  const activity = category.activities[activityIndex];
                  await fetch(`/api/trips/${tripId}/itinerary/${targetDayId}/categories/${newCategory.category_id}/activities`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activity_name: activity.activity_name, start_time: activity.start_time, end_time: activity.end_time, activity_cost: activity.activity_cost, currency_code: activity.currency_code }),
                  });
                }
              }
            }
            await fetchData();
            setSelectedDayNumber(targetDayNumber);
            setMobileView('detail');
            setIsAddModalOpen(false);
            setPendingRecommendation(null);
          } catch (error) {
            console.error('Error adding itinerary recommendation:', error);
            alert('Failed to add itinerary recommendation');
          } finally { setIsProcessing(false); }
        }}
        existingDays={tripDays.map(td => {
          const existingDay = days.find(d => d.day_number === td.dayNumber);
          return { day_id: existingDay?.day_id || td.dayNumber, day_code: `Day ${td.dayNumber}`, day_date: td.date, exists: !!existingDay };
        })}
      />
    </div>
  );
}