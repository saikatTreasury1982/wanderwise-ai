'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import TravelerForm from '@/app/components/organisms/TravelerForm';
import TravelerCard from '@/app/components/organisms/TravelerCard';
import { formatDateRange } from '@/app/lib/utils';

interface Traveler {
  traveler_id: number;
  trip_id: number;
  traveler_name: string;
  traveler_email: string | null;
  relationship: string | null;
  is_primary: number;
  is_cost_sharer: number;
  traveler_currency: string | null;
  is_active: number;
}

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
}

interface Relationship {
  relationship_code: string;
  relationship_name: string;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function TravelersPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');

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

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/relationships');
      if (response.ok) {
        const data = await response.json();
        setRelationships(data.relationships);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrip(), fetchTravelers(), fetchRelationships()]);
      
      // Fetch user preferences
      try {
        const prefRes = await fetch('/api/user/preferences');
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          setDateFormat(prefData.preferences?.date_format || 'DD Mmm YYYY');
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
      
      setIsLoading(false);
    };
    loadData();
  }, [tripId]);

  const handleEdit = (traveler: Traveler) => {
    setSelectedTraveler(traveler);
  };

  const handleCopy = (traveler: Traveler) => {
    // Copy traveler data but remove ID to create new
    setSelectedTraveler({
      ...traveler,
      traveler_id: 0, // Reset ID for new entry
      traveler_name: `${traveler.traveler_name} (Copy)`,
      relationship: traveler.relationship === 'self' ? '' : traveler.relationship,
      is_primary: 0,
    });
  };

  const handleDelete = async (travelerId: number) => {
    if (!confirm('Are you sure you want to delete this traveler?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/travelers/${travelerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTravelers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete traveler');
      }
    } catch (error) {
      console.error('Error deleting traveler:', error);
      alert('Failed to delete traveler');
    }
  };

  const handleFormSuccess = () => {
    fetchTravelers();
  };

  const handleFormClear = () => {
    setSelectedTraveler(null);
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

  if (!trip) {
    return null;
  }

  return (
    <div className="min-h-screen relative p-6">
      <PageBackground />

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

          <h1 className="text-3xl font-bold text-white mb-3">Travelers</h1>
          <p className="text-white/70 text-lg mb-3">{trip.trip_name}</p>
          
          <div className="flex flex-wrap items-center gap-3">
            {(trip.destination_city || trip.destination_country) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{[trip.destination_city, trip.destination_country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
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

        {/* Main content - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Form */}
          <div>
            <TravelerForm
              tripId={parseInt(tripId)}
              traveler={selectedTraveler}
              onSuccess={handleFormSuccess}
              onClear={handleFormClear}
            />
          </div>

          {/* Right column - Travelers list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Travelers ({travelers.length})
              </h3>
            </div>

            {travelers.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                <p className="text-white/70">No travelers added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {travelers.map((traveler) => (
                  <TravelerCard
                    key={traveler.traveler_id}
                    traveler={traveler}
                    relationships={relationships}
                    onEdit={handleEdit}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}