'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import type { FlightOption, CreateFlightLegInput } from '@/app/lib/types/flight';

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_active: number;
}

interface Currency {
  currency_code: string;
  currency_name: string;
}

interface FlightEntryFormProps {
  tripId: number;
  flight?: FlightOption | null;
  travelers: Traveler[];
  currencies: Currency[];
  onSuccess: () => void;
  onClear: () => void;
}

interface LegFormData {
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  airline: string;
  flight_number: string;
  stops_count: number;
  duration_minutes: number | '';
}

const emptyLeg: LegFormData = {
  departure_airport: '',
  arrival_airport: '',
  departure_date: '',
  departure_time: '',
  arrival_date: '',
  arrival_time: '',
  airline: '',
  flight_number: '',
  stops_count: 0,
  duration_minutes: '',
};

export default function FlightEntryForm({
  tripId,
  flight,
  travelers,
  currencies,
  onSuccess,
  onClear,
}: FlightEntryFormProps) {
  const [flightType, setFlightType] = useState<'one_way' | 'round_trip' | 'multi_city'>('one_way');
  const [outboundLegs, setOutboundLegs] = useState<LegFormData[]>([{ ...emptyLeg }]);
  const [returnLegs, setReturnLegs] = useState<LegFormData[]>([{ ...emptyLeg }]);
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTravelers, setSelectedTravelers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = flight && flight.flight_option_id > 0;

  // Load flight data when editing
  useEffect(() => {
    if (flight) {
      setFlightType(flight.flight_type);
      setTotalPrice(flight.total_price?.toString() || '');
      setCurrencyCode(flight.currency_code || '');
      setNotes(flight.notes || '');
      setSelectedTravelers(flight.travelers?.map(t => t.traveler_id) || []);

      // Load outbound legs
      if (flight.legs && flight.legs.length > 0) {
        const legs: LegFormData[] = flight.legs.map(leg => ({
          departure_airport: leg.departure_airport,
          arrival_airport: leg.arrival_airport,
          departure_date: leg.departure_date,
          departure_time: leg.departure_time || '',
          arrival_date: leg.arrival_date,
          arrival_time: leg.arrival_time || '',
          airline: leg.airline || '',
          flight_number: leg.flight_number || '',
          stops_count: leg.stops_count,
          duration_minutes: leg.duration_minutes !== null ? leg.duration_minutes : '',
        }));
        setOutboundLegs(legs);
      }

      // Load return legs (for round-trip)
      if (flight.return_legs && flight.return_legs.length > 0) {
        const legs: LegFormData[] = flight.return_legs.map(leg => ({
          departure_airport: leg.departure_airport,
          arrival_airport: leg.arrival_airport,
          departure_date: leg.departure_date,
          departure_time: leg.departure_time || '',
          arrival_date: leg.arrival_date,
          arrival_time: leg.arrival_time || '',
          airline: leg.airline || '',
          flight_number: leg.flight_number || '',
          stops_count: leg.stops_count,
          duration_minutes: leg.duration_minutes !== null ? leg.duration_minutes : '',
        }));
        setReturnLegs(legs);
      } else {
        setReturnLegs([{ ...emptyLeg }]);
      }
    } else {
      resetForm();
    }
  }, [flight]);

  const resetForm = () => {
    setFlightType('one_way');
    setOutboundLegs([{ ...emptyLeg }]);
    setReturnLegs([{ ...emptyLeg }]);
    setTotalPrice('');
    setCurrencyCode('');
    setNotes('');
    setSelectedTravelers([]);
    setError(null);
  };

  const handleClear = () => {
    resetForm();
    onClear();
  };

  const updateLeg = (
    legs: LegFormData[],
    setLegs: React.Dispatch<React.SetStateAction<LegFormData[]>>,
    index: number,
    field: keyof LegFormData,
    value: string | number
  ) => {
    const updated = [...legs];
    updated[index] = { ...updated[index], [field]: value };
    setLegs(updated);
  };

  const addLeg = (setLegs: React.Dispatch<React.SetStateAction<LegFormData[]>>) => {
    setLegs(prev => [...prev, { ...emptyLeg }]);
  };

  const removeLeg = (
    legs: LegFormData[],
    setLegs: React.Dispatch<React.SetStateAction<LegFormData[]>>,
    index: number
  ) => {
    if (legs.length > 1) {
      setLegs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const toggleTraveler = (travelerId: number) => {
    setSelectedTravelers(prev =>
      prev.includes(travelerId)
        ? prev.filter(id => id !== travelerId)
        : [...prev, travelerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formatLegs = (legs: LegFormData[]): CreateFlightLegInput[] =>
        legs.map((leg, index) => ({
          leg_order: index + 1,
          departure_airport: leg.departure_airport.toUpperCase(),
          arrival_airport: leg.arrival_airport.toUpperCase(),
          departure_date: leg.departure_date,
          departure_time: leg.departure_time || undefined,
          arrival_date: leg.arrival_date,
          arrival_time: leg.arrival_time || undefined,
          airline: leg.airline || undefined,
          flight_number: leg.flight_number || undefined,
          stops_count: leg.stops_count,
          duration_minutes: leg.duration_minutes ? Number(leg.duration_minutes) : undefined,
        }));

      const payload: any = {
        flight_type: flightType,
        total_price: totalPrice ? parseFloat(totalPrice) : undefined,
        currency_code: currencyCode || undefined,
        notes: notes || undefined,
        legs: formatLegs(outboundLegs),
        traveler_ids: selectedTravelers,
      };

      if (flightType === 'round_trip') {
        payload.return_legs = formatLegs(returnLegs);
      }

      let response;
      if (isEditing) {
        response = await fetch(`/api/trips/${tripId}/flights/${flight.flight_option_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/trips/${tripId}/flights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save flight');
      }

      resetForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLegInputs = (
    legs: LegFormData[],
    setLegs: React.Dispatch<React.SetStateAction<LegFormData[]>>,
    label: string,
    showAddRemove: boolean = false
  ) => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-white/80">{label}</h4>
      {legs.map((leg, index) => (
        <div key={index} className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
          {showAddRemove && legs.length > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Leg {index + 1}</span>
              <button
                type="button"
                onClick={() => removeLeg(legs, setLegs, index)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          )}

          {/* Airports row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">From</label>
              <input
                type="text"
                value={leg.departure_airport}
                onChange={e => updateLeg(legs, setLegs, index, 'departure_airport', e.target.value)}
                placeholder="BNE"
                maxLength={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm uppercase placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">To</label>
              <input
                type="text"
                value={leg.arrival_airport}
                onChange={e => updateLeg(legs, setLegs, index, 'arrival_airport', e.target.value)}
                placeholder="SIN"
                maxLength={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm uppercase placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                required
              />
            </div>
          </div>

          {/* Departure date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Departure Date</label>
              <input
                type="date"
                value={leg.departure_date}
                onChange={e => updateLeg(legs, setLegs, index, 'departure_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Time</label>
              <input
                type="time"
                value={leg.departure_time}
                onChange={e => updateLeg(legs, setLegs, index, 'departure_time', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Arrival date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Arrival Date</label>
              <input
                type="date"
                value={leg.arrival_date}
                onChange={e => updateLeg(legs, setLegs, index, 'arrival_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Time</label>
              <input
                type="time"
                value={leg.arrival_time}
                onChange={e => updateLeg(legs, setLegs, index, 'arrival_time', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Airline & Flight Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Airline</label>
              <input
                type="text"
                value={leg.airline}
                onChange={e => updateLeg(legs, setLegs, index, 'airline', e.target.value)}
                placeholder="QF"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Flight #</label>
              <input
                type="text"
                value={leg.flight_number}
                onChange={e => updateLeg(legs, setLegs, index, 'flight_number', e.target.value)}
                placeholder="52"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Stops & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Stops</label>
              <input
                type="number"
                value={leg.stops_count}
                onChange={e => updateLeg(legs, setLegs, index, 'stops_count', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Duration (min)</label>
              <input
                type="number"
                value={leg.duration_minutes}
                onChange={e => updateLeg(legs, setLegs, index, 'duration_minutes', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="480"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
              />
              {leg.duration_minutes && Number(leg.duration_minutes) > 0 && (
                <p className="text-xs text-purple-300 mt-1">
                  {Math.floor(Number(leg.duration_minutes) / 60)}h {Number(leg.duration_minutes) % 60}m
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {showAddRemove && (
        <button
          type="button"
          onClick={() => addLeg(setLegs)}
          className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 border border-dashed border-purple-400/50 rounded-lg hover:border-purple-400 transition-colors"
        >
          + Add Leg
        </button>
      )}
    </div>
  );

  const activeTravelers = travelers.filter(t => t.is_active === 1);

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {isEditing ? 'Edit Flight' : 'Add Flight Option'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Flight Type */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Flight Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['one_way', 'round_trip', 'multi_city'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFlightType(type)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-colors',
                  flightType === type
                    ? 'bg-purple-500/30 border-purple-400 text-white'
                    : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                )}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Outbound Legs */}
        {renderLegInputs(
          outboundLegs,
          setOutboundLegs,
          flightType === 'round_trip' ? 'Outbound Flight' : flightType === 'multi_city' ? 'Flight Legs' : 'Flight Details',
          flightType === 'multi_city'
        )}

        {/* Return Flight (for round_trip) */}
        {flightType === 'round_trip' && (
          renderLegInputs(returnLegs, setReturnLegs, 'Return Flight', false)
        )}

        {/* Fare */}
        <div className="grid grid-cols-2 gap-3">
        <div>
            <label className="block text-xs text-white/60 mb-1">Unit Fare</label>
            <input
            type="number"
            value={totalPrice}
            onChange={e => setTotalPrice(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
        </div>
        <div>
            <label className="block text-xs text-white/60 mb-1">Currency</label>
            <select
            value={currencyCode}
            onChange={e => setCurrencyCode(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            >
            <option value="" className="bg-gray-800">Select</option>
            {currencies.map(c => (
                <option key={c.currency_code} value={c.currency_code} className="bg-gray-800">
                {c.currency_code}
                </option>
            ))}
            </select>
        </div>
        </div>

        {/* Travelers */}
        {activeTravelers.length > 0 && (
          <div>
            <label className="block text-sm text-white/70 mb-2">Travelers</label>
            <div className="space-y-2">
              {activeTravelers.map(t => (
                <label
                  key={t.traveler_id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTravelers.includes(t.traveler_id)}
                    onChange={() => toggleTraveler(t.traveler_id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400"
                  />
                  <span className="text-sm text-white/80">{t.traveler_name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Source, layover details, etc."
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
        <CircleIconButton
            type="button"
            variant="default"
            onClick={handleClear}
            title="Clear form"
            icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            }
        />
        <CircleIconButton
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            title={isEditing ? 'Update flight' : 'Save flight'}
            icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            }
        />
        </div>
      </div>
    </form>
  );
}