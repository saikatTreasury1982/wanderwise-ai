'use client';

import { useState, useMemo, useRef } from 'react';
import type { AccommodationOption } from '@/app/lib/types/accommodation';
import TogglePill from '@/app/components/ui/TogglePill';
import { cn } from '@/app/lib/utils';
import { formatDate } from '@/app/lib/utils';

interface Props {
    accommodations: AccommodationOption[];
    onEdit: (a: AccommodationOption) => void;
    onDelete: (id: number) => void;
    onStatusChange: (id: number, status: AccommodationOption['status']) => void;
    dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
}

type SortKey = 'price_per_night' | 'total_price' | 'nights' | 'check_in';
type Status = 'draft' | 'shortlisted' | 'confirmed';

const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const nightsOf = (a: AccommodationOption) => {
    if (!a.check_in_date || !a.check_out_date) return null;
    const d = Math.ceil((new Date(a.check_out_date).getTime() - new Date(a.check_in_date).getTime()) / 86400000);
    return d > 0 ? d : null;
};

const STATUS_OPTIONS: { value: Status; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'confirmed', label: 'Confirmed' },
];

export default function AccommodationComparisonTable({ accommodations, onEdit, onDelete, onStatusChange, dateFormat }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('price_per_night');
    const [notesPopup, setNotesPopup] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);   // ← here, inside

    const onWheel = (e: React.WheelEvent) => {         // ← here, inside
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
            el.scrollLeft += e.deltaY;
            e.preventDefault();
        }
    };

    const sorted = useMemo(() => {
        const arr = [...accommodations];
        arr.sort((a, b) => {
            if (sortKey === 'price_per_night') return (a.price_per_night ?? Infinity) - (b.price_per_night ?? Infinity);
            if (sortKey === 'total_price') return (a.total_price ?? Infinity) - (b.total_price ?? Infinity);
            if (sortKey === 'nights') return (nightsOf(a) ?? Infinity) - (nightsOf(b) ?? Infinity);
            return (a.check_in_date ?? '').localeCompare(b.check_in_date ?? '');
        });
        return arr;
    }, [accommodations, sortKey]);

    if (accommodations.length === 0) {
        return (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                <p className="text-white/70 mb-2">No accommodation options yet.</p>
                <p className="text-white/50 text-sm">Add options above to compare them here.</p>
            </div>
        );
    }

    const sortBtn = (key: SortKey, label: string) => (
        <button onClick={() => setSortKey(key)}
            className={cn('px-3 h-8 rounded-lg text-sm border transition-colors',
                sortKey === key ? 'bg-primary-500/30 border-primary-400 text-white' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10')}>
            {label}
        </button>
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm text-white/50">Sort by</span>
                {sortBtn('price_per_night', 'price/night')}
                {sortBtn('total_price', 'total')}
                {sortBtn('nights', 'nights')}
                {sortBtn('check_in', 'check-in')}
            </div>

            {/* sort buttons */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div ref={scrollRef} onWheel={onWheel} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-white/50 text-xs uppercase tracking-wide">
                                <th className="py-2.5 px-3 text-left">Name</th>
                                <th className="py-2.5 px-3 text-left">Type</th>
                                <th className="py-2.5 px-3 text-left">Location</th>
                                <th className="py-2.5 px-3 text-left">Check-in → out</th>
                                <th className="py-2.5 px-3 text-center">Nights</th>
                                <th className="py-2.5 px-3 text-right">Price/night</th>
                                <th className="py-2.5 px-3 text-right">Total</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-center">Travellers</th>
                                <th className="py-2.5 px-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((a) => {
                                const n = nightsOf(a);
                                return (
                                    <tr key={a.accommodation_option_id} className="border-t border-white/10 hover:bg-white/5 transition-colors align-middle">
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white">{a.accommodation_name || '—'}</span>
                                                {a.notes && a.notes.trim() && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setNotesPopup(a.notes)}
                                                        className="text-primary-300/70 hover:text-primary-300 transition-colors"
                                                        title="View notes"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            {(a.booking_source || a.booking_reference) && (
                                                <div className="text-xs text-white/40 mt-0.5">
                                                    {[a.booking_source, a.booking_reference].filter(Boolean).join(' · ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">{a.type_name || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">{a.location || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                                            {a.check_in_date ? formatDate(a.check_in_date, dateFormat) : '—'} → {a.check_out_date ? formatDate(a.check_out_date, dateFormat) : '—'}
                                        </td>
                                        <td className="py-3 px-3 text-white/70 text-center">{n ?? '—'}</td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            {a.price_per_night != null ? <span className="text-white font-medium">{a.currency_code} {fmtMoney(a.price_per_night)}</span> : <span className="text-amber-300/70">—</span>}
                                        </td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            {a.total_price != null ? <span className="text-white font-medium">{a.currency_code} {fmtMoney(a.total_price)}</span> : <span className="text-amber-300/70">—</span>}
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex justify-center">
                                                <TogglePill
                                                    value={(a.status === 'not_selected' ? 'draft' : a.status) as Status}
                                                    onChange={(v) => onStatusChange(a.accommodation_option_id, v as AccommodationOption['status'])}
                                                    options={STATUS_OPTIONS}
                                                    activeColors={{
                                                        draft: 'bg-white/20 border-white/40',
                                                        shortlisted: 'bg-yellow-500/30 border-yellow-400',
                                                        confirmed: 'bg-primary-500/30 border-primary-400',
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex flex-wrap gap-1 justify-center max-w-[160px] mx-auto">
                                                {(a.travelers ?? []).map(t => (
                                                    <span key={t.traveler_id} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-100 whitespace-nowrap">
                                                        {t.traveler_name}
                                                    </span>
                                                ))}
                                                {(!a.travelers || a.travelers.length === 0) && <span className="text-white/30 text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => onEdit(a)} className="text-white/40 hover:text-white transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => onDelete(a.accommodation_option_id)} className="text-white/40 hover:text-red-400 transition-colors" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            {(() => {
                const confirmed = accommodations.filter(a => a.status === 'confirmed' && a.total_price != null);
                const totals: Record<string, number> = {};
                confirmed.forEach(a => {
                    const cur = a.currency_code || '—';
                    totals[cur] = (totals[cur] || 0) + a.total_price!;
                });
                const line = Object.entries(totals).map(([c, n]) => `${c} ${fmtMoney(n)}`).join(' + ');
                return confirmed.length ? (
                    <div className="mt-3 px-1 text-sm text-white/70">
                        Confirmed total <span className="text-primary-300 font-medium">{line}</span>
                    </div>
                ) : null;
            })()}

            {/* notes modal — HERE, top level, sibling of the table */}
            {notesPopup !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNotesPopup(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">Notes</h4>
                            <button onClick={() => setNotesPopup(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <ul className="space-y-1.5">
                            {notesPopup.split('\n').filter(l => l.trim()).map((line, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                    <span className="text-primary-400 mt-0.5">•</span><span>{line.trim()}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}