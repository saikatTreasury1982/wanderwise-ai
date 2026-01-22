'use client';

import { useState, useEffect } from 'react';

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
          {/* Header with close button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  💡 Smart Recommendations
                </h4>
                <p className="text-white/70 text-sm">
                  From: {sources[0]?.trip_name}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {counts.flights > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                <div className="text-white/50 text-xs mb-1">Flights</div>
                <div className="text-purple-300 font-bold text-lg">{counts.flights}</div>
              </div>
            )}
            {counts.accommodations > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                <div className="text-white/50 text-xs mb-1">Lodging</div>
                <div className="text-purple-300 font-bold text-lg">{counts.accommodations}</div>
              </div>
            )}
            {counts.packingCategories > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                <div className="text-white/50 text-xs mb-1">Packing</div>
                <div className="text-purple-300 font-bold text-lg">{counts.packingCategories}</div>
              </div>
            )}
            {counts.itineraryDays > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                <div className="text-white/50 text-xs mb-1">Itinerary</div>
                <div className="text-purple-300 font-bold text-lg">{counts.itineraryDays}</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              title="Later"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={handleExplore}
              className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 flex items-center justify-center text-purple-300 hover:text-purple-200 transition-colors"
              title="Explore recommendations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}