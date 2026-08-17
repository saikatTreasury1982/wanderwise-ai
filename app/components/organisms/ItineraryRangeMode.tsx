'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import DaySelect from '@/app/components/ui/DaySelect';
import ItineraryRangeCard from './ItineraryRangeCard';
import { cn, formatDate } from '@/app/lib/utils';
import { Plus, X, Check, Trash2 } from 'lucide-react';
import type { ItineraryDayRange } from '@/app/lib/types/itinerary';
import { formatDateRange } from '@/app/lib/utils';
import { Calendar } from 'lucide-react';

interface Props { tripId: string; }

interface Trip {
  trip_id: number;
  trip_name: string;
  start_date: string;
  end_date: string;
}

// add N days to a yyyy-mm-dd string, return yyyy-mm-dd
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export default function ItineraryRangeMode({ tripId }: Props) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [ranges, setRanges] = useState<ItineraryDayRange[]>([]);
  const [selectedRangeId, setSelectedRangeId] = useState<number | null>(null);
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');
  const [isLoading, setIsLoading] = useState(true);

  // builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [newStart, setNewStart] = useState<number>(1);
  const [newEnd, setNewEnd] = useState<number>(1);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [builderError, setBuilderError] = useState('');

  const totalDays = trip
    ? Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1
    : 0;

  const fetchAll = async () => {
    try {
      const [tripRes, rangesRes, prefRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/trips/${tripId}/itinerary-ranges`),
        fetch(`/api/user/preferences`),
      ]);
      if (tripRes.ok) { const d = await tripRes.json(); setTrip(d.trip); }
      if (rangesRes.ok) {
        const r: ItineraryDayRange[] = await rangesRes.json();
        setRanges(r);
        if (r.length > 0 && selectedRangeId == null) setSelectedRangeId(r[0].day_range_id);
      }
      if (prefRes.ok) { const p = await prefRes.json(); setDateFormat(p.preferences?.date_format || 'DD Mmm YYYY'); }
    } catch (e) { console.error('Error loading range mode:', e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [tripId]);

  // days already covered by a range
  const coveredDays = useMemo(() => {
    const set = new Set<number>();
    ranges.forEach(r => { for (let d = r.start_day; d <= r.end_day; d++) set.add(d); });
    return set;
  }, [ranges]);

  // uncovered days as compact spans, e.g. "3–5, 9"
  const unplannedLabel = useMemo(() => {
    if (!totalDays) return '';
    const uncovered: number[] = [];
    for (let d = 1; d <= totalDays; d++) if (!coveredDays.has(d)) uncovered.push(d);
    if (uncovered.length === 0) return '';
    const spans: string[] = [];
    let start = uncovered[0], prev = uncovered[0];
    for (let i = 1; i < uncovered.length; i++) {
      if (uncovered[i] === prev + 1) { prev = uncovered[i]; continue; }
      spans.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = uncovered[i]; prev = uncovered[i];
    }
    spans.push(start === prev ? `${start}` : `${start}–${prev}`);
    return spans.join(', ');
  }, [coveredDays, totalDays]);

  const rangeDates = (r: ItineraryDayRange) => {
    if (!trip) return { start: '', end: '' };
    return { start: addDays(trip.start_date, r.start_day - 1), end: addDays(trip.start_date, r.end_day - 1) };
  };

  const overlaps = (s: number, e: number) => {
    for (let d = s; d <= e; d++) if (coveredDays.has(d)) return true;
    return false;
  };

  const openBuilder = () => {
    // default start = first uncovered day
    let firstFree = 1;
    while (firstFree <= totalDays && coveredDays.has(firstFree)) firstFree++;
    setNewStart(firstFree <= totalDays ? firstFree : 1);
    setNewEnd(firstFree <= totalDays ? firstFree : 1);
    setNewName('');
    setBuilderError('');
    setShowBuilder(true);
  };

  const handleCreateRange = async () => {
    setBuilderError('');
    if (newStart < 1 || newEnd > totalDays) { setBuilderError(`Days must be between 1 and ${totalDays}.`); return; }
    if (newEnd < newStart) { setBuilderError('End day must be on or after start day.'); return; }
    if (overlaps(newStart, newEnd)) { setBuilderError('This overlaps an existing range.'); return; }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary-ranges`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_day: newStart, end_day: newEnd, range_name: newName.trim() || null }),
      });
      if (res.ok) {
        const created: ItineraryDayRange = await res.json();
        await fetchAll();
        setSelectedRangeId(created.day_range_id);
        setShowBuilder(false);
      } else {
        setBuilderError((await res.json()).error || 'Failed to create range.');
      }
    } catch (e) { console.error(e); setBuilderError('Failed to create range.'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteRange = async (rangeId: number) => {
    if (!confirm('Delete this range and all its planning?')) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary-ranges/${rangeId}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = ranges.filter(r => r.day_range_id !== rangeId);
        setRanges(remaining);
        if (selectedRangeId === rangeId) setSelectedRangeId(remaining[0]?.day_range_id ?? null);
      }
    } catch (e) { console.error('Error deleting range:', e); }
  };

  const handleRangeUpdate = (updated: ItineraryDayRange) =>
    setRanges(prev => prev.map(r => r.day_range_id === updated.day_range_id ? updated : r));

  const selectedRange = ranges.find(r => r.day_range_id === selectedRangeId) || null;

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10"><div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative p-4 sm:p-6">
      <PageBackground />
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Trip Hub
          </button>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white mb-3">Itinerary</h1>
              {trip && <p className="text-white/70 text-lg mb-3">{trip.trip_name}</p>}
              {trip && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                    <Calendar className="w-4 h-4 text-primary-300" />
                    <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 rounded-full border border-primary-400/30">
                    <span className="text-sm font-medium text-primary-200">{totalDays}D / {totalDays - 1}N</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Builder */}
        {showBuilder && (
          <div className="relative z-50 mb-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">New range</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-xs text-white/50 mb-1">Start day</div>
                <DaySelect
                  value={newStart}
                  totalDays={totalDays}
                  tripStartDate={trip!.start_date}
                  dateFormat={dateFormat}
                  onChange={setNewStart}
                />
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">End day</div>
                <DaySelect
                  value={newEnd}
                  totalDays={totalDays}
                  tripStartDate={trip!.start_date}
                  dateFormat={dateFormat}
                  onChange={setNewEnd}
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="text-xs text-white/50 mb-1">Name (optional)</div>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sea Days"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-white/30" />
              </div>
              <CircleIconButton variant="primary" size="small" onClick={handleCreateRange} isLoading={isSaving} title="Create range"
                icon={<Check className="w-5 h-5" />} />
              <CircleIconButton variant="default" size="small" onClick={() => setShowBuilder(false)} title="Cancel"
                icon={<X className="w-5 h-5" />} />
            </div>
            {trip && newStart >= 1 && newEnd >= newStart && (
              <p className="text-xs text-white/40 mt-2">
                {newStart === newEnd ? formatDate(addDays(trip.start_date, newStart - 1), dateFormat)
                  : `${formatDate(addDays(trip.start_date, newStart - 1), dateFormat)} – ${formatDate(addDays(trip.start_date, newEnd - 1), dateFormat)}`}
              </p>
            )}
            {builderError && <p className="text-sm text-red-300 mt-2">{builderError}</p>}
          </div>
        )}

        {ranges.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-10 text-center">
            <p className="text-white/70 mb-2">No ranges yet.</p>
            <p className="text-white/50 text-sm">Add a range (e.g. “Days 1–3”) to start planning.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[260px_1fr] gap-6">
            {/* Rail */}
            <div className="space-y-2">
              {ranges.map(r => {
                const { start, end } = rangeDates(r);
                const isSingle = r.start_day === r.end_day;
                const dayLbl = isSingle ? `Day ${r.start_day}` : `Days ${r.start_day}–${r.end_day}`;
                const dateLbl = isSingle ? formatDate(start, dateFormat) : `${formatDate(start, dateFormat)} – ${formatDate(end, dateFormat)}`;
                const active = r.day_range_id === selectedRangeId;
                return (
                  <div key={r.day_range_id} onClick={() => setSelectedRangeId(r.day_range_id)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRangeId(r.day_range_id); }}
                    className={cn('w-full text-left rounded-xl p-3 border transition-colors cursor-pointer',
                      active ? 'bg-primary-500/20 border-primary-400' : 'bg-white/5 border-white/15 hover:bg-white/10')}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{r.range_name || dayLbl}</div>
                        <div className="text-xs text-white/50 mt-0.5">{dayLbl} · {dateLbl}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteRange(r.day_range_id); }}
                        className="text-white/30 hover:text-red-400 transition-colors shrink-0 ml-2" title="Delete range">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* unplanned days indicator (loose coverage) */}
              {unplannedLabel && (
                <div className="rounded-xl p-3 border border-dashed border-white/15 bg-white/5">
                  <div className="text-xs text-white/40">Unplanned days: {unplannedLabel}</div>
                  <button onClick={openBuilder} className="text-xs text-primary-300 hover:text-primary-200 mt-1">+ add a range</button>
                </div>
              )}
            </div>

            {/* Detail */}
            <div>
              {selectedRange && trip ? (
                <ItineraryRangeCard
                  tripId={Number(tripId)}
                  range={selectedRange}
                  startDate={rangeDates(selectedRange).start}
                  endDate={rangeDates(selectedRange).end}
                  dateFormat={dateFormat}
                  onUpdate={handleRangeUpdate}
                />
              ) : (
                <div className="bg-white/5 border border-white/15 rounded-xl p-10 text-center text-white/50">Select a range to plan it.</div>
              )}
            </div>
          </div>
        )}
      </div>
      <FloatingActionButton onClick={openBuilder} ariaLabel="Add range" />
    </div>
  );
}