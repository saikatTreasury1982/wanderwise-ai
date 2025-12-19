'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { useRouter } from 'next/navigation';
import DestinationSelector from '@/app/components/organisms/DestinationSelector';

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

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trip?: Trip | null; // If provided, form is in edit mode
}

interface FormData {
  trip_name: string;
  trip_description: string;
  destination_country: string;
  destination_city: string;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  trip_name?: string;
  start_date?: string;
  end_date?: string;
  general?: string;
}

export default function TripForm({
  isOpen,
  onClose,
  onSuccess,
  trip,
}: TripFormProps) {
  const isEditMode = !!trip;
  const statusCode = trip?.status_code ?? 1;
  const isDraft = statusCode === 1;
  const isActive = statusCode === 2;
  const isCompleted = statusCode === 3;
  const isSuspended = statusCode === 4;
  const isReadOnly = isCompleted;
  const isLimitedEdit = isActive || isSuspended;

  const [formData, setFormData] = useState<FormData>({
    trip_name: '',
    trip_description: '',
    destination_country: '',
    destination_city: '',
    start_date: '',
    end_date: '',
  });

  const [destinations, setDestinations] = useState<Array<{ country: string; city: string | null }>>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showDropWarning, setShowDropWarning] = useState(false);

  // Populate form when editing
  useEffect(() => {
    const loadTripData = async () => {
      if (trip) {
        setFormData({
          trip_name: trip.trip_name,
          trip_description: trip.trip_description || '',
          destination_country: trip.destination_country || '',
          destination_city: trip.destination_city || '',
          start_date: trip.start_date,
          end_date: trip.end_date,
        });
        
        // Fetch destinations for existing trips
        if (trip.trip_id) {
          try {
            const response = await fetch(`/api/trips/${trip.trip_id}/destinations`);
            if (response.ok) {
              const data = await response.json();
              setDestinations(data.destinations.map((d: any) => ({
                country: d.country,
                city: d.city
              })));
            }
          } catch (error) {
            console.error('Error fetching destinations:', error);
          }
        }
      } else {
        setFormData({
          trip_name: '',
          trip_description: '',
          destination_country: '',
          destination_city: '',
          start_date: '',
          end_date: '',
        });
        setDestinations([]);
      }
      setErrors({});
    };

    loadTripData();
  }, [trip, isOpen]);

  const fetchDestinations = async (tripId: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/destinations`);
      if (response.ok) {
        const data = await response.json();
        setDestinations(data.destinations.map((d: any) => ({
          country: d.country,
          city: d.city
        })));
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.trip_name.trim()) {
      newErrors.trip_name = 'Trip name is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (startPlanning: boolean = false) => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const url = isEditMode ? `/api/trips/${trip.trip_id}` : '/api/trips';
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = startPlanning
        ? { ...formData, destinations, status_code: 2 }
        : { ...formData, destinations };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save trip');
      }

      const data = await response.json();

      if (startPlanning) {
        onClose();
        router.push(`/dashboard/trip/${data.trip.trip_id}`);
      } else {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave(false);
  };

  const handleDropPlanning = async (deleteData: boolean) => {
    setIsLoading(true);
    setErrors({});

    try {
      const newStatusCode = deleteData ? 1 : 4; // 1 = Draft, 4 = Suspended
      
      const response = await fetch(`/api/trips/${trip!.trip_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status_code: newStatusCode,
          delete_planning_data: deleteData 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update trip');
      }

      setShowDropWarning(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumePlanning = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/trips/${trip!.trip_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_code: 2 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resume planning');
      }

      onSuccess();
      onClose();
      router.push(`/dashboard/trip/${trip!.trip_id}`);
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Trip' : 'Plan Your Trip'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {errors.general}
          </div>
        )}

        <Input
          name="trip_name"
          label="Trip Name"
          placeholder="e.g., Summer Vacation 2025"
          value={formData.trip_name}
          onChange={handleChange}
          error={errors.trip_name}
          variant="glass"
          required
          disabled={isReadOnly}
        />

        <div>
          <label className="block text-sm font-medium text-white/90 mb-1">
            Description
          </label>
          <textarea
            name="trip_description"
            placeholder="What's this trip about?"
            value={formData.trip_description}
            onChange={handleChange}
            rows={3}
            disabled={isReadOnly}
            className={`w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        <DestinationSelector
          tripId={trip?.trip_id}
          initialDestinations={destinations}
          onChange={(dests: Array<{ country: string; city: string | null }>) => setDestinations(dests)}
          readOnly={isReadOnly || isLimitedEdit}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="start_date"
            type="date"
            label="Start Date"
            value={formData.start_date}
            onChange={handleChange}
            error={errors.start_date}
            variant="glass"
            required
            disabled={isReadOnly || isLimitedEdit}
          />

          <Input
            name="end_date"
            type="date"
            label="End Date"
            value={formData.end_date}
            onChange={handleChange}
            error={errors.end_date}
            variant="glass"
            required
            disabled={isReadOnly || isLimitedEdit}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {/* Cancel/Close button - always shown */}
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 hover:border-white/30 transition-all"
            title={isCompleted ? 'Close' : 'Cancel'}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Save button - shown for Draft and Active */}
          {(isDraft || isActive) && (
            <button
              type="submit"
              className="w-12 h-12 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 hover:text-purple-200 transition-all disabled:opacity-50"
              title={isEditMode ? 'Save changes' : 'Save as draft'}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          {/* Start Planning button - shown for Draft only */}
          {isDraft && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 flex items-center justify-center text-green-300 hover:bg-green-500/30 hover:border-green-400/50 hover:text-green-200 transition-all disabled:opacity-50"
              title="Save and start planning"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Drop Planning button - shown for Active only */}
          {isActive && (
            <button
              type="button"
              onClick={() => setShowDropWarning(true)}
              className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-400/30 flex items-center justify-center text-red-300 hover:bg-red-500/30 hover:border-red-400/50 hover:text-red-200 transition-all disabled:opacity-50"
              title="Drop planning"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6M9 14h6" />
              </svg>
            </button>
          )}

          {/* Resume Planning button - shown for Suspended only */}
          {isSuspended && (
            <button
              type="button"
              onClick={handleResumePlanning}
              className="w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 flex items-center justify-center text-green-300 hover:bg-green-500/30 hover:border-green-400/50 hover:text-green-200 transition-all disabled:opacity-50"
              title="Resume planning"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </form>
      
      {/* Drop Planning Warning Modal */}
      {showDropWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDropWarning(false)} />
          <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Drop Planning?</h3>
            <p className="text-white/70 mb-6">
              This will revert the trip to Draft status. What would you like to do with your planning data?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDropPlanning(true)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 hover:border-red-400/50 transition-all disabled:opacity-50"
              >
                <span className="font-medium">Drop & Delete All Data</span>
                <p className="text-sm text-red-300/70 mt-1">Remove all itinerary, expenses, and other planning data</p>
              </button>
              
              <button
                onClick={() => handleDropPlanning(false)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/30 hover:border-yellow-400/50 transition-all disabled:opacity-50"
              >
                <span className="font-medium">Suspend Instead</span>
                <p className="text-sm text-yellow-300/70 mt-1">Keep all data but pause planning activities</p>
              </button>
              
              <button
                onClick={() => setShowDropWarning(false)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}