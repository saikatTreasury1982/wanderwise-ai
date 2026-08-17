'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import PageBackground from '@/app/components/ui/PageBackground';
import { formatDateRange } from '@/app/lib/utils';

interface Props {
  tripId: string;
  onChoose: (mode: 'day' | 'range') => void;
}

interface Trip {
  trip_id: number;
  trip_name: string;
  start_date: string;
  end_date: string;
}

export default function ItineraryModeFork({ tripId, onChoose }: Props) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, pRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`),
          fetch(`/api/user/preferences`),
        ]);
        if (tRes.ok) setTrip((await tRes.json()).trip);
        if (pRes.ok) setDateFormat((await pRes.json()).preferences?.date_format || 'DD Mmm YYYY');
      } catch (e) {
        console.error('Error loading trip for fork:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tripId]);

  const duration = trip ? (() => {
    const days = Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1;
    return { days, nights: days - 1 };
  })() : null;

  // hold until trip data is in, so header + options appear together
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

  return (
    <div className="min-h-screen relative p-4 sm:p-6">
      <PageBackground />
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Trip Hub
          </button>

          <h1 className="text-3xl font-bold text-white mb-3">Itinerary</h1>
          {trip && <p className="text-white/70 text-lg mb-3">{trip.trip_name}</p>}

          {trip && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <Calendar className="w-4 h-4 text-primary-300" />
                <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
              </div>
              {duration && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 rounded-full border border-primary-400/30">
                  <span className="text-sm font-medium text-primary-200">{duration.days}D / {duration.nights}N</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fork choice */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-primary-300" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">How do you want to build this itinerary?</h2>
          <p className="text-sm text-white/60 mb-7">Pick the approach that fits this trip. This is set for the itinerary.</p>

          <div className="grid sm:grid-cols-2 gap-4 text-left">
            <button onClick={() => onChoose('day')}
              className="bg-white/5 hover:bg-white/10 border border-white/20 hover:border-primary-400/50 rounded-xl p-5 transition-colors">
              <svg className="w-6 h-6 text-primary-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              <div className="text-white font-medium mb-1">Plan day by day</div>
              <div className="text-xs text-white/60">A slot for each day of your trip. Best for short trips with distinct days.</div>
            </button>

            <button onClick={() => onChoose('range')}
              className="bg-white/5 hover:bg-white/10 border border-white/20 hover:border-primary-400/50 rounded-xl p-5 transition-colors">
              <svg className="w-6 h-6 text-primary-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v4H4zM4 14h16v4H4z" /></svg>
              <div className="text-white font-medium mb-1">Plan by day ranges</div>
              <div className="text-xs text-white/60">Group days into blocks — good for long trips or repeating days like sea days.</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}