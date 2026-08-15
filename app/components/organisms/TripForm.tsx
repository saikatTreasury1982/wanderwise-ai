'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import Input from '@/app/components/ui/Input';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import DestinationSelector from '@/app/components/organisms/DestinationSelector';

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
}

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trip?: any) => void;
  trip?: Trip | null;
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

export default function TripForm({ isOpen, onClose, onSuccess, trip }: TripFormProps) {
  const isEditMode = !!trip;

  const [formData, setFormData] = useState<FormData>({
    trip_name: '', trip_description: '', destination_country: '', destination_city: '', start_date: '', end_date: '',
  });
  const [destinations, setDestinations] = useState<Array<{ country: string; city: string | null }>>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (trip) {
        let loaded: Array<{ country: string; city: string | null }> = [];
        if (trip.trip_id) {
          try {
            const res = await fetch(`/api/trips/${trip.trip_id}/destinations`);
            if (res.ok) {
              const data = await res.json();
              loaded = data.destinations.map((d: any) => ({ country: d.country, city: d.city }));
            }
          } catch (e) { console.error('Error fetching destinations:', e); }
        }
        setFormData({
          trip_name: trip.trip_name,
          trip_description: trip.trip_description || '',
          destination_country: trip.destination_country || '',
          destination_city: trip.destination_city || '',
          start_date: trip.start_date,
          end_date: trip.end_date,
        });
        setDestinations(loaded);
      } else {
        setFormData({ trip_name: '', trip_description: '', destination_country: '', destination_city: '', start_date: '', end_date: '' });
        setDestinations([]);
      }
      setErrors({});
    };
    if (isOpen) load();
  }, [trip, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.trip_name.trim()) e.trip_name = 'Trip name is required';
    if (!formData.start_date) e.start_date = 'Start date is required';
    if (!formData.end_date) e.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      e.end_date = 'End date must be after start date';
    }
    if (destinations.length === 0) e.general = 'Please add at least one destination';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const url = isEditMode ? `/api/trips/${trip!.trip_id}` : '/api/trips';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, destinations }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save trip');
      const data = await res.json();
      onSuccess(data.trip);
      onClose();
    } catch (err: any) {
      setErrors({ general: err.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Trip' : 'Plan Your Trip'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">{errors.general}</div>
        )}

        {/* Row 1 — trip name */}
        <Input
          name="trip_name" label="Trip Name" placeholder="e.g., Summer Vacation 2026"
          value={formData.trip_name} onChange={handleChange} error={errors.trip_name} variant="glass" required
        />

        {/* Row 2 — start / end date */}
        <div className="grid grid-cols-2 gap-4">
          <Input name="start_date" type="date" label="Start Date" value={formData.start_date} onChange={handleChange} error={errors.start_date} variant="glass" required />
          <Input name="end_date" type="date" label="End Date" value={formData.end_date} onChange={handleChange} error={errors.end_date} variant="glass" required />
        </div>

        {/* Row 3 — destinations */}
        <DestinationSelector
          tripId={trip?.trip_id}
          initialDestinations={destinations}
          onChange={(dests) => setDestinations(dests)}
        />

        {/* Row 4 — description */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-1">Description</label>
          <textarea
            name="trip_description" placeholder="What's this trip about?"
            value={formData.trip_description} onChange={handleChange} rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none custom-scrollbar"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <CircleIconButton type="button" variant="default" onClick={onClose} disabled={isLoading} title="Cancel"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
          <CircleIconButton type="submit" variant="primary" isLoading={isLoading} title={isEditMode ? 'Save changes' : 'Save trip'}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
        </div>
      </form>
    </Modal>
  );
}