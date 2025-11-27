'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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

interface TravelerFormProps {
  tripId: number;
  traveler?: Traveler | null;
  onSuccess: () => void;
  onClear: () => void;
}

interface FormData {
  traveler_name: string;
  traveler_email: string;
  relationship: string;
  traveler_currency: string;
  is_primary: boolean;
  is_cost_sharer: boolean;
  is_active: boolean;
}

interface FormErrors {
  traveler_name?: string;
  general?: string;
}

const relationships = [
  { value: '', label: 'Select relationship' },
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'family', label: 'Family' },
  { value: 'colleague', label: 'Colleague' },
];

export default function TravelerForm({
  tripId,
  traveler,
  onSuccess,
  onClear,
}: TravelerFormProps) {
  const isEditMode = !!traveler?.traveler_id;

  const [formData, setFormData] = useState<FormData>({
    traveler_name: '',
    traveler_email: '',
    relationship: '',
    traveler_currency: '',
    is_primary: false,
    is_cost_sharer: true,
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when editing or copying
  useEffect(() => {
    if (traveler) {
      setFormData({
        traveler_name: traveler.traveler_name || '',
        traveler_email: traveler.traveler_email || '',
        relationship: traveler.relationship || '',
        traveler_currency: traveler.traveler_currency || '',
        is_primary: traveler.is_primary === 1,
        is_cost_sharer: traveler.is_cost_sharer === 1,
        is_active: traveler.is_active === 1,
      });
    }
    setErrors({});
  }, [traveler]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.traveler_name.trim()) {
      newErrors.traveler_name = 'Traveler name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClear = () => {
    setFormData({
      traveler_name: '',
      traveler_email: '',
      relationship: '',
      traveler_currency: '',
      is_primary: false,
      is_cost_sharer: true,
      is_active: true,
    });
    setErrors({});
    onClear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const url = isEditMode
        ? `/api/trips/${tripId}/travelers/${traveler.traveler_id}`
        : `/api/trips/${tripId}/travelers`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save traveler');
      }

      handleClear();
      onSuccess();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">
        {isEditMode ? 'Edit Traveler' : 'Add Traveler'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {errors.general}
          </div>
        )}

        <Input
          name="traveler_name"
          label="Name"
          placeholder="e.g., John Doe"
          value={formData.traveler_name}
          onChange={handleChange}
          error={errors.traveler_name}
          variant="glass"
          required
        />

        <Input
          name="traveler_email"
          type="email"
          label="Email"
          placeholder="e.g., john@example.com"
          value={formData.traveler_email}
          onChange={handleChange}
          variant="glass"
        />

        <div>
          <label className="block text-sm font-medium text-white/90 mb-1">
            Relationship
          </label>
          <select
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            {relationships.map((rel) => (
              <option key={rel.value} value={rel.value} className="bg-gray-800 text-white">
                {rel.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          name="traveler_currency"
          label="Currency"
          placeholder="e.g., USD"
          value={formData.traveler_currency}
          onChange={handleChange}
          variant="glass"
        />

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_primary"
              checked={formData.is_primary}
              onChange={handleChange}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-400 focus:ring-offset-0"
            />
            <span className="text-white/90">Primary Traveler</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_cost_sharer"
              checked={formData.is_cost_sharer}
              onChange={handleChange}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-400 focus:ring-offset-0"
            />
            <span className="text-white/90">Cost Sharer</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-400 focus:ring-offset-0"
            />
            <span className="text-white/90">Active</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="flex-1"
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="flex-1"
          >
            {isEditMode ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </div>
  );
}