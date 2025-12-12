'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import AccommodationEntryForm from '@/app/components/organisms/AccommodationEntryForm';
import AccommodationOptionCard from '@/app/components/organisms/AccommodationOptionCard';
import AccommodationViewModal from '@/app/components/organisms/AccommodationViewModal';
import { formatDateRange } from '@/app/lib/utils';
import type { AccommodationOption, AccommodationType } from '@/app/lib/types/accommodation';

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

export default function AccommodationsPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accommodationTypes, setAccommodationTypes] = useState<AccommodationType[]>([]);
  const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({
    date_format: 'YYYY-MM-DD',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<AccommodationOption | null>(null);
  const [viewingAccommodation, setViewingAccommodation] = useState<AccommodationOption | null>(null);

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/accommodations`);
      if (response.ok) {
        const data = await response.json();
        setAccommodations(data);
      }
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    }
  };

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

        // Fetch accommodations
        await fetchAccommodations();

        // Fetch travelers
        const travelersResponse = await fetch(`/api/trips/${tripId}/travelers`);
        if (travelersResponse.ok) {
          const travelersData = await travelersResponse.json();
          setTravelers(travelersData.travelers);
        }

        // Fetch currencies
        const currenciesResponse = await fetch('/api/currencies');
        if (currenciesResponse.ok) {
          const currenciesData = await currenciesResponse.json();
          setCurrencies(currenciesData.currencies || currenciesData || []);
        }

        // Fetch accommodation types
        const typesResponse = await fetch('/api/accommodation-types');
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setAccommodationTypes(typesData);
        }

        // Fetch preferences
        const prefResponse = await fetch('/api/user/preferences');
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          setPreferences(prefData.preferences);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tripId, router]);

  const handleView = (accommodation: AccommodationOption) => {
    setViewingAccommodation(accommodation);
  };

  const handleEdit = (accommodation: AccommodationOption) => {
    setEditingAccommodation(accommodation);
    setShowForm(true);
  };

  const handleCopy = async (accommodation: AccommodationOption) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/accommodations/${accommodation.accommodation_option_id}`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchAccommodations();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to copy accommodation');
      }
    } catch (error) {
      console.error('Error copying accommodation:', error);
      alert('Failed to copy accommodation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (accommodationId: number) => {
    if (!confirm('Are you sure you want to delete this accommodation?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/accommodations/${accommodationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchAccommodations();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete accommodation');
      }
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      alert('Failed to delete accommodation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (accommodationId: number, status: AccommodationOption['status']) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/accommodations/${accommodationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchAccommodations();
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
    fetchAccommodations();
    setShowForm(false);
    setEditingAccommodation(null);
  };

  const handleFormClear = () => {
    setShowForm(false);
    setEditingAccommodation(null);
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

  if (!trip) return null;

  const destination = [trip.destination_city, trip.destination_country].filter(Boolean).join(', ');

  // Group accommodations by status
  const confirmedAccommodations = accommodations.filter(a => a.status === 'confirmed');
  const shortlistedAccommodations = accommodations.filter(a => a.status === 'shortlisted');
  const draftAccommodations = accommodations.filter(a => a.status === 'draft');
  const notSelectedAccommodations = accommodations.filter(a => a.status === 'not_selected');

  const renderAccommodationGroup = (title: string, items: AccommodationOption[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-3">{title}</h3>
        <div className="space-y-3">
          {items.map(accommodation => (
            <AccommodationOptionCard
              key={accommodation.accommodation_option_id}
              accommodation={accommodation}
              onView={handleView}
              onEdit={handleEdit}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative p-6 pb-24">
      <PageBackground />
      <LoadingOverlay isLoading={isProcessing} />

      <div className="relative z-10 max-w-5xl mx-auto">
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

          <h1 className="text-3xl font-bold text-white mb-3">Flight Options</h1>
          <p className="text-white/70 text-lg mb-3">{trip.trip_name}</p>
          
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

        {/* Content */}
        <div className="flex gap-6">
          {/* Form Column */}
          {showForm && (
            <div className="w-full md:w-1/2 lg:w-2/5">
              <AccommodationEntryForm
                tripId={Number(tripId)}
                accommodation={editingAccommodation}
                travelers={travelers}
                currencies={currencies}
                accommodationTypes={accommodationTypes}
                onSuccess={handleFormSuccess}
                onClear={handleFormClear}
              />
            </div>
          )}

          {/* Accommodations List */}
          <div className={showForm ? 'w-full md:w-1/2 lg:w-3/5' : 'w-full'}>
            {accommodations.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-white/30"
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
                <h3 className="text-xl font-semibold text-white mb-2">No accommodations yet</h3>
                <p className="text-white/60">Click the + button to add accommodation options</p>
              </div>
            ) : (
              <>
                {renderAccommodationGroup('Confirmed', confirmedAccommodations)}
                {renderAccommodationGroup('Shortlisted', shortlistedAccommodations)}
                {renderAccommodationGroup('Draft', draftAccommodations)}
                {renderAccommodationGroup('Not Selected', notSelectedAccommodations)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      {!showForm && (
        <FloatingActionButton
          onClick={() => {
            setEditingAccommodation(null);
            setShowForm(true);
          }}
          ariaLabel="Add accommodation"
        />
      )}

      {/* Accommodation View Modal */}
      <AccommodationViewModal
        isOpen={viewingAccommodation !== null}
        onClose={() => setViewingAccommodation(null)}
        accommodation={viewingAccommodation}
      />
    </div>
  );
}