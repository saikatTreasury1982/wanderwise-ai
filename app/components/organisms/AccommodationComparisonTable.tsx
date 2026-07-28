'use client';

import { useState, useMemo } from 'react';
import type { AccommodationOption } from '@/app/lib/types/accommodation';
import SelectPill from '@/app/components/ui/SelectPill';
import { cn } from '@/app/lib/utils';

interface Props {
    accommodations: AccommodationOption[];
    onEdit: (a: AccommodationOption) => void;
    onDelete: (id: number) => void;
    onStatusChange: (id: number, status: AccommodationOption['status']) => void;
}

type SortKey = 'price_per_night' | 'total_price' | 'nights' | 'check_in';

const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const nightsOf = (a: AccommodationOption) => {
    if (!a.check_in_date || !a.check_out_date) return null;
    const d = Math.ceil((new Date(a.check_out_date).getTime() - new Date(a.check_in_date).getTime()) / 86400000);
    return d > 0 ? d : null;
};

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'not_selected', label: 'Not Selected' },
];

export default function AccommodationComparisonTable({ accommodations, onEdit, onDelete, onStatusChange }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('price_per_night');

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

    const summary = useMemo(() => {
        const byNight = accommodations.filter(a => a.price_per_night != null);
        const byTotal = accommodations.filter(a => a.total_price != null);
        const cheapestNight = byNight.length ? byNight.reduce((a, b) => (a.price_per_night! < b.price_per_night! ? a : b)) : null;
        const cheapestTotal = byTotal.length ? byTotal.reduce((a, b) => (a.total_price! < b.total_price! ? a : b)) : null;
        const stays = accommodations.map(nightsOf).filter((n): n is number => n != null);
        const shortest = stays.length ? Math.min(...stays) : null;
        const longest = stays.length ? Math.max(...stays) : null;
        return { cheapestNight, cheapestTotal, shortest, longest };
    }, [accommodations]);

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
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left text-white/50 text-xs uppercase tracking-wide">
                                <th className="py-2.5 px-3">Name</th>
                                <th className="py-2.5 px-3">Type</th>
                                <th className="py-2.5 px-3">Location</th>
                                <th className="py-2.5 px-3">Check-in → out</th>
                                <th className="py-2.5 px-3">Nights</th>
                                <th className="py-2.5 px-3 text-right">Price/night</th>
                                <th className="py-2.5 px-3 text-right">Total</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Travellers</th>
                                <th className="py-2.5 px-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((a) => {
                                const n = nightsOf(a);
                                return (
                                    <tr key={a.accommodation_option_id} className="border-t border-white/10 hover:bg-white/5 transition-colors align-top">
                                        <td className="py-3 px-3 text-white whitespace-nowrap">{a.accommodation_name || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">{a.type_name || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">{a.location || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                                            {a.check_in_date || '—'} → {a.check_out_date || '—'}
                                        </td>
                                        <td className="py-3 px-3 text-white/70">{n ?? '—'}</td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            {a.price_per_night != null ? <span className="text-white font-medium">{a.currency_code} {fmtMoney(a.price_per_night)}</span> : <span className="text-amber-300/70">—</span>}
                                        </td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            {a.total_price != null ? <span className="text-white font-medium">{a.currency_code} {fmtMoney(a.total_price)}</span> : <span className="text-amber-300/70">—</span>}
                                        </td>
                                        <td className="py-3 px-3">
                                            <SelectPill
                                                value={a.status}
                                                onChange={(v) => onStatusChange(a.accommodation_option_id, v as AccommodationOption['status'])}
                                                ariaLabel="Status"
                                                options={STATUS_OPTIONS}
                                            />
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                {(a.travelers ?? []).map(t => (
                                                    <span key={t.traveler_id} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-100 whitespace-nowrap">
                                                        {t.traveler_name}
                                                    </span>
                                                ))}
                                                {(!a.travelers || a.travelers.length === 0) && <span className="text-white/30 text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex gap-2">
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
        </div>
    );
}