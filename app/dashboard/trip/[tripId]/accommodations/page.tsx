'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import AccommodationEntryForm from '@/app/components/organisms/AccommodationEntryForm';
import AccommodationComparisonTable from '@/app/components/organisms/AccommodationComparisonTable';
import RecommendationSlider from '@/app/components/organisms/RecommendationSlider';
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
  is_cost_sharer: number;
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
  const [showRecommendationSlider, setShowRecommendationSlider] = useState(false);

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
        const tripResponse = await fetch(`/api/trips/${tripId}`);
        if (tripResponse.status === 401) { router.push('/login'); return; }
        if (tripResponse.status === 404) { router.push('/dashboard'); return; }
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          setTrip(tripData.trip);
        }

        await fetchAccommodations();

        const travelersResponse = await fetch(`/api/trips/${tripId}/travelers`);
        if (travelersResponse.ok) {
          const travelersData = await travelersResponse.json();
          setTravelers(travelersData.travelers);
        }

        const currenciesResponse = await fetch('/api/currencies');
        if (currenciesResponse.ok) {
          const currenciesData = await currenciesResponse.json();
          setCurrencies(currenciesData.currencies || currenciesData || []);
        }

        const typesResponse = await fetch('/api/accommodation-types');
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setAccommodationTypes(typesData);
        }

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

  const handleEdit = (accommodation: AccommodationOption) => {
    setEditingAccommodation(accommodation);
    setShowForm(true);
  };

  const handleDelete = async (accommodationId: number) => {
    if (!confirm('Are you sure you want to delete this accommodation?')) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/accommodations/${accommodationId}`, { method: 'DELETE' });
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
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const destination = [trip.destination_city, trip.destination_country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen relative p-4 sm:p-6 pb-24">
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

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Lodging Options</h1>
          <p className="text-white/70 text-base sm:text-lg mb-3">{trip.trip_name}</p>

          <div className="flex flex-wrap items-center gap-3">
            {destination && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{destination}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 rounded-full border border-primary-400/30">
                  <span className="text-sm font-medium text-primary-200">{days}D / {nights}N</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {showForm && (
            <AccommodationEntryForm
              tripId={Number(tripId)}
              accommodation={editingAccommodation}
              travelers={travelers}
              currencies={currencies}
              accommodationTypes={accommodationTypes}
              onSuccess={handleFormSuccess}
              onClear={handleFormClear}
            />
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Saved Options ({accommodations.length})
              </h3>

              <div className="relative">
                <div className="absolute inset-0 bg-primary-500/40 rounded-full blur-md animate-pulse" />
                <CircleIconButton
                  variant="default"
                  onClick={() => setShowRecommendationSlider(true)}
                  title="Smart Suggestions"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  }
                />
              </div>
            </div>

            <AccommodationComparisonTable
              accommodations={accommodations}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>

      {!showForm && (
        <FloatingActionButton
          onClick={() => {
            setEditingAccommodation(null);
            setShowForm(true);
          }}
          ariaLabel="Add accommodation"
        />
      )}

      <RecommendationSlider
        isOpen={showRecommendationSlider}
        onClose={() => setShowRecommendationSlider(false)}
        type="accommodations"
        tripId={parseInt(tripId)}
        onAddRecommendation={(rec: any) => {
          const prefilledAccommodation: AccommodationOption = {
            accommodation_option_id: 0,
            trip_id: parseInt(tripId),
            type_name: rec.accommodation_type,
            accommodation_name: rec.property_name,
            address: null,
            location: null,
            check_in_date: rec.check_in_date,
            check_in_time: null,
            check_out_date: rec.check_out_date,
            check_out_time: null,
            num_rooms: 1,
            price_per_night: rec.nights > 0 ? rec.total_price / rec.nights : null,
            total_price: rec.total_price,
            currency_code: rec.currency_code,
            status: 'draft',
            booking_reference: null,
            booking_source: null,
            notes: `Recommended from: ${rec.source.trip_name}`,
            travelers: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setEditingAccommodation(prefilledAccommodation);
          setShowForm(true);
          setShowRecommendationSlider(false);
        }}
      />
    </div>
  );
}