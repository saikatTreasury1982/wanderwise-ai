'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  trip_status: 'draft' | 'active' | 'completed' | 'cancelled';
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

  const [formData, setFormData] = useState<FormData>({
    trip_name: '',
    trip_description: '',
    destination_country: '',
    destination_city: '',
    start_date: '',
    end_date: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (trip) {
      setFormData({
        trip_name: trip.trip_name,
        trip_description: trip.trip_description || '',
        destination_country: trip.destination_country || '',
        destination_city: trip.destination_city || '',
        start_date: trip.start_date,
        end_date: trip.end_date,
      });
    } else {
      setFormData({
        trip_name: '',
        trip_description: '',
        destination_country: '',
        destination_city: '',
        start_date: '',
        end_date: '',
      });
    }
    setErrors({});
  }, [trip, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const url = isEditMode ? `/api/trips/${trip.trip_id}` : '/api/trips';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save trip');
      }

      onSuccess();
      onClose();
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
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="destination_country"
            label="Country"
            placeholder="e.g., Japan"
            value={formData.destination_country}
            onChange={handleChange}
            variant="glass"
          />

          <Input
            name="destination_city"
            label="City"
            placeholder="e.g., Tokyo"
            value={formData.destination_city}
            onChange={handleChange}
            variant="glass"
          />
        </div>

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
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="flex-1"
          >
            {isEditMode ? 'Save Changes' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}