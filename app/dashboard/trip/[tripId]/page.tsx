'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/components/ui/PageBackground';
import { formatDateRange } from '@/lib/utils';

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  trip_status: 'draft' | 'active' | 'completed' | 'cancelled';
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function TripHubPage({ params }: PageProps) {
    const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({
    date_format: 'YYYY-MM-DD',
    });
    const { tripId } = use(params);
    const router = useRouter();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}`);
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 404) {
          router.push('/dashboard');
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setTrip(data.trip);

          // Fetch preferences
          const prefResponse = await fetch('/api/user/preferences');
          if (prefResponse.ok) {
            const prefData = await prefResponse.json();
            setPreferences(prefData.preferences);
          }
        }
      } catch (error) {
        console.error('Error fetching trip:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen relative p-6">
      <PageBackground />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

            <h1 className="text-3xl font-bold text-white mb-2">{trip.trip_name}</h1>
            <p className="text-white/70 text-lg">
                {[
                    destination,
                    formatDateRange(trip.start_date, trip.end_date, preferences.date_format)
                ].filter(Boolean).join(' | ')}
            </p>
        </div>

        {/* Placeholder content */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-purple-400/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Trip Hub Coming Soon</h2>
          <p className="text-white/70">
            This is where you'll plan your trip details, manage expenses, and track your itinerary.
          </p>
        </div>
      </div>
    </div>
  );
}