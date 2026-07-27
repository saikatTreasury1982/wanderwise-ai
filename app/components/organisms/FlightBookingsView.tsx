'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import FlightBookingReview from './FlightBookingReview';

interface Props {
    tripId: number;
}

export default function FlightBookingsView({ tripId }: Props) {
    const [extracting, setExtracting] = useState(false);
    const [reviewData, setReviewData] = useState<any | null>(null);
    const [editing, setEditing] = useState<{ bookingId: number; data: any } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const fileInput = useRef<HTMLInputElement>(null);

    const loadBookings = async () => {
        setLoadingList(true);
        try {
            const res = await fetch(`/api/flights/bookings?trip_id=${tripId}`);
            if (res.ok) setBookings((await res.json()).bookings);
        } finally {
            setLoadingList(false);
        }
    };

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

    useEffect(() => { loadBookings(); }, [tripId]);

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

    return (
        <div>
            {editing ? (
                /* Editing a saved booking */
                <FlightBookingReview
                    tripId={tripId}
                    bookingId={editing.bookingId}
                    data={editing.data}
                    onCancel={() => setEditing(null)}
                    onSaved={() => { setEditing(null); loadBookings(); }}
                />
            ) : reviewData ? (
                /* Reviewing a fresh upload */
                <FlightBookingReview
                    tripId={tripId}
                    data={reviewData}
                    onCancel={() => setReviewData(null)}
                    onSaved={onSaved}
                />
            ) : (
                /* Default: drop zone + list */
                <>
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

                    <div className="mt-8 space-y-3">
                        {loadingList ? (
                            <p className="text-white/40 text-sm">Loading…</p>
                        ) : bookings.length === 0 ? (
                            <p className="text-white/40 text-sm text-center py-8">No bookings yet. Upload an itinerary to get started.</p>
                        ) : (
                            bookings.map((b) => (
                                <div key={b.booking_id} className="bg-white/10 border border-white/20 rounded-xl p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <button
                                            onClick={() => openForEdit(b)}
                                            className="flex-1 text-left group"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-white font-medium group-hover:text-primary-300 transition-colors">
                                                    {b.booking_source || 'Booking'}
                                                </span>
                                                {b.airline_pnr && <span className="text-white/50 text-sm">{b.airline_pnr}</span>}
                                                {b.total_paid != null ? (
                                                    <span className="ml-auto text-primary-300 text-sm">
                                                        {b.currency_code} {b.total_paid.toLocaleString()}
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
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}