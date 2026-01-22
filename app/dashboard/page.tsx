'use client';

import { useState, useEffect } from 'react';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import TripCard from '@/app/components/organisms/TripCard';
import TripForm from '@/app/components/organisms/TripForm';
import EmptyState from '@/app/components/organisms/EmptyState';
import { useRouter } from 'next/navigation';
import TripSummaryModal from '@/app/components/organisms/TripSummaryModal';
import PackingAlertWidget from '@/app/components/organisms/PackingAlertWidget';

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

interface TripStatus {
  status_code: number;
  status_name: string;
}

interface UserPreferences {
  date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  time_format: string;
  decimal_places: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    decimal_places: 2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [statuses, setStatuses] = useState<TripStatus[]>([]);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [destinationsMap, setDestinationsMap] = useState<Map<number, string[]>>(new Map());

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips);

        // Fetch destinations for each trip
        const destMap = new Map<number, string[]>();

        for (const trip of data.trips) {
          try {
            const destResponse = await fetch(`/api/trips/${trip.trip_id}/destinations`);

            if (destResponse.ok) {
              const destData = await destResponse.json();

              if (destData.destinations && destData.destinations.length > 0) {
                const destinations = destData.destinations.map((d: any) =>
                  d.city ? `${d.city}, ${d.country}` : d.country
                );
                destMap.set(trip.trip_id, destinations);
              }
            }
          } catch (err) {
            console.error(`Error fetching destinations for trip ${trip.trip_id}:`, err);
          }
        }

        setDestinationsMap(destMap);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/statuses');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.statuses);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrips(), fetchPreferences(), fetchStatuses()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setIsFormOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsFormOpen(true);
  };

  const handleDeleteTrip = async (tripId: number) => {
    const confirmed = confirm(
      'Are you sure you want to permanently delete this trip?\n\n' +
      'All trip data including itinerary, expenses, travelers, and packing lists will be permanently removed.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTrips();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip');
    }
  };

  const handleStartPlanning = async (tripId: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_code: 2 }),
      });

      if (response.ok) {
        router.push(`/dashboard/trip/${tripId}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to start planning');
      }
    } catch (error) {
      console.error('Error starting planning:', error);
      alert('Failed to start planning');
    }
  };

  const handleStatusChange = async (tripId: number, newStatus: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_code: newStatus }),
      });

      if (response.ok) {
        await fetchTrips();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update trip status');
      }
    } catch (error) {
      console.error('Error updating trip status:', error);
      alert('Failed to update trip status');
    }
  };

  const handleCardClick = (tripId: number) => {
    router.push(`/dashboard/trip/${tripId}`);
  };

  const handleViewTrip = (trip: Trip) => {
    setViewingTrip(trip);
  };

  const handleCloseView = () => {
    setViewingTrip(null);
  };

  const handleFormSuccess = () => {
    fetchTrips();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTrip(null);
  };

  // Get unique years from trips
  const getUniqueYears = (): string[] => {
    const years = trips.map(trip => new Date(trip.start_date).getFullYear().toString());
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a)); // Descending order
  };


  // Get unique destinations from trips
  const getUniqueDestinations = (): string[] => {
    const destinations = new Set<string>();

    trips.forEach(trip => {
      const tripDests = destinationsMap.get(trip.trip_id) || [];
      tripDests.forEach(dest => destinations.add(dest));
    });

    return Array.from(destinations).sort();
  };

  // Filter trips based on selected filters
  const getFilteredTrips = (): Trip[] => {
    return trips.filter(trip => {
      // Filter by year
      if (filterYear !== 'all') {
        const tripYear = new Date(trip.start_date).getFullYear().toString();
        if (tripYear !== filterYear) return false;
      }

      // Filter by destination
      if (filterDestination !== 'all') {
        const tripDests = destinationsMap.get(trip.trip_id) || [];
        if (!tripDests.includes(filterDestination)) return false;
      }

      return true;
    });
  };

  const clearFilters = () => {
    setFilterYear('all');
    setFilterDestination('all');
  };

  const uniqueYears = getUniqueYears();
  const uniqueDestinations = getUniqueDestinations();
  const filteredTrips = getFilteredTrips();
  const hasActiveFilters = filterYear !== 'all' || filterDestination !== 'all';

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

  const hasTrips = trips.length > 0;

  return (
    <div className="min-h-screen relative p-6">
      <PageBackground />

      <div className="relative z-10 max-w-3xl mx-auto">
        {hasTrips ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white">My Trips</h1>

              {/* Filter Pills */}
              {trips.length > 1 && (
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  {/* Year Filter */}
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/15 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value="all">All Years</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  {/* Destination Filter */}
                  <select
                    value={filterDestination}
                    onChange={(e) => setFilterDestination(e.target.value)}
                    className="px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/15 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value="all">All Destinations</option>
                    {uniqueDestinations.map(dest => (
                      <option key={dest} value={dest}>{dest}</option>
                    ))}
                  </select>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all group"
                      title="Clear filters"
                    >
                      <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* Active Filter Count */}
                  {hasActiveFilters && (
                    <span className="text-sm text-white/60">
                      {filteredTrips.length} of {trips.length} trip{trips.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Packing Alerts */}
            <PackingAlertWidget />

            {/* Trip Cards */}
            <div className="space-y-4">
              {filteredTrips.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 text-lg mb-4">No trips match your filters</p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.trip_id}
                    trip={trip}
                    dateFormat={preferences.date_format}
                    statuses={statuses}
                    onEdit={handleEditTrip}
                    onDelete={handleDeleteTrip}
                    onStartPlanning={handleStartPlanning}
                    onStatusChange={handleStatusChange}
                    onCardClick={handleCardClick}
                    onView={handleViewTrip}
                  />
                ))
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => router.push('/dashboard/preferences')}
              className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors shadow-lg"
              title="Preferences"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* FAB */}
            <FloatingActionButton
              onClick={handleCreateTrip}
              ariaLabel="Create new trip"
            />
          </>
        ) : (
          <EmptyState onCreateTrip={handleCreateTrip} />
        )}
      </div>

      {/* Trip Form Modal */}
      <TripForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        trip={editingTrip}
      />

      {/* Trip Summary Modal */}
      <TripSummaryModal
        isOpen={viewingTrip !== null}
        onClose={handleCloseView}
        trip={viewingTrip}
        dateFormat={preferences.date_format}
        statuses={statuses}
      />
    </div>
  );
}