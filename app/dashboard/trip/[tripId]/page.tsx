'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import HubTile from '@/app/components/ui/HubTile';
import { formatDateRange } from '@/app/lib/utils';
import TripNotesSection from '@/app/components/organisms/TripNotesSection';

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  relationship: string | null;
  is_primary: number;
  is_cost_sharer: number;
  is_active: number;
}

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function TripHubPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({
    date_format: 'YYYY-MM-DD',
  });
  const [travelersCount, setTravelersCount] = useState(0);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [flightStats, setFlightStats] = useState<{ total: number; shortlisted: number; confirmed: number }>({ total: 0, shortlisted: 0, confirmed: 0 });
  const [accommodationStats, setAccommodationStats] = useState<{ total: number; shortlisted: number; confirmed: number }>({ total: 0, shortlisted: 0, confirmed: 0 });
  const [packingStats, setPackingStats] = useState<{ totalItems: number; packedItems: number; percentage: number }>({ totalItems: 0, packedItems: 0, percentage: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trip
        const tripResponse = await fetch(`/api/trips/${tripId}`);
        if (tripResponse.status === 401) {
          router.push('/login');
          return;
        }
        if (tripResponse.status === 404) {
          router.push('/dashboard');
          return;
        }
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          setTrip(tripData.trip);
        }

        // Fetch flights
        const flightsResponse = await fetch(`/api/trips/${tripId}/flights`);
        if (flightsResponse.ok) {
          const flightsData = await flightsResponse.json();
          const flights = flightsData || [];
          setFlightStats({
            total: flights.length,
            shortlisted: flights.filter((f: any) => f.status === 'shortlisted').length,
            confirmed: flights.filter((f: any) => f.status === 'confirmed').length,
          });
        }

        // Fetch accommodations
        const accommodationsResponse = await fetch(`/api/trips/${tripId}/accommodations`);
        if (accommodationsResponse.ok) {
          const accommodationsData = await accommodationsResponse.json();
          const accommodations = accommodationsData || [];
          setAccommodationStats({
            total: accommodations.length,
            shortlisted: accommodations.filter((a: any) => a.status === 'shortlisted').length,
            confirmed: accommodations.filter((a: any) => a.status === 'confirmed').length,
          });
        }

        // Fetch packing stats
        const packingResponse = await fetch(`/api/trips/${tripId}/packing`);
        if (packingResponse.ok) {
          const packingData = await packingResponse.json();
          setPackingStats(packingData.stats);
        }

        // Fetch preferences
        const prefResponse = await fetch('/api/user/preferences');
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          setPreferences(prefData.preferences);
        }

        // Fetch travelers
        const travelersResponse = await fetch(`/api/trips/${tripId}/travelers`);
        if (travelersResponse.ok) {
          const travelersData = await travelersResponse.json();
          setTravelers(travelersData.travelers);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  // Traveler stats
  const primaryTraveler = travelers.find(t => t.is_primary === 1);
  const costSharers = travelers.filter(t => t.is_cost_sharer === 1 && t.is_active === 1);
  const nonCostSharers = travelers.filter(t => t.is_cost_sharer === 0 && t.is_active === 1);
  const inactiveTravelers = travelers.filter(t => t.is_active === 0);

  const travelerSubtitle = (
      <div className="space-y-1 text-xs">
        {primaryTraveler && (
          <div>
            <span className="text-white/50">Primary: </span>
            <span className="text-white/90">{primaryTraveler.traveler_name}</span>
          </div>
        )}
        {costSharers.length > 0 && (
          <div>
            <span className="text-green-400">{costSharers.length}</span>
            <span className="text-white/50"> cost sharer</span>
          </div>
        )}
        {nonCostSharers.length > 0 && (
          <div>
            <span className="text-blue-400">{nonCostSharers.length}</span>
            <span className="text-white/50"> non-cost sharer</span>
          </div>
        )}
        {inactiveTravelers.length > 0 && (
          <div>
            <span className="text-yellow-400">{inactiveTravelers.length}</span>
            <span className="text-white/50"> inactive</span>
          </div>
        )}
      </div>
    );

    const flightSubtitle = flightStats.total > 0 ? (
    <div className="space-y-1 text-xs">
      {flightStats.confirmed > 0 && (
        <div>
          <span className="text-green-400">{flightStats.confirmed}</span>
          <span className="text-white/50"> confirmed</span>
        </div>
      )}
      {flightStats.shortlisted > 0 && (
        <div>
          <span className="text-yellow-400">{flightStats.shortlisted}</span>
          <span className="text-white/50"> shortlisted</span>
        </div>
      )}
      {flightStats.confirmed === 0 && flightStats.shortlisted === 0 && (
        <div>
          <span className="text-white/50">No selection yet</span>
        </div>
      )}
    </div>
  ) : undefined;

  const accommodationSubtitle = accommodationStats.total > 0 ? (
    <div className="space-y-1 text-xs">
      {accommodationStats.confirmed > 0 && (
        <div>
          <span className="text-green-400">{accommodationStats.confirmed}</span>
          <span className="text-white/50"> confirmed</span>
        </div>
      )}
      {accommodationStats.shortlisted > 0 && (
        <div>
          <span className="text-yellow-400">{accommodationStats.shortlisted}</span>
          <span className="text-white/50"> shortlisted</span>
        </div>
      )}
      {accommodationStats.confirmed === 0 && accommodationStats.shortlisted === 0 && (
        <div>
          <span className="text-white/50">No selection yet</span>
        </div>
      )}
    </div>
  ) : undefined;

  const packingSubtitle = packingStats.totalItems > 0 ? (
    <div className="space-y-1 text-xs">
      <div>
        <span className="text-green-400">{packingStats.packedItems}</span>
        <span className="text-white/50"> of </span>
        <span className="text-white/70">{packingStats.totalItems}</span>
        <span className="text-white/50"> packed</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-400 transition-all duration-300"
          style={{ width: `${packingStats.percentage}%` }}
        />
      </div>
    </div>
  ) : undefined;

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

        {/* Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Cost Forecast */}
          <HubTile
            title="Cost Forecast"
            onClick={() => {}}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Flights */}
          <HubTile
            title="Flights"
            onClick={() => router.push(`/dashboard/trip/${tripId}/flights`)}
            count={flightStats.total > 0 ? flightStats.total : undefined}
            countLabel={flightStats.total > 0 ? "Flight Options" : undefined}
            subtitle={flightSubtitle}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          />

          {/* Add Accommodations */}
          <HubTile
            title="Accommodations"
            onClick={() => router.push(`/dashboard/trip/${tripId}/accommodations`)}
            count={accommodationStats.total > 0 ? accommodationStats.total : undefined}
            countLabel={accommodationStats.total > 0 ? "Options" : undefined}
            subtitle={accommodationSubtitle}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          {/* Invite Travelers */}
          <HubTile
            title="Travelers"
            onClick={() => router.push(`/dashboard/trip/${tripId}/travelers`)}
            count={travelers.length}
            countLabel="Total Travelers"
            subtitle={travelers.length > 0 ? travelerSubtitle : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          {/* Build Itinerary */}
          <HubTile
            title="Itinerary"
            onClick={() => {}}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />

          {/* Packing Checklist */}
          <HubTile
            title="Packing"
            onClick={() => router.push(`/dashboard/trip/${tripId}/packing`)}
            count={packingStats.totalItems > 0 ? packingStats.percentage : undefined}
            countLabel={packingStats.totalItems > 0 ? "% packed" : undefined}
            subtitle={packingSubtitle}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
        </div>

        {/* Trip Notes Section */}
        <div className="mt-8">
          <TripNotesSection tripId={Number(tripId)} />
        </div>
      </div>
    </div>
  );
}