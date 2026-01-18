'use client';

import { useState, useEffect } from 'react';
import { cn, formatDateRange } from '@/app/lib/utils';
import { Users, Wallet, Calendar, Plane } from 'lucide-react';

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
}

interface TripStatus {
  status_code: number;
  status_name: string;
}

interface TripStats {
  activeTravelers: number;
  costSharers: number;
  totalCost: number | null;
  baseCurrency: string | null;
}

interface TripCardProps {
  trip: Trip;
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  statuses: TripStatus[];
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: number) => void;
  onStartPlanning: (tripId: number) => void;
  onCardClick: (tripId: number) => void;
  onView: (trip: Trip) => void;
}

const statusStyles: Record<number, string> = {
  1: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  2: 'bg-green-500/20 text-green-300 border-green-500/30',
  3: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  4: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function TripCard({
  trip,
  dateFormat,
  statuses,
  onEdit,
  onDelete,
  onStartPlanning,
  onCardClick,
  onView,
}: TripCardProps) {
  const [weather, setWeather] = useState<{
    tempMin: number;
    tempMax: number;
    precipitationChance: number;
    description: string;
  } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [stats, setStats] = useState<TripStats | null>(null);
  const [destinations, setDestinations] = useState<string>('');

  // Fetch weather independently
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get first destination
        const destRes = await fetch(`/api/trips/${trip.trip_id}/destinations`);
        if (!destRes.ok) return;

        const destData = await destRes.json();
        if (!destData.destinations || destData.destinations.length === 0) return;

        const firstDest = destData.destinations[0];
        const city = firstDest.city || firstDest.country;

        if (!city || !trip.start_date || !trip.end_date) return;

        setIsLoadingWeather(true);
        const weatherRes = await fetch(
          `/api/weather?city=${encodeURIComponent(city)}&startDate=${trip.start_date}&endDate=${trip.end_date}`
        );

        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          if (weatherData) {
            setWeather(weatherData);
          }
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [trip.trip_id, trip.start_date, trip.end_date]);

  // Fetch destinations and statistics for ALL trips
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch travelers
        const travelersRes = await fetch(`/api/trips/${trip.trip_id}/travelers`);
        let activeTravelers = 0;
        let costSharers = 0;

        if (travelersRes.ok) {
          const travelersData = await travelersRes.json();
          const travelers = travelersData.travelers || [];
          activeTravelers = travelers.filter((t: any) => t.is_active === 1).length;
          costSharers = travelers.filter((t: any) => t.is_cost_sharer === 1 && t.is_active === 1).length;
        }

        // Fetch cost forecast
        let totalCost: number | null = null;
        let baseCurrency: string | null = null;

        const costRes = await fetch(`/api/trips/${trip.trip_id}/cost-forecast`);
        if (costRes.ok) {
          const costData = await costRes.json();
          if (costData.total_cost) {
            totalCost = costData.total_cost;
            baseCurrency = costData.base_currency;
          }
        }

        // Fetch destinations
        let destinationsText = '';
        const destRes = await fetch(`/api/trips/${trip.trip_id}/destinations`);
        if (destRes.ok) {
          const destData = await destRes.json();
          if (destData.destinations && destData.destinations.length > 0) {
            destinationsText = destData.destinations
              .map((d: any) => d.city ? `${d.city}, ${d.country}` : d.country)
              .join(' • ');
          }
        }

        setDestinations(destinationsText);
        setStats({ activeTravelers, costSharers, totalCost, baseCurrency });
      } catch (error) {
        console.error('Error fetching trip data:', error);
      }
    };

    fetchData();
  }, [trip.trip_id]);

  const statusLabel = statuses.find(s => s.status_code === trip.status_code)?.status_name || 'Unknown';
  const statusStyle = statusStyles[trip.status_code] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';

  const isDraft = trip.status_code === 1;

  // Calculate trip duration
  const calculateDuration = () => {
    if (!trip.start_date || !trip.end_date) return null;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const nights = days - 1;
    return { days, nights };
  };

  const duration = calculateDuration();

  const formatCost = (amount: number, currency: string) => {
    if (amount >= 1000000) {
      return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${currency} ${(amount / 1000).toFixed(1)}K`;
    }
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div
      onClick={() => !isDraft && onCardClick(trip.trip_id)}
      className={cn(
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-xl p-4',
        'transition-all duration-200',
        isDraft
          ? 'cursor-default'
          : 'hover:bg-white/15 hover:border-white/30 cursor-pointer'
      )}
    >
      {/* Top Section: Title, Status, Actions */}
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white truncate">
              {trip.trip_name}
            </h3>
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full border shrink-0',
                statusStyle
              )}
            >
              {statusLabel}
            </span>
          </div>

          {destinations && (
            <p className="text-white/70 text-sm truncate">{destinations}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* View */}
          <button
            onClick={(e) => { e.stopPropagation(); onView(trip); }}
            className="p-2 rounded-lg text-white/70 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            aria-label="View trip summary"
            title="View trip summary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onEdit(trip); }}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Edit trip"
            title="Edit trip"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          {/* Start Planning - only for draft trips */}
          {trip.status_code === 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartPlanning(trip.trip_id); }}
              className="p-2 rounded-lg text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-colors"
              aria-label="Start planning"
              title="Start planning"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}

          {/* Delete - for draft (1) or suspended (4) trips */}
          {(trip.status_code === 1 || trip.status_code === 4) && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(trip.trip_id); }}
              className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Delete trip"
              title="Delete trip"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Middle Section: Date Range */}
      <p className="text-white/60 text-sm mb-3">
        {formatDateRange(trip.start_date, trip.end_date, dateFormat)}
      </p>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* Duration */}
        {duration && (
          <div className="flex items-center gap-1.5 text-purple-200">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>{duration.days}D / {duration.nights}N</span>
          </div>
        )}

        {/* Travelers */}
        {stats && stats.activeTravelers > 0 && (
          <div className="flex items-center gap-1.5 text-purple-200">
            <Users className="w-4 h-4 text-blue-400" />
            <span>
              {stats.activeTravelers}
              {stats.costSharers > 0 && stats.costSharers !== stats.activeTravelers && (
                <span className="text-white/50"> ({stats.costSharers} sharing)</span>
              )}
            </span>
          </div>
        )}

        {/* Total Cost */}
        {stats && stats.totalCost !== null && stats.baseCurrency && (
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-green-300 font-medium">
              {formatCost(stats.totalCost, stats.baseCurrency)}
            </span>
          </div>
        )}

        {/* Weather */}
        {isLoadingWeather ? (
          <div className="flex items-center gap-1.5 text-white/40">
            <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : weather ? (
          <div className="flex items-center gap-1.5">
            <span className="text-base">
              {weather.tempMax < 5 ? '❄️' : weather.tempMax < 15 ? '🌤️' : weather.tempMax < 28 ? '☀️' : '🔥'}
            </span>
            <span className="text-white/70">
              {weather.tempMin}°–{weather.tempMax}°C
            </span>
            {weather.precipitationChance > 20 && (
              <span className="text-blue-300">
                💧{weather.precipitationChance}%
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}