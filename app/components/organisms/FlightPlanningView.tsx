'use client';

import { useState, useEffect } from 'react';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import type { FlightOption } from '@/app/lib/types/flight';
import FlightEntryForm from '@/app/components/organisms/FlightEntryForm';
import FlightComparisonTable from '@/app/components/organisms/FlightComparisonTable';

interface Traveler { traveler_id: number; traveler_name: string; is_active: number; is_cost_sharer: number; }
interface Currency { currency_code: string; currency_name: string; }

interface Props {
  tripId: number;
  travelers: Traveler[];
  currencies: Currency[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
}

export default function FlightPlanningView({ tripId, currencies }: Props) {
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFlights = async () => {
    const res = await fetch(`/api/trips/${tripId}/flights`);
    if (res.ok) setFlights(await res.json());
  };

  useEffect(() => { fetchFlights(); }, [tripId]);

  const handleEdit = (flight: FlightOption) => {
    setSelectedFlight(flight);
    setShowForm(true);
  };

  const handleDelete = async (flightId: number) => {
    if (!confirm('Delete this flight option?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/flights/${flightId}`, { method: 'DELETE' });
      if (res.ok) await fetchFlights();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelect = async (flightId: number, select: boolean) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/flights/${flightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ select }),
      });
      if (res.ok) await fetchFlights();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSuccess = () => {
    fetchFlights();
    setSelectedFlight(null);
    setShowForm(false);
  };

  const handleFormClear = () => {
    setSelectedFlight(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setSelectedFlight(null);
    setShowForm(true);
  };

  return (
    <div className="relative pb-24">
      <LoadingOverlay isLoading={isProcessing} />

      <div className="space-y-6">
        {showForm && (
          <FlightEntryForm
            tripId={tripId}
            option={selectedFlight}
            currencies={currencies}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClear}
          />
        )}

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Saved Options ({flights.length})
          </h3>
          <FlightComparisonTable
            flights={flights}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {!showForm && (
        <FloatingActionButton onClick={handleAddNew} ariaLabel="Add flight option" />
      )}
    </div>
  );
}