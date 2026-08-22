'use client';

import { useState, useEffect } from 'react';
import Input from '@/app/components/ui/Input';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import CurrencyCombobox from '@/app/components/ui/CurrencyCombobox';
import TogglePill from '@/app/components/ui/TogglePill';

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
  traveler_currency?: string;
  general?: string;
}

interface Relationship {
  relationship_code: string;
  relationship_name: string;
}

interface Currency {
  currency_code: string;
  currency_name: string;
}

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
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Fetch relationships and currencies on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [relResponse, currResponse] = await Promise.all([
          fetch('/api/relationships'),
          fetch('/api/currencies'),
        ]);

        if (relResponse.ok) {
          const relData = await relResponse.json();
          setRelationships(relData.relationships);
        }

        if (currResponse.ok) {
          const currData = await currResponse.json();
          setCurrencies(currData.currencies);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

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

    if (formData.is_cost_sharer && !formData.traveler_currency) {
      newErrors.traveler_currency = 'Currency is required for Payers';
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

        {/* Row 1 — name, email, relationship, currency */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <Input
              name="traveler_name"
              label="Traveler Name"
              placeholder="e.g., John Doe"
              value={formData.traveler_name}
              onChange={handleChange}
              error={errors.traveler_name}
              variant="glass"
              required
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Input
              name="traveler_email"
              type="email"
              label="Email"
              placeholder="e.g., john@example.com"
              value={formData.traveler_email}
              onChange={handleChange}
              variant="glass"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-white/90 mb-1">Relationship</label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              className="w-full px-4 py-1.5 rounded-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="" className="bg-gray-800 text-white">Select relationship</option>
              {relationships.map((rel) => (
                <option key={rel.relationship_code} value={rel.relationship_code} className="bg-gray-800 text-white">{rel.relationship_name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-white/90 mb-1">Currency</label>
            <CurrencyCombobox
              value={formData.traveler_currency}
              currencies={currencies}
              onSelect={(code) => {
                setFormData(prev => ({ ...prev, traveler_currency: code }));
                setErrors(prev => ({ ...prev, traveler_currency: undefined }));
              }}
            />
            {errors.traveler_currency && (
              <p className="text-red-300 text-xs mt-1">{errors.traveler_currency}</p>
            )}
          </div>
        </div>

        {/* Row 2 — toggles */}
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Primary Traveler</label>
            <TogglePill
              value={formData.is_primary ? 'yes' : 'no'}
              onChange={(v) => setFormData(prev => ({ ...prev, is_primary: v === 'yes' }))}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              activeColors={{
                yes: 'bg-primary-500/30 border-primary-400',
                no: 'bg-white/20 border-white/40',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Payer</label>
            <TogglePill
              value={formData.is_cost_sharer ? 'yes' : 'no'}
              onChange={(v) => {
                setFormData(prev => ({ ...prev, is_cost_sharer: v === 'yes' }));
                setErrors(prev => ({ ...prev, traveler_currency: undefined }));
              }}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              activeColors={{
                yes: 'bg-primary-500/30 border-primary-400',
                no: 'bg-white/20 border-white/40',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Active</label>
            <TogglePill
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(v) => setFormData(prev => ({ ...prev, is_active: v === 'active' }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              activeColors={{
                active: 'bg-green-500/30 border-green-400',
                inactive: 'bg-red-500/30 border-red-400',
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <CircleIconButton
            type="button"
            size="small"
            variant="default"
            onClick={handleClear}
            title="Clear form"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />

          <CircleIconButton
            type="submit"
            size="small"
            variant="primary"
            disabled={isLoading}
            isLoading={isLoading}
            title={isEditMode ? 'Update traveler' : 'Add traveler'}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
        </div>
      </form>
    </div>
  );
}