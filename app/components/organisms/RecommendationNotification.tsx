'use client';

import { useState, useEffect } from 'react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';

interface RecommendationNotificationProps {
  tripId: number;
  onDismiss: () => void;
  onExplore: () => void;
}

export default function RecommendationNotification({
  tripId,
  onDismiss,
  onExplore,
}: RecommendationNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [availability, setAvailability] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    console.log('RecommendationNotification mounted for trip:', tripId);

    const checkAvailability = async () => {
      console.log('Starting checkAvailability...');
      setIsChecking(true);

      try {
        console.log('Fetching from API:', `/api/recommendations/check?tripId=${tripId}`);
        const response = await fetch(`/api/recommendations/check?tripId=${tripId}`);
        console.log('Response status:', response.status, 'OK:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('Availability data:', data);

          if (data.hasRecommendations) {
            console.log('✅ Recommendations found! Setting availability and showing notification...');
            setAvailability(data);
            // Show notification after 2 seconds
            setTimeout(() => {
              console.log('Showing notification now!');
              setIsVisible(true);
            }, 2000);
          } else {
            console.log('❌ No recommendations found');
          }
        } else {
          console.error('Response not OK:', response.status);
        }
      } catch (error) {
        console.error('Error checking recommendations:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAvailability();
  }, [tripId]);

  const handleDismiss = () => {
    console.log('Dismissing notification');
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300);
  };

  const handleExplore = () => {
    console.log('Exploring recommendations');
    setIsVisible(false);
    onExplore();
  };

  console.log('Render state:', { isChecking, availability, isVisible });

  if (!availability?.hasRecommendations) {
    console.log('Not rendering - no recommendations');
    return null;
  }

  const { sources, counts } = availability;
  const totalItems = counts.flights + counts.accommodations + counts.packingCategories + counts.itineraryDays;

  console.log('Rendering notification with visibility:', isVisible);

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-30 max-w-md
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}
      `}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl blur-xl" />

        {/* Main card */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-purple-400/40 rounded-2xl shadow-2xl p-6 ring-1 ring-purple-400/20">
          {/* Content */}
          <div className="mb-6">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xl">💡</span>
              <h4 className="text-white/90 font-medium text-sm">
                Smart Recommendations Available
              </h4>
            </div>

            <p className="text-white/70 text-sm mb-3">
              You've traveled to {sources[0]?.destination || 'this destination'} before!<br />
              Your trip: "{sources[0]?.trip_name}" {sources[0]?.status === 'completed' ? '(✓ Completed)' : ''}
            </p>

            <p className="text-white/70 text-sm mb-2">
              Would you like suggestions for:
            </p>

            <ul className="text-white/70 text-sm space-y-1 ml-1">
              {counts.flights > 0 && <li>• Flights</li>}
              {counts.accommodations > 0 && <li>• Accommodations</li>}
              {counts.packingCategories > 0 && <li>• Packing Items</li>}
              {counts.itineraryDays > 0 && <li>• Itinerary activities</li>}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDismiss}
              className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 hover:border-white/30 hover:text-white transition-all text-sm font-medium"
            >
              No, thanks
            </button>
            <button
              onClick={handleExplore}
              className="px-6 py-2.5 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 hover:text-purple-200 transition-all text-sm font-medium"
            >
              Yes, show suggestions
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}