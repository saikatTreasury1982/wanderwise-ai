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
  const [itineraryStats, setItineraryStats] = useState<{ daysPlanned: number; totalDays: number; activitiesCount: number }>({ daysPlanned: 0, totalDays: 0, activitiesCount: 0 });
  const [costForecastStats, setCostForecastStats] = useState<{ totalCost: number; baseCurrency: string; itemsCount: number; lastCollected: string | null }>({ totalCost: 0, baseCurrency: '', itemsCount: 0, lastCollected: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        let tripData: any = null;
        
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
          tripData = await tripResponse.json();
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

        // Fetch itinerary stats
        const itineraryResponse = await fetch(`/api/trips/${tripId}/itinerary`);
        if (itineraryResponse.ok) {
          const itineraryData = await itineraryResponse.json();
          const daysPlanned = itineraryData.length;
          const activitiesCount = itineraryData.reduce((sum: number, day: any) => {
            return sum + (day.categories?.reduce((catSum: number, cat: any) => catSum + (cat.activities?.length || 0), 0) || 0);
          }, 0);
          
          // Calculate total days from trip dates (use tripData which we already fetched)
          let totalDays = 0;
          if (tripData?.trip) {
            const start = new Date(tripData.trip.start_date);
            const end = new Date(tripData.trip.end_date);
            totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          }
          
          setItineraryStats({ daysPlanned, totalDays, activitiesCount });
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

        // Fetch cost forecast stats
        const costForecastResponse = await fetch(`/api/trips/${tripId}/cost-forecast`);
        if (costForecastResponse.ok) {
          const costData = await costForecastResponse.json();
          const itemsCount = costData.module_breakdown?.reduce((sum: number, m: any) => sum + m.items_count, 0) || 0;
          setCostForecastStats({
            totalCost: costData.total_cost || 0,
            baseCurrency: costData.base_currency || '',
            itemsCount,
            lastCollected: costData.generated_at || null,
          });
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

  const itinerarySubtitle = itineraryStats.daysPlanned > 0 ? (
    <div className="space-y-1 text-xs">
      <div>
        <span className="text-green-400">{itineraryStats.daysPlanned}</span>
        <span className="text-white/50"> of </span>
        <span className="text-white/70">{itineraryStats.totalDays}</span>
        <span className="text-white/50"> days planned</span>
      </div>
      {itineraryStats.activitiesCount > 0 && (
        <div>
          <span className="text-purple-400">{itineraryStats.activitiesCount}</span>
          <span className="text-white/50"> activities</span>
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

    const costForecastSubtitle = costForecastStats.totalCost > 0 ? (
      <div className="space-y-1">
        <div>
          <span className="text-green-400 text-sm font-bold">{costForecastStats.baseCurrency} {costForecastStats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="text-xs">
          <span className="text-purple-400">{costForecastStats.itemsCount}</span>
          <span className="text-white/50"> items</span>
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

          <h1 className="text-3xl font-bold text-white mb-3">{trip.trip_name}</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            {destination && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{destination}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, preferences.date_format)}</span>
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
          </div>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Cost Forecast */}
          <HubTile
            title="Cost Forecast"
            onClick={() => router.push(`/dashboard/trip/${tripId}/cost-forecast`)}
            count={costForecastStats.itemsCount > 0 ? costForecastStats.itemsCount : undefined}
            countLabel={costForecastStats.itemsCount > 0 ? "Items" : undefined}
            subtitle={costForecastSubtitle}
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
            onClick={() => router.push(`/dashboard/trip/${tripId}/itinerary`)}
            count={itineraryStats.daysPlanned > 0 ? itineraryStats.daysPlanned : undefined}
            countLabel={itineraryStats.daysPlanned > 0 ? "Days Planned" : undefined}
            subtitle={itinerarySubtitle}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />

          {/* Packing Checklist */}
          <HubTile
            title="Checklist"
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