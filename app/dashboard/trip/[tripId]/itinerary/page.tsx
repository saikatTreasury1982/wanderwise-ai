'use client';

import { useState, useEffect, use } from 'react';
import PageBackground from '@/app/components/ui/PageBackground';
import ItineraryDayMode from '@/app/components/organisms/ItineraryDayMode';
import ItineraryRangeMode from '@/app/components/organisms/ItineraryRangeMode';
import ItineraryModeFork from '@/app/components/organisms/ItineraryModeFork';

interface PageProps { params: Promise<{ tripId: string }>; }

type Mode = 'loading' | 'day' | 'range' | 'fork';

export default function ItineraryPage({ params }: PageProps) {
  const { tripId } = use(params);
  const [mode, setMode] = useState<Mode>('loading');

  const detectMode = async () => {
    try {
      const [daysRes, rangesRes] = await Promise.all([
        fetch(`/api/trips/${tripId}/itinerary`),
        fetch(`/api/trips/${tripId}/itinerary-ranges`),
      ]);
      const days = daysRes.ok ? await daysRes.json() : [];
      const ranges = rangesRes.ok ? await rangesRes.json() : [];

      const hasDays = Array.isArray(days) && days.length > 0;
      const hasRanges = Array.isArray(ranges) && ranges.length > 0;

      if (hasDays && hasRanges) {
        console.warn(`Trip ${tripId} has BOTH day and range itinerary data — defaulting to day mode.`);
      }
      if (hasDays) setMode('day');
      else if (hasRanges) setMode('range');
      else setMode('fork');
    } catch (e) {
      console.error('Error detecting itinerary mode:', e);
      setMode('fork');
    }
  };

  useEffect(() => { detectMode(); }, [tripId]);

  if (mode === 'loading') {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10"><div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (mode === 'day') return <ItineraryDayMode tripId={tripId} />;
  if (mode === 'range') return <ItineraryRangeMode tripId={tripId} />;
  return <ItineraryModeFork tripId={tripId} onChoose={(m) => setMode(m)} />;
}