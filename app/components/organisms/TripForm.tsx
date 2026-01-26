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
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [allowDateEdit, setAllowDateEdit] = useState(false);

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

  const handleDropPlanning = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/trips/${trip!.trip_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status_code: 4 // Suspend trip
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to suspend trip');
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

  const handleResumePlanning = async (updateDates: boolean = false) => {
    if (updateDates) {
      // Enable date editing
      setAllowDateEdit(true);
      setShowResumeConfirm(false);
      return;
    }

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

      setShowResumeConfirm(false);
      onSuccess();
      onClose();
      router.push(`/dashboard/trip/${trip!.trip_id}`);
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWithDateUpdate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/trips/${trip!.trip_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: formData.start_date,
          end_date: formData.end_date,
          status_code: 2
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update trip');
      }

      setAllowDateEdit(false);
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
            disabled={isReadOnly || (isLimitedEdit && !allowDateEdit)}
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
            disabled={isReadOnly || (isLimitedEdit && !allowDateEdit)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
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
          {isSuspended && !allowDateEdit && (
            <button
              type="button"
              onClick={() => setShowResumeConfirm(true)}
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

          {/* Save Date Changes button - shown when editing dates for suspended trip */}
          {isSuspended && allowDateEdit && (
            <button
              type="button"
              onClick={handleSaveWithDateUpdate}
              className="w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 flex items-center justify-center text-green-300 hover:bg-green-500/30 hover:border-green-400/50 hover:text-green-200 transition-all disabled:opacity-50"
              title="Save and resume planning"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Resume Planning Confirmation Modal */}
      {showResumeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowResumeConfirm(false)} />
          <div className="relative z-10 w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-3">Resume Planning?</h3>
            <p className="text-white/90 mb-2">
              Your trip is scheduled for:
            </p>
            <div className="bg-white/10 border border-white/20 rounded-lg p-3 mb-4">
              <p className="text-white font-medium">
                {new Date(formData.start_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {' → '}
                {new Date(formData.end_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <p className="text-white/90 mb-6">
              Would you like to keep these dates or update them?
            </p>

            <div className="flex justify-center gap-4">
              {/* Keep Dates & Resume */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleResumePlanning(false)}
                  disabled={isLoading}
                  className="group w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 flex items-center justify-center text-green-300 hover:bg-green-500/30 hover:border-green-400/50 hover:text-green-200 transition-all disabled:opacity-50 relative"
                  title="Keep Dates & Resume"
                >
                  {isLoading ? (
                    <div className="w-7 h-7 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {/* Tooltip */}
                  <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    <div className="font-medium mb-1">Keep Dates & Resume</div>
                    <div className="text-white/70">Continue with current trip dates</div>
                  </div>
                </button>
              </div>

              {/* Update Dates */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleResumePlanning(true)}
                  disabled={isLoading}
                  className="group w-12 h-12 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 hover:text-purple-200 transition-all disabled:opacity-50 relative"
                  title="Update Dates"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {/* Tooltip */}
                  <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    <div className="font-medium mb-1">Update Dates</div>
                    <div className="text-white/70">Edit start and end dates before resuming</div>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setShowResumeConfirm(false)}
                  disabled={isLoading}
                  className="group w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 relative"
                  title="Cancel"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {/* Tooltip */}
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-32 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    <div className="font-medium">Cancel</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drop Planning Confirmation Modal */}
      {showDropWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDropWarning(false)} />
          <div className="relative z-10 w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-3">Suspend Trip?</h3>
            <p className="text-white/90 mb-4">
              This trip will be suspended and all planning data will be retained.
            </p>
            <p className="text-white/70 text-sm mb-6">
              You can resume planning or permanently delete this trip later from the dashboard.
            </p>

            <div className="flex justify-center gap-4">
              {/* Yes - Suspend */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleDropPlanning}
                  disabled={isLoading}
                  className="group w-12 h-12 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/30 hover:border-yellow-400/50 hover:text-yellow-200 transition-all disabled:opacity-50 relative"
                  title="Yes, Suspend"
                >
                  {isLoading ? (
                    <div className="w-7 h-7 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {/* Tooltip */}
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    <div className="font-medium">Yes, Suspend Trip</div>
                  </div>
                </button>
              </div>

              {/* No - Cancel */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setShowDropWarning(false)}
                  disabled={isLoading}
                  className="group w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 relative"
                  title="No, Cancel"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {/* Tooltip */}
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    <div className="font-medium">No, Cancel</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}