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
    const [detailsFor, setDetailsFor] = useState<AccommodationOption | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const onWheel = (e: React.WheelEvent) => {
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

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div ref={scrollRef} onWheel={onWheel} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-white/50 text-xs uppercase tracking-wide">
                                <th className="py-2.5 px-3 text-left">Name</th>
                                <th className="py-2.5 px-3 text-left">Location</th>
                                <th className="py-2.5 px-3 text-center">Nights</th>
                                <th className="py-2.5 px-3 text-right">Price/night</th>
                                <th className="py-2.5 px-3 text-right">Total</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((a) => {
                                const n = nightsOf(a);
                                const travelerCount = a.travelers?.length ?? 0;
                                const hasNotes = !!(a.notes && a.notes.trim());
                                const hasDetails = hasNotes || travelerCount > 0;
                                return (
                                    <tr key={a.accommodation_option_id} className="border-t border-white/10 hover:bg-white/5 transition-colors align-top">
                                        {/* Name + type + check-in/out beneath */}
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white">{a.accommodation_name || '—'}</span>
                                                {hasDetails && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailsFor(a)}
                                                        className="text-primary-300/70 hover:text-primary-300 transition-colors"
                                                        title="View details"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            {a.type_name && (
                                                <div className="text-xs text-white/50 mt-0.5">{a.type_name}</div>
                                            )}
                                            {(a.check_in_date || a.check_out_date) && (
                                                <div className="text-xs text-white/40 mt-0.5">
                                                    {a.check_in_date ? formatDate(a.check_in_date, dateFormat) : '—'} → {a.check_out_date ? formatDate(a.check_out_date, dateFormat) : '—'}
                                                </div>
                                            )}
                                            {(a.booking_source || a.booking_reference) && (
                                                <div className="text-xs text-white/40 mt-0.5 whitespace-normal break-words max-w-[200px]">
                                                    {[a.booking_source, a.booking_reference].filter(Boolean).join(' · ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap align-middle">{a.location || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 text-center align-middle">{n ?? '—'}</td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap align-middle">
                                            {a.price_per_night != null ? <span className="text-white font-medium">{a.currency_code} {fmtMoney(a.price_per_night)}</span> : <span className="text-amber-300/70">—</span>}
                                        </td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap align-middle">
                                            {a.total_price != null ? <span className="text-white font-medium">{a.currency_code} {fmtMoney(a.total_price)}</span> : <span className="text-amber-300/70">—</span>}
                                        </td>
                                        <td className="py-3 px-3 align-middle">
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
                                        <td className="py-3 px-3 whitespace-nowrap align-middle">
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

            {/* Details popup — Notes + Travelers */}
            {detailsFor !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailsFor(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5 max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-white truncate pr-2">{detailsFor.accommodation_name || 'Details'}</h4>
                            <button onClick={() => setDetailsFor(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Travelers */}
                        <div className="mb-4">
                            <div className="text-xs uppercase tracking-wide text-white/40 mb-2">Travellers ({detailsFor.travelers?.length ?? 0})</div>
                            {(detailsFor.travelers && detailsFor.travelers.length > 0) ? (
                                <div className="space-y-1.5">
                                    {detailsFor.travelers.map(t => {
                                        const inactive = t.is_active === 0;
                                        return (
                                            <div key={t.traveler_id} className={cn('flex items-center gap-2 flex-wrap', inactive && 'opacity-50')}>
                                                <span className="text-sm text-white/90">{t.traveler_name}</span>
                                                {t.is_primary === 1 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-200">Primary</span>
                                                )}
                                                {t.is_cost_sharer === 1 ? (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-400/40 text-green-200">Payer</span>
                                                ) : (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/50">Non Payer</span>
                                                )}
                                                {inactive && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-400/40 text-red-200">Inactive</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-white/40">No travellers assigned.</p>
                            )}
                        </div>

                        {/* Notes */}
                        {detailsFor.notes && detailsFor.notes.trim() && (
                            <div>
                                <div className="text-xs uppercase tracking-wide text-white/40 mb-2">Notes</div>
                                <ul className="space-y-1.5">
                                    {detailsFor.notes.split('\n').filter(l => l.trim()).map((line, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                            <span className="text-primary-400 mt-0.5">•</span><span>{line.trim()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}