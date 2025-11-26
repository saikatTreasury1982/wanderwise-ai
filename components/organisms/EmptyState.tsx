'use client';

import Button from '@/components/ui/Button';

interface EmptyStateProps {
  onCreateTrip: () => void;
}

export default function EmptyState({ onCreateTrip }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* SVG Illustration - Suitcase with Globe */}
      <div className="mb-8">
        <svg
          className="w-48 h-48 text-purple-400/80"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Globe */}
          <circle
            cx="100"
            cy="70"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          <ellipse
            cx="100"
            cy="70"
            rx="20"
            ry="45"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.4"
          />
          <line
            x1="55"
            y1="70"
            x2="145"
            y2="70"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.4"
          />
          <line
            x1="62"
            y1="50"
            x2="138"
            y2="50"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          <line
            x1="62"
            y1="90"
            x2="138"
            y2="90"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />

          {/* Suitcase */}
          <rect
            x="60"
            y="130"
            width="80"
            height="50"
            rx="6"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.1"
          />
          {/* Suitcase handle */}
          <path
            d="M80 130 V120 Q80 115 85 115 H115 Q120 115 120 120 V130"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Suitcase middle line */}
          <line
            x1="60"
            y1="155"
            x2="140"
            y2="155"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.5"
          />
          {/* Suitcase clasps */}
          <rect
            x="85"
            y="148"
            width="10"
            height="6"
            rx="1"
            fill="currentColor"
            fillOpacity="0.6"
          />
          <rect
            x="105"
            y="148"
            width="10"
            height="6"
            rx="1"
            fill="currentColor"
            fillOpacity="0.6"
          />

          {/* Decorative stars */}
          <circle cx="45" cy="45" r="2" fill="currentColor" fillOpacity="0.4" />
          <circle cx="160" cy="55" r="2.5" fill="currentColor" fillOpacity="0.5" />
          <circle cx="155" cy="100" r="1.5" fill="currentColor" fillOpacity="0.3" />
          <circle cx="40" cy="95" r="2" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>

      {/* Welcoming text */}
      <h2 className="text-2xl font-semibold text-white mb-2">
        Ready to plan your next adventure?
      </h2>
      <p className="text-white/70 mb-8 max-w-md">
        Start by creating your first trip. We'll help you organize destinations, dates, and budgets all in one place.
      </p>

      {/* CTA Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={onCreateTrip}
        className="px-8"
      >
        Plan Your First Trip
      </Button>
    </div>
  );
}