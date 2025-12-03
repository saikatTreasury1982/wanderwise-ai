'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/components/ui/PageBackground';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import FlightEntryForm from '@/components/organisms/FlightEntryForm';
import FlightOptionCard from '@/components/organisms/FlightOptionCard';
import type { FlightOption } from '@/app/lib/types/flight';
import { formatDateRange } from '@/app/lib/utils';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
}

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_active: number;
}

interface Currency {
  currency_code: string;
  currency_name: string;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function FlightsPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({
    date_format: 'YYYY-MM-DD',
  });

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
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    }
  };

  const fetchFlights = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/flights`);
      if (response.ok) {
        const data = await response.json();
        setFlights(data);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const fetchTravelers = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/travelers`);
      if (response.ok) {
        const data = await response.json();
        setTravelers(data.travelers);
      }
    } catch (error) {
      console.error('Error fetching travelers:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies');
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.currencies);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
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
      await Promise.all([fetchTrip(), fetchFlights(), fetchTravelers(), fetchCurrencies(), fetchPreferences()]);
      setIsLoading(false);
    };
    loadData();
  }, [tripId]);

  const handleEdit = (flight: FlightOption) => {
    setSelectedFlight(flight);
    setShowForm(true);
  };

  const handleCopy = async (flight: FlightOption) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/flights/${flight.flight_option_id}`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchFlights();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to copy flight');
      }
    } catch (error) {
      console.error('Error copying flight:', error);
      alert('Failed to copy flight');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (flightId: number) => {
    if (!confirm('Are you sure you want to delete this flight option?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/flights/${flightId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchFlights();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete flight');
      }
    } catch (error) {
      console.error('Error deleting flight:', error);
      alert('Failed to delete flight');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (flightId: number, status: FlightOption['status']) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/flights/${flightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchFlights();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSuccess = () => {
    fetchFlights();
    setSelectedFlight(null);
    setShowForm(false);
  };

  const handleFormClear = () => {
    setSelectedFlight(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setSelectedFlight(null);
    setShowForm(true);
  };

  // Group flights for display
  const confirmedFlights = flights.filter(f => f.status === 'confirmed');
  const shortlistedFlights = flights.filter(f => f.status === 'shortlisted');
  const draftFlights = flights.filter(f => f.status === 'draft');
  const notSelectedFlights = flights.filter(f => f.status === 'not_selected');

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
    <div className="min-h-screen relative p-6 pb-24">
      <PageBackground />
      <LoadingOverlay isLoading={isProcessing} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Hub
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">Flight Options</h1>
          <p className="text-white/70 text-lg">
            {[
              trip.trip_name,
              destination,
              formatDateRange(trip.start_date, trip.end_date, preferences.date_format)
            ].filter(Boolean).join(' | ')}
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Form (conditional) */}
          {showForm && (
            <div>
              <FlightEntryForm
                tripId={parseInt(tripId)}
                flight={selectedFlight}
                travelers={travelers}
                currencies={currencies}
                onSuccess={handleFormSuccess}
                onClear={handleFormClear}
              />
            </div>
          )}

          {/* Right column - Flights list */}
          <div className={showForm ? '' : 'lg:col-span-2'}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Saved Options ({flights.length})
              </h3>
            </div>

            {flights.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <p className="text-white/70 mb-2">No flight options yet.</p>
                <p className="text-white/50 text-sm">Click the + button to add your first flight option.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Confirmed */}
                {confirmedFlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Confirmed</h4>
                    <div className="space-y-3">
                      {confirmedFlights.map(flight => (
                        <FlightOptionCard
                          key={flight.flight_option_id}
                          flight={flight}
                          onEdit={handleEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Shortlisted */}
                {shortlistedFlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400 mb-2">Shortlisted</h4>
                    <div className="space-y-3">
                      {shortlistedFlights.map(flight => (
                        <FlightOptionCard
                          key={flight.flight_option_id}
                          flight={flight}
                          onEdit={handleEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Draft */}
                {draftFlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Draft</h4>
                    <div className="space-y-3">
                      {draftFlights.map(flight => (
                        <FlightOptionCard
                          key={flight.flight_option_id}
                          flight={flight}
                          onEdit={handleEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Selected */}
                {notSelectedFlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">Not Selected</h4>
                    <div className="space-y-3">
                      {notSelectedFlights.map(flight => (
                        <FlightOptionCard
                          key={flight.flight_option_id}
                          flight={flight}
                          onEdit={handleEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      {!showForm && (
        <FloatingActionButton
          onClick={handleAddNew}
          ariaLabel="Add flight option"
        />
      )}
    </div>
  );
}