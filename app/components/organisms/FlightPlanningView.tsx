'use client';

import { useState, useEffect } from 'react';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import FlightEntryForm from '@/app/components/organisms/FlightEntryForm';
import FlightOptionCard from '@/app/components/organisms/FlightOptionCard';
import FlightViewModal from '@/app/components/organisms/FlightViewModal';
import RecommendationSlider from '@/app/components/organisms/RecommendationSlider';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import type { FlightOption } from '@/app/lib/types/flight';

interface Traveler { traveler_id: number; traveler_name: string; is_active: number; is_cost_sharer: number; }
interface Currency { currency_code: string; currency_name: string; }

interface Props {
  tripId: number;
  travelers: Traveler[];
  currencies: Currency[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
}

export default function FlightPlanningView({ tripId, travelers, currencies, dateFormat }: Props) {
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [viewingFlight, setViewingFlight] = useState<FlightOption | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRecommendationSlider, setShowRecommendationSlider] = useState(false);

  const fetchFlights = async () => {
    const res = await fetch(`/api/trips/${tripId}/flights`);
    if (res.ok) setFlights(await res.json());
  };

  useEffect(() => { fetchFlights(); }, [tripId]);

  const handleView = (flight: FlightOption) => setViewingFlight(flight);

  const handleEdit = (flight: FlightOption) => {
    setSelectedFlight(flight);
    setShowForm(true);
  };

  const handleCopy = async (flight: FlightOption) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/flights/${flight.flight_option_id}`, { method: 'POST' });
      if (res.ok) await fetchFlights();
      else alert((await res.json()).error || 'Failed to copy flight');
    } catch {
      alert('Failed to copy flight');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (flightId: number) => {
    if (!confirm('Are you sure you want to delete this flight option?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/flights/${flightId}`, { method: 'DELETE' });
      if (res.ok) await fetchFlights();
      else alert((await res.json()).error || 'Failed to delete flight');
    } catch {
      alert('Failed to delete flight');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (flightId: number, status: FlightOption['status']) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/flights/${flightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchFlights();
      else alert((await res.json()).error || 'Failed to update status');
    } catch {
      alert('Failed to update status');
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

  const shortlistedFlights = flights.filter(f => f.status === 'shortlisted');
  const draftFlights = flights.filter(f => f.status === 'draft');
  const rejectedFlights = flights.filter(f => f.status === 'not_selected');

  return (
    <div className="relative pb-24">
      <LoadingOverlay isLoading={isProcessing} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showForm && (
          <div>
            <FlightEntryForm
              tripId={tripId}
              flight={selectedFlight}
              travelers={travelers}
              currencies={currencies}
              onSuccess={handleFormSuccess}
              onClear={handleFormClear}
            />
          </div>
        )}

        <div className={showForm ? '' : 'lg:col-span-2'}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Saved Options ({flights.length})
            </h3>

            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/40 rounded-full blur-md animate-pulse" />
              <CircleIconButton
                variant="default"
                onClick={() => setShowRecommendationSlider(true)}
                title="Smart Suggestions"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
            </div>
          </div>

          {flights.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <p className="text-white/70 mb-2">No flight options yet.</p>
              <p className="text-white/50 text-sm">Click the + button to add your first flight option.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {shortlistedFlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">Shortlisted</h4>
                  <div className="space-y-3">
                    {shortlistedFlights.map(flight => (
                      <FlightOptionCard key={flight.flight_option_id} flight={flight}
                        onView={handleView} onEdit={handleEdit} onCopy={handleCopy}
                        onDelete={handleDelete} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              )}

              {draftFlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Draft</h4>
                  <div className="space-y-3">
                    {draftFlights.map(flight => (
                      <FlightOptionCard key={flight.flight_option_id} flight={flight}
                        onView={handleView} onEdit={handleEdit} onCopy={handleCopy}
                        onDelete={handleDelete} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              )}

              {rejectedFlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">Rejected</h4>
                  <div className="space-y-3">
                    {rejectedFlights.map(flight => (
                      <FlightOptionCard key={flight.flight_option_id} flight={flight}
                        onView={handleView} onEdit={handleEdit} onCopy={handleCopy}
                        onDelete={handleDelete} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!showForm && (
        <FloatingActionButton onClick={handleAddNew} ariaLabel="Add flight option" />
      )}

      <FlightViewModal
        isOpen={viewingFlight !== null}
        onClose={() => setViewingFlight(null)}
        flight={viewingFlight}
        dateFormat={dateFormat}
      />

      <RecommendationSlider
        isOpen={showRecommendationSlider}
        onClose={() => setShowRecommendationSlider(false)}
        type="flights"
        tripId={tripId}
        onAddRecommendation={(rec: any) => {
          const prefilledFlight: FlightOption = {
            flight_option_id: 0,
            trip_id: tripId,
            flight_type: rec.flight_type,
            linked_flight_id: null,
            unit_fare: rec.total_price,
            currency_code: rec.currency_code,
            status: 'draft',
            notes: `Recommended from: ${rec.source.trip_name}`,
            legs: rec.legs.map((leg: any, index: number) => ({
              leg_id: 0,
              flight_option_id: 0,
              leg_order: index + 1,
              departure_airport: leg.departure_airport,
              arrival_airport: leg.arrival_airport,
              departure_date: leg.departure_datetime.split('T')[0],
              departure_time: leg.departure_datetime.split('T')[1]?.substring(0, 5) || null,
              arrival_date: leg.arrival_datetime.split('T')[0],
              arrival_time: leg.arrival_datetime.split('T')[1]?.substring(0, 5) || null,
              airline: leg.airline_code,
              flight_number: leg.flight_number,
              stops_count: leg.stops_count,
              duration_minutes: leg.duration_minutes,
            })),
            return_legs: [],
            travelers: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setSelectedFlight(prefilledFlight);
          setShowForm(true);
          setShowRecommendationSlider(false);
        }}
      />
    </div>
  );
}