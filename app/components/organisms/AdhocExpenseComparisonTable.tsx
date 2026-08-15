'use client';

import { useState, useMemo, useRef } from 'react';
import type { AdhocExpense } from '@/app/lib/types/adhoc-expense';
import TogglePill from '@/app/components/ui/TogglePill';
import { cn, formatDate } from '@/app/lib/utils';

interface Props {
    expenses: AdhocExpense[];
    dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
    onEdit: (e: AdhocExpense) => void;
    onCopy: (e: AdhocExpense) => void;
    onDelete: (id: number) => void;
    onStatusChange: (id: number, isActive: number) => void;
}

type SortKey = 'expense_date' | 'amount' | 'expense_name';
type ActiveVal = 'active' | 'inactive';

const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_OPTIONS: { value: ActiveVal; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function AdhocExpenseComparisonTable({ expenses, dateFormat, onEdit, onCopy, onDelete, onStatusChange }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('expense_date');
    const [notesPopup, setNotesPopup] = useState<string | null>(null);
    type TravelerRow = NonNullable<AdhocExpense['travelers']>[number];
    const [travelersPopup, setTravelersPopup] = useState<TravelerRow[] | null>(null);
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
        const arr = [...expenses];
        arr.sort((a, b) => {
            if (sortKey === 'amount') return (a.amount ?? Infinity) - (b.amount ?? Infinity);
            if (sortKey === 'expense_name') return (a.expense_name ?? '').localeCompare(b.expense_name ?? '');
            return (a.expense_date ?? '').localeCompare(b.expense_date ?? '');
        });
        return arr;
    }, [expenses, sortKey]);

    const perHead = (e: AdhocExpense) => {
        const sharers = (e.travelers ?? []).filter(t => t.is_cost_sharer === 1).length;
        return sharers > 0 ? { amount: e.amount / sharers, count: sharers } : null;
    };

    if (expenses.length === 0) {
        return (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                <p className="text-white/70 mb-2">No expenses yet.</p>
                <p className="text-white/50 text-sm">Add expenses above to see them here.</p>
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
                {sortBtn('expense_date', 'date')}
                {sortBtn('amount', 'amount')}
                {sortBtn('expense_name', 'name')}
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div ref={scrollRef} onWheel={onWheel} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-white/50 text-xs uppercase tracking-wide">
                                <th className="py-2.5 px-3 text-left">Expense</th>
                                <th className="py-2.5 px-3 text-left">Category</th>
                                <th className="py-2.5 px-3 text-left">Date</th>
                                <th className="py-2.5 px-3 text-right">Amount</th>
                                <th className="py-2.5 px-3 text-right">Split</th>
                                <th className="py-2.5 px-3 text-center">Travellers</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((e) => {
                                const ph = perHead(e);
                                const travCount = e.travelers?.length ?? 0;
                                const inactive = e.is_active === 0;
                                return (
                                    <tr key={e.adhoc_expense_id} className={cn('border-t border-white/10 hover:bg-white/5 transition-colors align-middle', inactive && 'opacity-55')}>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white">{e.expense_name}</span>
                                                {e.notes && e.notes.trim() && (
                                                    <button type="button" onClick={() => setNotesPopup(e.notes)} className="text-primary-300/70 hover:text-primary-300 transition-colors" title="View notes">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                            {e.description && <div className="text-xs text-white/40 mt-0.5">{e.description}</div>}
                                        </td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">{e.category || '—'}</td>
                                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">{e.expense_date ? formatDate(e.expense_date, dateFormat) : '—'}</td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap text-white font-medium">{e.currency_code} {fmtMoney(e.amount)}</td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            {ph ? <span className="text-primary-300">{fmtMoney(ph.amount)} <span className="text-white/40 text-xs">×{ph.count}</span></span> : <span className="text-white/30">—</span>}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            {travCount > 0 ? (
                                                <button onClick={() => setTravelersPopup(e.travelers ?? [])} className="inline-flex items-center gap-1 text-white/70 hover:text-white transition-colors" title="View travellers">
                                                    <span>{travCount}</span>
                                                    <svg className="w-3.5 h-3.5 text-primary-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            ) : <span className="text-white/30">—</span>}
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex justify-center">
                                                <TogglePill
                                                    value={inactive ? 'inactive' : 'active'}
                                                    onChange={(v) => onStatusChange(e.adhoc_expense_id, v === 'active' ? 1 : 0)}
                                                    options={STATUS_OPTIONS}
                                                    activeColors={{
                                                        active: 'bg-primary-500/30 border-primary-400',
                                                        inactive: 'bg-white/15 border-white/40',
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => onEdit(e)} className="text-white/40 hover:text-white transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => onCopy(e)} className="text-white/40 hover:text-blue-400 transition-colors" title="Copy">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                                <button onClick={() => onDelete(e.adhoc_expense_id)} className="text-white/40 hover:text-red-400 transition-colors" title="Delete">
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

            {/* Active total summary */}
            {(() => {
                const active = expenses.filter(e => e.is_active === 1);
                const totals: Record<string, number> = {};
                active.forEach(e => { const c = e.currency_code || '—'; totals[c] = (totals[c] || 0) + e.amount; });
                const line = Object.entries(totals).map(([c, n]) => `${c} ${fmtMoney(n)}`).join(' + ');
                return active.length ? (
                    <div className="mt-3 px-1 text-sm text-white/70">Active total <span className="text-primary-300 font-medium">{line}</span></div>
                ) : null;
            })()}

            {/* Notes modal */}
            {notesPopup !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNotesPopup(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">Notes</h4>
                            <button onClick={() => setNotesPopup(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <ul className="space-y-1.5">
                            {notesPopup.split('\n').filter(l => l.trim()).map((line, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-white/80"><span className="text-primary-400 mt-0.5">•</span><span>{line.trim()}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Travellers modal */}
            {travelersPopup !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setTravelersPopup(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">Travellers</h4>
                            <button onClick={() => setTravelersPopup(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <ul className="space-y-1.5">
                            {travelersPopup.map(t => (
                                <li key={t.traveler_id} className="flex items-center justify-between text-sm">
                                    <span className="text-white/85">{t.traveler_name}</span>
                                    {t.is_cost_sharer === 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/20">not sharing</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}