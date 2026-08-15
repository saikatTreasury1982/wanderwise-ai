'use client';

import { useState, useEffect } from 'react';
import { cn, formatDateRange } from '@/app/lib/utils';
import { Calendar, Users, Wallet, Cloud, MapPin, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import type { TripListItem, TripStatus } from '@/app/lib/types/trip';
import CircleIconButton from '@/app/components/ui/CircleIconButton';

interface Props {
  trip: TripListItem;
  statuses: TripStatus[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onEdit: (tripId: number) => void;
  onDelete: (tripId: number) => void;
  onPrimaryAction: (trip: TripListItem) => void; // proceed/open/complete/reactivate depending on status
}

const statusStyles: Record<number, string> = {
  1: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  2: 'bg-green-500/20 text-green-300 border-green-500/30',
  3: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  4: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const fmtCost = (amount: number, currency: string) => {
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${currency} ${(amount / 1_000).toFixed(1)}K`;
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// status → primary action label + icon
function primaryActionFor(status: number): { label: string; d: string } | null {
  switch (status) {
    case 1: return { label: 'Start planning', d: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    case 2: return { label: 'Open trip', d: 'M13 7l5 5m0 0l-5 5m5-5H6' };
    case 3: return { label: 'Reactivate', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' };
    case 4: return { label: 'Open trip', d: 'M13 7l5 5m0 0l-5 5m5-5H6' };
    default: return null;
  }
}

export default function TripSummaryHeader({ trip, statuses, dateFormat, onEdit, onDelete, onPrimaryAction }: Props) {
  const [weather, setWeather] = useState<{ tempMin: number; tempMax: number; precipitationChance: number; description: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [cost, setCost] = useState<{ total: number; currency: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // weather — uses stored coords (fast; falls back to city geocode server-side if missing)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setWeather(null);
      const city = trip.first_city || trip.first_country;
      if (!city || !trip.start_date || !trip.end_date) return;
      setLoadingWeather(true);
      try {
        const params = new URLSearchParams({ city, startDate: trip.start_date, endDate: trip.end_date });
        if (trip.first_latitude != null && trip.first_longitude != null) {
          params.set('lat', String(trip.first_latitude));
          params.set('lon', String(trip.first_longitude));
        }
        const res = await fetch(`/api/weather?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) setWeather(data);
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
      } finally {
        if (!cancelled) setLoadingWeather(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [trip.trip_id, trip.first_city, trip.first_country, trip.first_latitude, trip.first_longitude, trip.start_date, trip.end_date]);

  // cost — per selected trip (no simple cost table, so fetched here)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setCost(null);
      try {
        const res = await fetch(`/api/trips/${trip.trip_id}/cost-forecast`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.total_cost) setCost({ total: data.total_cost, currency: data.base_currency });
        }
      } catch (e) {
        console.error('Cost fetch error:', e);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [trip.trip_id]);

  const statusLabel = statuses.find(s => s.status_code === trip.status_code)?.status_name || 'Unknown';
  const statusStyle = statusStyles[trip.status_code] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const destination = trip.first_city ? `${trip.first_city}, ${trip.first_country}` : (trip.first_country || '');
  const canDelete = trip.status_code === 1 || trip.status_code === 4;

  const duration = (() => {
    if (!trip.start_date || !trip.end_date) return null;
    const days = Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1;
    return { days, nights: days - 1 };
  })();

  const primary = primaryActionFor(trip.status_code);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-5">
      {/* top row: name + status + actions */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-white truncate">{trip.trip_name}</h2>
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border shrink-0', statusStyle)}>{statusLabel}</span>
          </div>
          {destination && (
            <div className="flex items-center gap-1.5 text-sm text-white/70">
              <MapPin className="w-4 h-4 text-primary-300 shrink-0" />
              <span className="truncate">{destination}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onEdit(trip.trip_id)} title="Edit trip"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Edit3 className="w-3 h-3" />
          </button>

          {primary && (
            <button onClick={() => onPrimaryAction(trip)} title={primary.label}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                {primary.d.trim().split(' M').map((seg, i) => (
                  <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={i === 0 ? seg : `M${seg}`} />
                ))}
              </svg>
            </button>
          )}

          {canDelete && (
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} title="More" className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden">
                    <button onClick={() => { setMenuOpen(false); onDelete(trip.trip_id); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete trip
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1"><Calendar className="w-3.5 h-3.5" /> Dates</div>
          <div className="text-sm text-white">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</div>
          {duration && <div className="text-xs text-white/40 mt-0.5">{duration.days}D / {duration.nights}N</div>}
        </div>

        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1"><Cloud className="w-3.5 h-3.5" /> Weather</div>
          {loadingWeather ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin mt-1" />
          ) : weather ? (
            <>
              <div className="text-sm text-white">{weather.tempMin}°–{weather.tempMax}°C</div>
              <div className="text-xs text-white/40 mt-0.5">{weather.description}{weather.precipitationChance > 20 ? ` · ${weather.precipitationChance}% rain` : ''}</div>
            </>
          ) : (
            <div className="text-sm text-white/30">—</div>
          )}
        </div>

        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1"><Users className="w-3.5 h-3.5" /> Travellers</div>
          <div className="text-sm text-white">{trip.active_travelers}</div>
          {trip.cost_sharers > 0 && trip.cost_sharers !== trip.active_travelers && (
            <div className="text-xs text-white/40 mt-0.5">{trip.cost_sharers} sharing</div>
          )}
        </div>

        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1"><Wallet className="w-3.5 h-3.5" /> Est. cost</div>
          {cost ? (
            <div className="text-sm text-green-300 font-medium">{fmtCost(cost.total, cost.currency)}</div>
          ) : (
            <div className="text-sm text-white/30">—</div>
          )}
        </div>
      </div>
    </div>
  );
}