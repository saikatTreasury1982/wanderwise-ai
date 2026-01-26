'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, X, Search } from 'lucide-react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';


interface Destination {
  country: string;
  city: string | null;
  country_code?: string;
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
  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    setDestinations(initialDestinations);
  }, [initialDestinations]);

  const handleCountryLookup = async () => {
    if (!country.trim()) {
      setLookupError('Please enter a country name');
      return;
    }

    // Validate English alphabets only
    if (!/^[a-zA-Z\s]+$/.test(country)) {
      setLookupError('Country name must contain only English letters');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');

    try {
      const response = await fetch(`/api/country-lookup?country=${encodeURIComponent(country.trim())}`);
      const data = await response.json();

      if (data.success) {
        setCountryCode(data.code);
        setCountry(data.name); // Use standardized name from API
        setLookupError('');
      } else {
        setLookupError(data.error || 'Country not found. Please check spelling.');
        setCountryCode('');
      }
    } catch (error) {
      console.error('Country lookup error:', error);
      setLookupError('Failed to lookup country. Please try again.');
      setCountryCode('');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAdd = async () => {
    if (!country.trim() || !countryCode) {
      alert('Please lookup the country first');
      return;
    }

    const newDestination: Destination = {
      country: country.trim(),
      city: city.trim() || null,
      country_code: countryCode,
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
            country_code: d.country_code,
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
    setCountryCode('');
    setCity('');
    setLookupError('');
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
                country_code: d.country_code,
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

  const handleCancelAdd = () => {
    setIsAdding(false);
    setCountry('');
    setCountryCode('');
    setCity('');
    setLookupError('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/90">
        Destinations {destinations.length === 0 && <span className="text-red-400">*</span>}
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
              {dest.country_code && (
                <span className="ml-1.5 text-xs text-purple-300">({dest.country_code})</span>
              )}
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
        <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
          {/* Country, Lookup, City - All in one row */}
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Country (required)"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setLookupError('');
                  setCountryCode(''); // Reset code when user types
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                autoFocus
                disabled={isLookingUp}
              />
              {/* ISO code result below country input */}
              {countryCode && (
                <div className="mt-1 text-xs text-green-400">
                  ISO Country code: {countryCode}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleCountryLookup}
              disabled={isLookingUp || !country.trim()}
              className="p-2 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-0.5"
              title={isLookingUp ? 'Looking up...' : 'Lookup country code'}
            >
              {isLookingUp ? (
                <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1">
              <input
                type="text"
                placeholder={countryCode ? "City (optional)" : "Lookup country first..."}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!countryCode}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Error message */}
          {lookupError && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
              {lookupError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancelAdd}
              disabled={isSaving}
              className="p-2 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!countryCode || isSaving}
              className="p-2 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSaving ? 'Adding...' : 'Add destination'}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}