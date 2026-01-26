'use client';

import { useEffect, useState } from 'react';
import RecommendationCard from './RecommendationCard';
import ItineraryPreviewModal from './Itinerarypreviewmodal';
import { formatDate } from '@/app/lib/utils';

interface RecommendationSliderProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'flights' | 'accommodations' | 'packing' | 'itinerary';
  tripId: number;
  onAddRecommendation?: (recommendation: any, selections?: { categoryIndex: number; activityIndex: number }[]) => void;
}

export default function RecommendationSlider({
  isOpen,
  onClose,
  type,
  tripId,
  onAddRecommendation,
}: RecommendationSliderProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceTripName, setSourceTripName] = useState<string>('');
  const [previewDay, setPreviewDay] = useState<{ data: any; index: number } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [itinerarySelections, setItinerarySelections] = useState<Map<number, { categoryIndex: number; activityIndex: number }[]>>(new Map());

  useEffect(() => {
    if (isOpen) {
      fetchRecommendations();
    }
  }, [isOpen, type, tripId]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recommendations/${tripId}/${type}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setSourceTripName(data.source?.trip_name || '');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const typeLabels = {
    flights: 'Flight',
    accommodations: 'Lodging',
    packing: 'Packing',
    itinerary: 'Itinerary',
  };

  const renderRecommendationCard = (rec: any, index: number) => {
    switch (type) {
      case 'flights':
        // Build full route string with all legs
        const fullRoute = rec.legs?.map((leg: any) => leg.departure_airport).join(' → ') +
          (rec.legs?.length > 0 ? ` → ${rec.legs[rec.legs.length - 1].arrival_airport}` : '');

        // Format creation date using util function
        const creationDate = rec.created_at
          ? formatDate(rec.created_at, 'DD Mmm YYYY')
          : 'N/A';

        return (
          <RecommendationCard
            key={index}
            type="flight"
            title={fullRoute || 'No route available'}
            subtitle={rec.flight_type === 'round_trip' ? 'Round Trip' : rec.flight_type}
            details={[
              { label: `Unit fare as on ${creationDate}`, value: `${rec.currency_code} ${rec.total_price?.toFixed(2) || '0.00'}` },
              { label: 'Airline', value: rec.airline_codes || 'N/A' },
            ]}
            status={rec.status}
            sourceTripName={sourceTripName}
            onAdd={() => {
              const selections = itinerarySelections.get(index) || [];
              onAddRecommendation?.(rec, selections);
            }}
          />
        );

      case 'accommodations':
        return (
          <RecommendationCard
            key={index}
            type="accommodation"
            title={rec.property_name || 'Unnamed Property'}
            subtitle={rec.accommodation_type}
            details={[
              { label: 'Check-in', value: new Date(rec.check_in_date).toLocaleDateString() },
              { label: 'Check-out', value: new Date(rec.check_out_date).toLocaleDateString() },
              { label: 'Nights', value: `${rec.nights}` },
              { label: 'Price', value: `${rec.currency_code} ${rec.total_price?.toFixed(2) || '0.00'}` },
            ]}
            status={rec.status}
            sourceTripName={sourceTripName}
            onAdd={() => {
              const selections = itinerarySelections.get(index) || [];
              onAddRecommendation?.(rec, selections);
            }}
          />
        );

      case 'packing':
        return (
          <RecommendationCard
            key={index}
            type="packing"
            title={rec.category_name}
            subtitle={`${rec.items?.length || 0} items`}
            details={rec.items?.slice(0, 3).map((item: any) => ({
              label: item.item_name,
              value: '',
            })) || []}
            sourceTripName={sourceTripName}
            onAdd={() => onAddRecommendation?.(rec)}
          />
        );

      case 'itinerary':
        // Calculate summary stats
        const totalCategories = rec.categories?.length || 0;
        const totalActivities = rec.categories?.reduce((sum: number, cat: any) =>
          sum + (cat.activities?.length || 0), 0) || 0;

        return (
          <RecommendationCard
            key={index}
            type="itinerary"
            title={`Day ${rec.day_number}`}
            subtitle={rec.day_description || 'No description'}
            details={[
              { label: `${totalCategories} categories`, value: `${totalActivities} activities` }
            ]}
            sourceTripName={sourceTripName}
            onPreview={() => {
              setPreviewDay({ data: rec, index });
              setIsPreviewModalOpen(true);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slider Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-[500px] 
          bg-black/30 backdrop-blur-2xl border-l border-white/20
          shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white">
              {typeLabels[type]} Recommendations
            </h3>
            {sourceTripName && (
              <p className="text-sm text-white/60 mt-1">
                From: {sourceTripName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-88px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-white/70">No recommendations found</p>
              <p className="text-white/50 text-sm mt-2">
                Complete trips to this destination to see suggestions here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => renderRecommendationCard(rec, index))}
            </div>
          )}
        </div>
      </div>

      {/* Itinerary Preview Modal */}
      {type === 'itinerary' && (
        <ItineraryPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={(selections) => {
            if (selections && previewDay) {
              setItinerarySelections(prev => {
                const newMap = new Map(prev);
                newMap.set(previewDay.index, selections);
                return newMap;
              });
            }
            setIsPreviewModalOpen(false);
            setPreviewDay(null);
          }}
          onAdd={(selections) => {
            if (previewDay) {
              onAddRecommendation?.(previewDay.data, selections);
            }
            setIsPreviewModalOpen(false);
            setPreviewDay(null);
          }}
          day={previewDay?.data}
          initialSelections={previewDay ? itinerarySelections.get(previewDay.index) || [] : []}
        />
      )}
    </>
  );
}