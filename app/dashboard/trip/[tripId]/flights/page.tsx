'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatDateRange } from '@/app/lib/utils';
import PageBackground from '@/app/components/ui/PageBackground';
import FlightPlanningView from '@/app/components/organisms/FlightPlanningView';
import FlightBookingsView from '@/app/components/organisms/FlightBookingsView';

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
}
interface Traveler { traveler_id: number; traveler_name: string; is_active: number; is_cost_sharer: number; }
interface Currency { currency_code: string; currency_name: string; }
interface PageProps { params: Promise<{ tripId: string }>; }

export default function FlightsPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<'bookings' | 'planning'>('bookings');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({ date_format: 'YYYY-MM-DD' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [tripRes, travRes, currRes, prefRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`),
          fetch(`/api/trips/${tripId}/travelers`),
          fetch('/api/currencies'),
          fetch('/api/user/preferences'),
        ]);
        if (tripRes.status === 401) { router.push('/login'); return; }
        if (tripRes.status === 404) { router.push('/dashboard'); return; }
        if (tripRes.ok) setTrip((await tripRes.json()).trip);
        if (travRes.ok) setTravelers((await travRes.json()).travelers);
        if (currRes.ok) setCurrencies((await currRes.json()).currencies);
        if (prefRes.ok) setPreferences((await prefRes.json()).preferences);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const destination = [trip.destination_city, trip.destination_country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen relative p-6 pb-24">
      <PageBackground />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Hub
          </button>

          <h1 className="text-3xl font-bold text-white mb-3">Flights</h1>
          <p className="text-white/70 text-lg mb-3">{trip.trip_name}</p>

          <div className="flex flex-wrap items-center gap-3">
            {destination && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <span className="text-sm text-white/90">{destination}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, preferences.date_format)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['bookings', 'planning'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-full text-sm border transition-colors',
                tab === t
                  ? 'bg-primary-500/30 border-primary-400 text-white'
                  : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
              )}
            >
              {t === 'bookings' ? 'Bookings' : 'Planning'}
            </button>
          ))}
        </div>

        {tab === 'planning' && (
          <FlightPlanningView
            tripId={parseInt(tripId)}
            travelers={travelers}
            currencies={currencies}
            dateFormat={preferences.date_format}
          />
        )}

        {tab === 'bookings' && <FlightBookingsView tripId={parseInt(tripId)} />}
      </div>
    </div>
  );
}