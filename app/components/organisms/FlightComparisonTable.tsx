'use client';

import type { FlightOption } from '@/app/lib/types/flight';
import { cn } from '@/app/lib/utils';
import React, { useState, useMemo, useEffect } from 'react';

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_active: number;
}

interface Props {
  tripId: number;
  flights: FlightOption[];
  onEdit: (flight: FlightOption) => void;
  onDelete: (flightId: number) => void;
}

type SortKey = 'price' | 'duration' | 'depart';

const fmtDuration = (m: number | null) => (m == null ? '—' : `${Math.floor(m / 60)}h ${m % 60}m`);
const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDepart = (dt: string | null) => {
  if (!dt) return '—';
  const [date, time] = dt.split('T');
  return time ? `${date} ${time}` : date;
};

const stopsLabel = (f: FlightOption) => {
  const vias = [f.connection_1_airport, f.connection_2_airport].filter(Boolean);
  return vias.length === 0 ? 'direct' : `${vias.length} · ${vias.join(', ')}`;
};

const routeLabel = (f: FlightOption) =>
  `${f.departure_airport} → ${f.arrival_airport} ${f.flight_type === 'round_trip' ? 'return' : 'one-way'}`;

export default function FlightComparisonTable({ tripId, flights, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const [roster, setRoster] = useState<Traveler[]>([]);
  const [assignedByOption, setAssignedByOption] = useState<Record<number, number[]>>({});
  const [assignOpen, setAssignOpen] = useState<number | null>(null);
  const [draftAssign, setDraftAssign] = useState<Set<number>>(new Set());
  const [savingAssign, setSavingAssign] = useState(false);

  // load roster + per-option assignments
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/trips/${tripId}/travelers`);
      if (r.ok) setRoster((await r.json()).travelers);
    })();
  }, [tripId]);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        flights.map(async (f) => {
          const r = await fetch(`/api/trips/${tripId}/flights/${f.flight_option_id}/travelers`);
          const ids = r.ok ? (await r.json()).travelers.map((t: any) => t.traveler_id) : [];
          return [f.flight_option_id!, ids] as [number, number[]];
        })
      );
      setAssignedByOption(Object.fromEntries(entries));
    })();
  }, [flights, tripId]);

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sorted = useMemo(() => {
    const arr = [...flights];
    arr.sort((a, b) => {
      if (sortKey === 'price') return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sortKey === 'duration') return (a.outbound_duration_minutes ?? Infinity) - (b.outbound_duration_minutes ?? Infinity);
      return (a.depart_datetime ?? '').localeCompare(b.depart_datetime ?? '');
    });
    return arr;
  }, [flights, sortKey]);

  const summary = useMemo(() => {
    const priced = flights.filter((f) => f.price != null);
    const timed = flights.filter((f) => f.outbound_duration_minutes != null);
    const cheapest = priced.length ? priced.reduce((a, b) => (a.price! < b.price! ? a : b)) : null;
    const fastest = timed.length ? timed.reduce((a, b) => (a.outbound_duration_minutes! < b.outbound_duration_minutes! ? a : b)) : null;
    return { cheapest, fastest };
  }, [flights]);

  const selectedTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    flights.forEach((f) => {
      if (checked.has(f.flight_option_id!) && f.price != null) {
        const cur = f.currency_code || '—';
        totals[cur] = (totals[cur] || 0) + f.price;
      }
    });
    return totals;
  }, [checked, flights]);

  const hasChecked = checked.size > 0;
  const totalLine = Object.entries(selectedTotals).map(([cur, amt]) => `${cur} ${fmtMoney(amt)}`).join(' + ');

  const nameOf = (id: number) => roster.find((t) => t.traveler_id === id)?.traveler_name ?? '—';
  const activeRoster = roster.filter((t) => t.is_active === 1);

  const openAssign = (optionId: number) => {
    setAssignOpen(optionId);
    setDraftAssign(new Set(assignedByOption[optionId] ?? []));
  };

  const toggleDraft = (id: number) =>
    setDraftAssign((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const saveAssign = async (optionId: number) => {
    setSavingAssign(true);
    try {
      const ids = [...draftAssign];
      const res = await fetch(`/api/trips/${tripId}/flights/${optionId}/travelers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traveler_ids: ids }),
      });
      if (res.ok) {
        setAssignedByOption((prev) => ({ ...prev, [optionId]: ids }));
        setAssignOpen(null);
      }
    } finally {
      setSavingAssign(false);
    }
  };

  if (flights.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
        <p className="text-white/70 mb-2">No flight options yet.</p>
        <p className="text-white/50 text-sm">Add options above to compare them here.</p>
      </div>
    );
  }

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={cn(
        'px-3 h-8 rounded-lg text-sm border transition-colors',
        sortKey === key ? 'bg-primary-500/30 border-primary-400 text-white' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-white/50">Sort by</span>
        {sortBtn('price', 'price')}
        {sortBtn('duration', 'duration')}
        {sortBtn('depart', 'date')}
        {hasChecked && (
          <span className="ml-auto text-sm text-white/50">{checked.size} selected</span>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-white/50 text-xs uppercase tracking-wide">
                <th className="py-2.5 px-3"></th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Stops</th>
                <th className="py-2.5 px-3">Airline</th>
                <th className="py-2.5 px-3">Depart</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3">Travelers</th>
                <th className="py-2.5 px-3">Note</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => {
                const isReturn = f.flight_type === 'round_trip';
                const isChecked = checked.has(f.flight_option_id!);
                const assigned = assignedByOption[f.flight_option_id!] ?? [];
                const isOpen = assignOpen === f.flight_option_id;
                return (
                  <React.Fragment key={f.flight_option_id}>
                    <tr className={cn('border-t border-white/10 transition-colors align-top', isChecked ? 'bg-primary-500/10' : 'hover:bg-white/5')}>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => toggle(f.flight_option_id!)}
                          aria-pressed={isChecked}
                          title={isChecked ? 'Deselect' : 'Select'}
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                            isChecked ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/30 text-transparent hover:border-primary-400'
                          )}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-white whitespace-nowrap">
                        <div>{f.departure_airport} → {f.arrival_airport}</div>
                        {isReturn && <div className="text-white/60 mt-1">{f.arrival_airport} → {f.departure_airport}</div>}
                      </td>
                      <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                        <div>{stopsLabel(f)}</div>
                        {isReturn && <div className="text-white/50 mt-1">{stopsLabel(f)}</div>}
                      </td>
                      <td className="py-3 px-3 text-white/70">{f.airline || '—'}</td>
                      <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                        <div>{fmtDepart(f.depart_datetime)}</div>
                        {isReturn && <div className="text-white/50 mt-1">{fmtDepart(f.return_depart_datetime)}</div>}
                      </td>
                      <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                        <div>{fmtDuration(f.outbound_duration_minutes)}</div>
                        {isReturn && <div className="text-white/50 mt-1">{fmtDuration(f.return_duration_minutes)}</div>}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {f.price != null ? (
                          <span className="text-white font-medium">{f.currency_code} {fmtMoney(f.price)}</span>
                        ) : (
                          <span className="text-amber-300/70">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                          {assigned.map((id) => (
                            <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-100 whitespace-nowrap">
                              {nameOf(id)}
                            </span>
                          ))}
                          <button
                            onClick={() => (isOpen ? setAssignOpen(null) : openAssign(f.flight_option_id!))}
                            className="text-xs px-2 py-0.5 rounded-full border border-dashed border-white/25 text-white/50 hover:border-primary-400 hover:text-white/80 transition-colors whitespace-nowrap"
                          >
                            {isOpen ? 'close' : '+ assign'}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-white/50 max-w-[200px]">{f.notes ? f.notes.split('\n')[0] : ''}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button onClick={() => onEdit(f)} className="text-white/40 hover:text-white transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => onDelete(f.flight_option_id!)} className="text-white/40 hover:text-red-400 transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr key={`${f.flight_option_id}-assign`} className="bg-white/5">
                        <td colSpan={10} className="px-3 py-3">
                          <div className="text-xs text-white/50 mb-2">Assign active travelers</div>
                          {activeRoster.length === 0 ? (
                            <p className="text-xs text-white/40">No active travelers on this trip.</p>
                          ) : (
                            <div className="flex flex-wrap gap-4">
                              {activeRoster.map((t) => {
                                const on = draftAssign.has(t.traveler_id);
                                return (
                                  <button key={t.traveler_id} onClick={() => toggleDraft(t.traveler_id)} className="flex items-center gap-2">
                                    <span className={cn('w-4 h-4 rounded-md border flex items-center justify-center transition-colors', on ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/30 text-transparent')}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                    <span className="text-sm text-white/85">{t.traveler_name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setAssignOpen(null)} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors" title="Cancel">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <button onClick={() => saveAssign(f.flight_option_id!)} disabled={savingAssign} className="w-8 h-8 rounded-full bg-primary-500/30 border border-primary-400 flex items-center justify-center text-white hover:bg-primary-500/50 transition-colors disabled:opacity-50" title="Save">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 px-1 space-y-1 text-sm">
        {hasChecked && (
          <div className="text-white/70">Selected total <span className="text-primary-300 font-medium">{totalLine}</span></div>
        )}
        {summary.cheapest && (
          <div className="text-white/60">Cheapest <span className="text-white/80">{routeLabel(summary.cheapest)}</span> · <span className="text-primary-300 font-medium">{summary.cheapest.currency_code} {fmtMoney(summary.cheapest.price!)}</span></div>
        )}
        {summary.fastest && (
          <div className="text-white/60">Fastest <span className="text-white/80">{routeLabel(summary.fastest)}</span> · <span className="text-white font-medium">{fmtDuration(summary.fastest.outbound_duration_minutes)}</span></div>
        )}
      </div>
    </div>
  );
}