'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/components/ui/PageBackground';
import TravelerForm from '@/components/organisms/TravelerForm';
import TravelerCard from '@/components/organisms/TravelerCard';

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

          <h1 className="text-3xl font-bold text-white mb-2">Travelers</h1>
          <p className="text-white/70 text-lg">{trip.trip_name}</p>
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