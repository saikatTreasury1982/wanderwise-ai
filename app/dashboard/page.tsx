'use client';

import { useState, useEffect } from 'react';
import PageBackground from '@/components/ui/PageBackground';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import TripCard from '@/components/organisms/TripCard';
import TripForm from '@/components/organisms/TripForm';
import EmptyState from '@/components/organisms/EmptyState';
import { useRouter } from 'next/navigation';
import TripSummaryModal from '@/components/organisms/TripSummaryModal';

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
    if (!confirm('Are you sure you want to delete this trip?')) return;

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
            </div>

            {/* Trip Cards */}
            <div className="space-y-4">
              {trips.map((trip) => (
                <TripCard
                  key={trip.trip_id}
                  trip={trip}
                  dateFormat={preferences.date_format}
                  statuses={statuses}
                  onEdit={handleEditTrip}
                  onDelete={handleDeleteTrip}
                  onStartPlanning={handleStartPlanning}
                  onCardClick={handleCardClick}
                  onView={handleViewTrip}
                />
              ))}
            </div>

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