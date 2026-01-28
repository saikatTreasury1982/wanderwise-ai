'use client';

import { useState, useEffect } from 'react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { X } from 'lucide-react';

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
    const checkAvailability = async () => {
      setIsChecking(true);

      try {
        const response = await fetch(`/api/recommendations/check?tripId=${tripId}`);

        if (response.ok) {
          const data = await response.json();

          if (data.hasRecommendations) {
            setAvailability(data);
            // Show notification after 2 seconds
            setTimeout(() => {
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

  if (!availability?.hasRecommendations) {
    return null;
  }

  const { sources, counts } = availability;
  const totalItems = counts.flights + counts.accommodations + counts.packingCategories + counts.itineraryDays;

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
              Check recommendations on respective pages:
            </p>

            <ul className="text-white/70 text-sm space-y-1 ml-1">
              {counts.flights > 0 && <li>• Flights</li>}
              {counts.accommodations > 0 && <li>• Accommodations</li>}
              {counts.packingCategories > 0 && <li>• Packing Items</li>}
              {counts.itineraryDays > 0 && <li>• Itinerary activities</li>}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center">
            <CircleIconButton
              variant="default"
              onClick={handleDismiss}
              title="Close Notification"
              icon={<X className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>
    </div >
  );
}