'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { cn } from '@/app/lib/utils';

interface Destination {
  country: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  initialDestinations?: Destination[];
  onChange?: (destinations: Destination[]) => void;
  readOnly?: boolean;
}

export default function DestinationSelector({ initialDestinations = [], onChange, readOnly = false }: Props) {
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setDestinations(initialDestinations); }, [initialDestinations]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // debounced geocoding search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const commit = (list: Destination[]) => { setDestinations(list); onChange?.(list); };

  const addResult = (r: GeoResult) => {
    const dest: Destination = {
      country: r.country,
      city: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
    };
    commit([...destinations, dest]);
    setQuery(''); setResults([]); setOpen(false);
  };

  const removeAt = (i: number) => commit(destinations.filter((_, idx) => idx !== i));

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) addResult(results[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const resultLabel = (r: GeoResult) => [r.name, r.admin1, r.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-2" ref={rootRef}>
      <label className="block text-sm font-medium text-white/90">
        Destinations {destinations.length === 0 && <span className="text-red-400">*</span>}
      </label>

      {/* existing destinations */}
      {destinations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {destinations.map((d, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 rounded-full border border-primary-400/30">
              <MapPin className="w-3.5 h-3.5 text-primary-300" />
              <span className="text-sm text-white/90">{d.city ? `${d.city}, ${d.country}` : d.country}</span>
              {!readOnly && (
                <button type="button" onClick={() => removeAt(i)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* search input */}
      {!readOnly && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => { if (results.length) setOpen(true); }}
            placeholder="Search a city or place…"
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          {open && (
            <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto custom-scrollbar bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl">
              {loading ? (
                <div className="px-3 py-2 text-sm text-white/50">Searching…</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/50">No matches</div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.latitude},${r.longitude},${i}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => addResult(r)}
                    className={cn('w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                      i === active ? 'bg-primary-500/20 text-white' : 'text-white/80 hover:bg-white/5')}
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary-300 shrink-0" />
                    <span className="truncate">{resultLabel(r)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}