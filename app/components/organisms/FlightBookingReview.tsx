'use client';

import { useState } from 'react';
import AirportCombobox, { type AirportChoice } from '@/app/components/ui/AirportCombobox';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { cn } from '@/app/lib/utils';

interface Leg {
    leg_order: number;
    departure_airport_code: string | null;
    departure_airport_name: string | null;
    departure_city: string | null;
    departure_datetime: string | null;
    arrival_airport_code: string | null;
    arrival_airport_name: string | null;
    arrival_city: string | null;
    arrival_datetime: string | null;
    airline: string | null;
    flight_number: string | null;
    cabin_class: string | null;
    duration_minutes: number | null;
    baggage_allowance: string | null;
    [key: string]: any;
}

interface Booking {
    agency_reference: string | null;
    airline_pnr: string | null;
    booking_source: string | null;
    total_paid: number | null;
    base_fare: number | null;
    currency_code: string | null;
    [key: string]: any;
}

interface ExtractionData {
    booking: Booking;
    legs: Leg[];
    uncertain_fields: string[];
    document_notes: string | null;
    extraction_status?: string;
}

interface Props {
    tripId: number;
    bookingId?: number;          // present = editing an existing booking
    data: ExtractionData;
    onSaved: () => void;
    onCancel: () => void;
}

export default function FlightBookingReview({ tripId, bookingId, data, onCancel, onSaved }: Props) {
    const [booking, setBooking] = useState<Booking>(data.booking);
    const [legs, setLegs] = useState<Leg[]>(data.legs);
    const [uncertain, setUncertain] = useState<Set<string>>(new Set(data.uncertain_fields));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearFlag = (path: string) =>
        setUncertain((prev) => {
            if (!prev.has(path)) return prev;
            const next = new Set(prev);
            next.delete(path);
            return next;
        });

    const setBookingField = (k: keyof Booking, v: any) => {
        setBooking((b) => ({ ...b, [k]: v }));
        clearFlag(`booking.${k}`);
    };

    const setLegField = (i: number, k: keyof Leg, v: any) => {
        setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
        clearFlag(`legs[${i}].${k}`);
    };

    const setLegAirport = (i: number, side: 'departure' | 'arrival', a: AirportChoice) => {
        setLegs((prev) =>
            prev.map((l, idx) =>
                idx === i
                    ? {
                        ...l,
                        [`${side}_airport_code`]: a.iata_code,
                        [`${side}_airport_name`]: a.airport_name,
                        [`${side}_city`]: a.city,
                        [`${side}_timezone`]: a.timezone,
                    }
                    : l
            )
        );
        clearFlag(`legs[${i}].${side}_airport_code`);
    };

    const removeLeg = (i: number) =>
        setLegs((prev) => prev.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, leg_order: idx + 1 })));

    const isFlagged = (path: string) => uncertain.has(path);

    const priceNeedsCurrency = booking.total_paid != null && !booking.currency_code?.trim();

    const canSave =
        legs.length > 0 &&
        legs.every((l) => l.departure_datetime && l.arrival_datetime) &&
        !priceNeedsCurrency;

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const editing = bookingId != null;
            const res = await fetch(
                editing ? `/api/flights/bookings/${bookingId}` : '/api/flights/bookings',
                {
                    method: editing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trip_id: tripId,
                        booking,
                        legs,
                        extraction_status: data.extraction_status ?? 'extracted',
                    }),
                }
            );
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Failed to save booking');
            }
            onSaved();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = (flagged: boolean) =>
        cn(
            'w-full px-2 py-1.5 rounded text-sm bg-white/10 border text-white',
            'focus:outline-none focus:border-primary-400 transition-colors',
            flagged ? 'border-amber-400/60 bg-amber-400/5' : 'border-white/20'
        );

    return (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            {/* Desktop-only guard */}
            <div className="lg:hidden text-center py-12">
                <p className="text-white/80 mb-2">This screen isn’t available on mobile.</p>
                <p className="text-white/50 text-sm">Add flight bookings from a larger screen.</p>
            </div>

            <div className="hidden lg:block">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-semibold text-white">
                        {bookingId != null ? 'Edit booking' : 'Review booking'}
                    </h3>
                    {data.document_notes && (
                        <span className="text-sm text-amber-300/90">{data.document_notes}</span>
                    )}
                </div>

                {/* Booking header strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <Field label="Source">
                        <input
                            value={booking.booking_source ?? ''}
                            onChange={(e) => setBookingField('booking_source', e.target.value)}
                            className={inputCls(isFlagged('booking.booking_source'))}
                        />
                    </Field>
                    <Field label="Agency ref">
                        <input
                            value={booking.agency_reference ?? ''}
                            onChange={(e) => setBookingField('agency_reference', e.target.value)}
                            className={inputCls(isFlagged('booking.agency_reference'))}
                        />
                    </Field>
                    <Field label="Airline PNR">
                        <input
                            value={booking.airline_pnr ?? ''}
                            onChange={(e) => setBookingField('airline_pnr', e.target.value)}
                            className={inputCls(isFlagged('booking.airline_pnr'))}
                        />
                    </Field>
                    <Field label="Total paid">
                        <div className="flex gap-1">
                            <input
                                value={booking.currency_code ?? ''}
                                onChange={(e) => setBookingField('currency_code', e.target.value.toUpperCase())}
                                placeholder="AUD"
                                className={cn(inputCls(isFlagged('booking.currency_code')), 'w-16')}
                            />
                            <input
                                type="number"
                                value={booking.total_paid ?? ''}
                                onChange={(e) => setBookingField('total_paid', e.target.value ? parseFloat(e.target.value) : null)}
                                className={inputCls(isFlagged('booking.total_paid'))}
                            />
                        </div>
                    </Field>
                </div>

                {/* Legs table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left text-white/50 text-xs uppercase tracking-wide">
                                <th className="py-2 pr-2">#</th>
                                <th className="py-2 pr-2">Flight</th>
                                <th className="py-2 pr-2 w-48">From</th>
                                <th className="py-2 pr-2 w-48">To</th>
                                <th className="py-2 pr-2">Depart</th>
                                <th className="py-2 pr-2">Arrive</th>
                                <th className="py-2 pr-2">Cabin</th>
                                <th className="py-2 pr-2">Baggage</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {legs.map((l, i) => (
                                <tr key={i} className="border-t border-white/10 align-top">
                                    <td className="py-2 pr-2 text-white/60">{i + 1}</td>
                                    <td className="py-2 pr-2">
                                        <div className="flex flex-col gap-1">
                                            <input
                                                value={l.flight_number ?? ''}
                                                onChange={(e) => setLegField(i, 'flight_number', e.target.value)}
                                                placeholder="Flight #"
                                                className={cn(inputCls(isFlagged(`legs[${i}].flight_number`)), 'w-32')}
                                            />
                                            <input
                                                value={l.airline ?? ''}
                                                onChange={(e) => setLegField(i, 'airline', e.target.value)}
                                                placeholder="Airline"
                                                className={cn(inputCls(isFlagged(`legs[${i}].airline`)), 'w-32 text-xs')}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-2 pr-2">
                                        <AirportCombobox
                                            value={l.departure_airport_code}
                                            displayCity={l.departure_city}
                                            displayName={l.departure_airport_name}
                                            highlight={isFlagged(`legs[${i}].departure_airport_code`)}
                                            onSelect={(a) => setLegAirport(i, 'departure', a)}
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <AirportCombobox
                                            value={l.arrival_airport_code}
                                            displayCity={l.arrival_city}
                                            displayName={l.arrival_airport_name}
                                            highlight={isFlagged(`legs[${i}].arrival_airport_code`)}
                                            onSelect={(a) => setLegAirport(i, 'arrival', a)}
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <input
                                            type="datetime-local"
                                            value={l.departure_datetime ?? ''}
                                            onChange={(e) => setLegField(i, 'departure_datetime', e.target.value)}
                                            className={inputCls(isFlagged(`legs[${i}].departure_datetime`))}
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <input
                                            type="datetime-local"
                                            value={l.arrival_datetime ?? ''}
                                            onChange={(e) => setLegField(i, 'arrival_datetime', e.target.value)}
                                            className={inputCls(isFlagged(`legs[${i}].arrival_datetime`))}
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <input
                                            value={l.cabin_class ?? ''}
                                            onChange={(e) => setLegField(i, 'cabin_class', e.target.value)}
                                            className={cn(inputCls(isFlagged(`legs[${i}].cabin_class`)), 'w-24')}
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <input
                                            value={l.baggage_allowance ?? ''}
                                            onChange={(e) => setLegField(i, 'baggage_allowance', e.target.value)}
                                            className={cn(inputCls(isFlagged(`legs[${i}].baggage_allowance`)), 'w-40')}
                                        />
                                    </td>
                                    <td className="py-2">
                                        {legs.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLeg(i)}
                                                className="text-white/40 hover:text-red-400 transition-colors"
                                                title="Remove leg"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}
                {priceNeedsCurrency && (
                    <p className="text-amber-300/80 text-sm text-right mb-3">
                        Enter a currency for the amount, or clear the amount.
                    </p>
                )}
                <div className="flex justify-end gap-3 mt-6">
                    <CircleIconButton
                        variant="default"
                        size="small"
                        onClick={onCancel}
                        title="Discard"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        }
                    />
                    <CircleIconButton
                        variant="primary"
                        size="small"
                        onClick={save}
                        isLoading={saving}
                        disabled={!canSave}
                        title="Save booking"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        }
                    />
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs text-white/50 mb-1">{label}</label>
            {children}
        </div>
    );
}