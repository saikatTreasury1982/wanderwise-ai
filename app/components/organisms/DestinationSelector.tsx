'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, X } from 'lucide-react';

interface Destination {
  country: string;
  city: string | null;
}

interface DestinationSelectorProps {
  tripId?: number; // If provided, saves to database
  initialDestinations?: Destination[];
  onChange?: (destinations: Destination[]) => void;
  readOnly?: boolean;
}

export default function DestinationSelector({
  tripId,
  initialDestinations = [],
  onChange,
  readOnly = false,
}: DestinationSelectorProps) {
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
  const [isAdding, setIsAdding] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDestinations(initialDestinations);
  }, [initialDestinations]);

  const handleAdd = async () => {
    if (!country.trim()) return;

    const newDestination: Destination = {
      country: country.trim(),
      city: city.trim() || null,
    };

    // If tripId is provided, save to database
    if (tripId) {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/trips/${tripId}/destinations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDestination),
        });

        if (!response.ok) {
          throw new Error('Failed to add destination');
        }

        // Refresh destinations from server
        const refreshResponse = await fetch(`/api/trips/${tripId}/destinations`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const updatedDests = data.destinations.map((d: any) => ({
            country: d.country,
            city: d.city,
          }));
          setDestinations(updatedDests);
          onChange?.(updatedDests);
        }
      } catch (error) {
        console.error('Error adding destination:', error);
        alert('Failed to add destination');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Local mode (no tripId) - just update state
      const updatedDests = [...destinations, newDestination];
      setDestinations(updatedDests);
      onChange?.(updatedDests);
    }

    // Reset form
    setCountry('');
    setCity('');
    setIsAdding(false);
  };

  const handleRemove = async (index: number) => {
    if (tripId) {
      // If we have a tripId, we need to delete from database
      // First fetch the destination_id
      try {
        const response = await fetch(`/api/trips/${tripId}/destinations`);
        if (response.ok) {
          const data = await response.json();
          const destinationToDelete = data.destinations[index];
          
          if (destinationToDelete) {
            const deleteResponse = await fetch(
              `/api/trips/${tripId}/destinations/${destinationToDelete.destination_id}`,
              { method: 'DELETE' }
            );

            if (!deleteResponse.ok) {
              throw new Error('Failed to delete destination');
            }

            // Refresh destinations
            const refreshResponse = await fetch(`/api/trips/${tripId}/destinations`);
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const updatedDests = refreshData.destinations.map((d: any) => ({
                country: d.country,
                city: d.city,
              }));
              setDestinations(updatedDests);
              onChange?.(updatedDests);
            }
          }
        }
      } catch (error) {
        console.error('Error removing destination:', error);
        alert('Failed to remove destination');
      }
    } else {
      // Local mode - just update state
      const updatedDests = destinations.filter((_, i) => i !== index);
      setDestinations(updatedDests);
      onChange?.(updatedDests);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/90">
        Destinations
      </label>

      {/* Display existing destinations */}
      <div className="flex flex-wrap gap-2">
        {destinations.map((dest, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-400/30"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-sm text-white/90">
              {dest.city ? `${dest.city}, ${dest.country}` : dest.country}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        {!readOnly && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-colors text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add destination
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Country (required)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              autoFocus
            />
            <input
              type="text"
              placeholder="City (optional)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setCountry('');
                setCity('');
              }}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!country.trim() || isSaving}
              className="px-3 py-1.5 rounded-lg bg-purple-500/30 border border-purple-400/30 text-purple-200 hover:bg-purple-500/40 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}