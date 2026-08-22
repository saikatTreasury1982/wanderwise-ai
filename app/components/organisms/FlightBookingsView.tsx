'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import FlightBookingReview from './FlightBookingReview';

interface Props {
  tripId: number;
}

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_primary: number;
  is_cost_sharer: number;
  is_active: number;
}

export default function FlightBookingsView({ tripId }: Props) {
  const [extracting, setExtracting] = useState(false);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [editing, setEditing] = useState<{ bookingId: number; data: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [roster, setRoster] = useState<Traveler[]>([]);
  const [assignedByBooking, setAssignedByBooking] = useState<Record<number, number[]>>({});
  const [assignOpen, setAssignOpen] = useState<number | null>(null);
  const [draftAssign, setDraftAssign] = useState<Set<number>>(new Set());
  const [savingAssign, setSavingAssign] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadRoster = async () => {
    const res = await fetch(`/api/trips/${tripId}/travelers`);
    if (res.ok) setRoster((await res.json()).travelers);
  };

  const loadBookings = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/flights/bookings?trip_id=${tripId}`);
      if (res.ok) {
        const list = (await res.json()).bookings;
        setBookings(list);
        setLoadingList(false);            // ← cards render now
        // assignments fill in after
        const entries = await Promise.all(
          list.map(async (b: any) => {
            const r = await fetch(`/api/trips/${tripId}/flights/bookings/${b.booking_id}/travelers`);
            const ids = r.ok ? (await r.json()).travelers.map((t: any) => t.traveler_id) : [];
            return [b.booking_id, ids] as [number, number[]];
          })
        );
        setAssignedByBooking(Object.fromEntries(entries));  // your state name
        return;
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadRoster(); loadBookings(); }, [tripId]);

  const openForEdit = (b: any) => {
    setEditing({
      bookingId: b.booking_id,
      data: {
        booking: {
          agency_reference: b.agency_reference,
          airline_pnr: b.airline_pnr,
          booking_source: b.booking_source,
          booking_date: b.booking_date,
          total_paid: b.total_paid,
          base_fare: b.base_fare,
          currency_code: b.currency_code,
          fare_breakdown: b.fare_breakdown ? JSON.parse(b.fare_breakdown) : null,
        },
        legs: b.legs,
        uncertain_fields: [],
        document_notes: null,
      },
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setExtracting(true);
    setReviewData(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('trip_id', String(tripId));
      const res = await fetch('/api/flights/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read the document');
      setReviewData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setExtracting(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onSaved = () => {
    setReviewData(null);
    loadBookings();
  };

  const openAssign = (bookingId: number) => {
    setAssignOpen(bookingId);
    setDraftAssign(new Set(assignedByBooking[bookingId] ?? []));
  };

  const toggleDraft = (id: number) =>
    setDraftAssign((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const saveAssign = async (bookingId: number) => {
    setSavingAssign(true);
    try {
      const ids = [...draftAssign];
      const res = await fetch(`/api/trips/${tripId}/flights/bookings/${bookingId}/travelers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traveler_ids: ids }),
      });
      if (res.ok) {
        setAssignedByBooking((prev) => ({ ...prev, [bookingId]: ids }));
        setAssignOpen(null);
      }
    } finally {
      setSavingAssign(false);
    }
  };

  const nameOf = (id: number) => roster.find((t) => t.traveler_id === id)?.traveler_name ?? '—';
  const activeRoster = roster.filter((t) => t.is_active === 1);

  return (
    <div>
      {editing ? (
        <FlightBookingReview
          tripId={tripId}
          bookingId={editing.bookingId}
          data={editing.data}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadBookings(); }}
        />
      ) : reviewData ? (
        <FlightBookingReview
          tripId={tripId}
          data={reviewData}
          onCancel={() => setReviewData(null)}
          onSaved={onSaved}
        />
      ) : (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={cn(
              'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
              dragOver ? 'border-primary-400 bg-primary-500/10' : 'border-white/20 bg-white/5 hover:bg-white/10'
            )}
          >
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            {extracting ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/70 text-sm">Reading your itinerary…</p>
              </div>
            ) : (
              <>
                <p className="text-white/80 mb-1">Drop your itinerary here, or click to browse</p>
                <p className="text-white/40 text-sm">PDF or text · from any airline or booking site</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* 75/25 split */}
          <div className="mt-8 flex gap-4 items-start">
            {/* LEFT — cards */}
            <div className="flex-[3] space-y-3">
              {loadingList ? (
                <p className="text-white/40 text-sm">Loading…</p>
              ) : bookings.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No bookings yet. Upload an itinerary to get started.</p>
              ) : (
                bookings.map((b) => {
                  const assigned = assignedByBooking[b.booking_id] ?? [];
                  const isOpen = assignOpen === b.booking_id;
                  return (
                    <div key={b.booking_id} className="bg-white/10 border border-white/20 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <button onClick={() => openForEdit(b)} className="flex-1 text-left group">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-medium group-hover:text-primary-300 transition-colors">
                              {b.booking_source || 'Booking'}
                            </span>
                            {b.airline_pnr && <span className="text-white/50 text-sm">{b.airline_pnr}</span>}
                            {b.total_paid != null ? (
                              <span className="ml-auto text-primary-300 text-sm">
                                {b.currency_code} {b.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="ml-auto text-amber-300/70 text-sm">Add price</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {b.legs.map((l: any) => (
                              <div key={l.leg_id} className="text-sm text-white/70 flex items-center gap-2">
                                <span className="font-mono text-primary-300 w-14">{l.flight_number || '—'}</span>
                                <span>{l.departure_airport_code} → {l.arrival_airport_code}</span>
                                {l.airline && <span className="text-white/50">{l.airline}</span>}
                                <span className="text-white/40 ml-auto">{l.departure_datetime?.replace('T', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </button>

                        <button
                          onClick={async () => {
                            if (!confirm('Delete this booking?')) return;
                            await fetch(`/api/flights/bookings/${b.booking_id}`, { method: 'DELETE' });
                            loadBookings();
                          }}
                          className="text-white/40 hover:text-red-400 transition-colors shrink-0"
                          title="Delete booking"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Travellers row */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 flex-wrap">
                        <span className="text-xs text-white/40">Travellers</span>
                        {assigned.map((id) => (
                          <span key={id} className="text-xs px-2.5 py-1 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-100">
                            {nameOf(id)}
                          </span>
                        ))}
                        <button
                          onClick={() => (isOpen ? setAssignOpen(null) : openAssign(b.booking_id))}
                          className="text-xs px-2.5 py-1 rounded-full border border-dashed border-white/25 text-white/50 hover:border-primary-400 hover:text-white/80 transition-colors"
                        >
                          {isOpen ? 'close' : '+ assign'}
                        </button>
                      </div>

                      {/* Inline checklist */}
                      {isOpen && (
                        <div className="mt-3 p-3 bg-white/5 border border-white/15 rounded-lg">
                          <div className="text-xs text-white/50 mb-2">Assign active travellers</div>
                          {activeRoster.length === 0 ? (
                            <p className="text-xs text-white/40">No active travellers on this trip.</p>
                          ) : (
                            <div className="space-y-2">
                              {activeRoster.map((t) => {
                                const checked = draftAssign.has(t.traveler_id);
                                return (
                                  <button
                                    key={t.traveler_id}
                                    onClick={() => toggleDraft(t.traveler_id)}
                                    className="flex items-center gap-2 w-full text-left"
                                  >
                                    <span className={cn(
                                      'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                                      checked ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/30 text-transparent'
                                    )}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                    <span className="text-sm text-white/85">{t.traveler_name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => setAssignOpen(null)}
                              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <button
                              onClick={() => saveAssign(b.booking_id)}
                              disabled={savingAssign}
                              className="w-8 h-8 rounded-full bg-primary-500/30 border border-primary-400 flex items-center justify-center text-white hover:bg-primary-500/50 transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT — roster */}
            <div className="flex-1 bg-white/10 border border-white/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">Trip travelers</div>
              {roster.length === 0 ? (
                <p className="text-white/40 text-xs">No travellers yet.</p>
              ) : (
                roster.map((t) => (
                  <div key={t.traveler_id} className="flex items-center gap-2 py-1.5 flex-wrap">
                    <span className={cn('text-sm', t.is_active === 1 ? 'text-white/85' : 'text-white/40')}>
                      {t.traveler_name}
                    </span>
                    {t.is_primary === 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-200">Primary</span>
                    )}
                    {t.is_cost_sharer === 1 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-400/40 text-green-200">Payer</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/50">Non payer</span>
                    )}
                    {t.is_active !== 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-400/40 text-red-200">Inactive</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}