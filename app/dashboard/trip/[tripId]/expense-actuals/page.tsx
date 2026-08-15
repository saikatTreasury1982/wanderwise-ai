'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { formatDateRange, formatDate } from '@/app/lib/utils';
import type { ExpenseActual, SettlementSummary } from '@/app/lib/types/expense-actual';
import PaymentMethodCombobox from '@/app/components/ui/PaymentMethodCombobox';
import ExpenseActualEditModal from '@/app/components/organisms/ExpenseActualEditModal';

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
}

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_active: number;
}

interface PaymentMethod {
  payment_method_id: number;
  payment_type: string;
  issuer: string;
  payment_method_key: string;
  is_active: number;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function ExpenseActualsPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [actuals, setActuals] = useState<ExpenseActual[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [settlement, setSettlement] = useState<SettlementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [overBudgetOnly, setOverBudgetOnly] = useState(false);
  const [notesPopup, setNotesPopup] = useState<string | null>(null);
  const [editingActual, setEditingActual] = useState<ExpenseActual | null>(null);
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    }
  };

  const fetchActuals = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/expense-actuals`);
      if (response.ok) {
        const data = await response.json();
        setActuals(data.actuals);
      }
    } catch (error) {
      console.error('Error fetching actuals:', error);
    }
  };

  const fetchTravelers = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/travelers`);
      if (response.ok) {
        const data = await response.json();
        setTravelers(data.travelers);
      }
    } catch (error) {
      console.error('Error fetching travelers:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/user/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods.filter((pm: PaymentMethod) => pm.is_active === 1));
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchSettlement = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/expense-actuals/settlement`);
      if (response.ok) {
        const data = await response.json();
        setSettlement(data);
      }
    } catch (error) {
      console.error('Error fetching settlement:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setDateFormat(data.preferences?.date_format || 'DD Mmm YYYY');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTrip(),
        fetchActuals(),
        fetchTravelers(),
        fetchPaymentMethods(),
        fetchSettlement(),
        fetchPreferences(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [tripId]);

  const handleTransfer = async () => {
    if (!confirm('Transfer forecast to actuals? This will initialize actual expenses based on your forecast.')) return;

    setIsTransferring(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/expense-actuals/transfer`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        await fetchActuals();
        await fetchSettlement();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to transfer forecast');
      }
    } catch (error) {
      console.error('Error transferring forecast:', error);
      alert('Failed to transfer forecast');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE all actual expense data and reset everything.\n\nYou will need to transfer the forecast again and re-enter all payment information.\n\nAre you sure you want to continue?')) return;

    setIsResetting(true);
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/expense-actuals/reset`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);

        // Reload all data
        await Promise.all([
          fetchActuals(),
          fetchSettlement(),
        ]);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reset actuals');
      }
    } catch (error) {
      console.error('Error resetting actuals:', error);
      alert('Failed to reset actuals');
    } finally {
      setIsResetting(false);
      setIsProcessing(false);
    }
  };

  const openEditModal = (actual: ExpenseActual) => setEditingActual(actual);

  // Group actuals by expense
  const groupedByExpense = actuals.reduce((acc, actual) => {
    const key = `${actual.expense_id}-${actual.expense_description}`;
    if (!acc[key]) {
      acc[key] = {
        expense_id: actual.expense_id,
        expense_description: actual.expense_description || 'Unknown',
        expense_currency: actual.expense_currency || 'USD',
        estimated_amount: actual.estimated_amount || 0,
        actuals: [],
      };
    }
    acc[key].actuals.push(actual);
    return acc;
  }, {} as Record<string, {
    expense_id: number;
    expense_description: string;
    expense_currency: string;
    estimated_amount: number;
    actuals: ExpenseActual[];
  }>);

  const expenses = Object.values(groupedByExpense);

  // per-group actual + variance
  const expenseStats = expenses.map(exp => {
    const actualSum = exp.actuals.reduce((s, a) => s + (a.actual_amount ?? 0), 0);
    const variance = actualSum - exp.estimated_amount;
    return { ...exp, actualSum, variance };
  });

  // auto-expand over-budget groups on first load
  useEffect(() => {
    const over = new Set(expenseStats.filter(e => e.variance > 0.001).map(e => e.expense_id));
    setExpandedGroups(over);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actuals]);

  const visibleExpenses = overBudgetOnly
    ? expenseStats.filter(e => e.variance > 0.001)
    : expenseStats;

  const toggleGroup = (id: number) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const destination = [trip.destination_city, trip.destination_country].filter(Boolean).join(', ');
  const hasActuals = actuals.length > 0;

  return (
    <div className="min-h-screen relative p-4 sm:p-6 pb-24">
      <PageBackground />
      <LoadingOverlay isLoading={isProcessing} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Hub
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Expense Actuals</h1>
          <p className="text-white/70 text-base sm:text-lg mb-3">{trip.trip_name}</p>

          <div className="flex flex-wrap items-center gap-3">
            {destination && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{destination}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
            </div>

            {(() => {
              const start = new Date(trip.start_date);
              const end = new Date(trip.end_date);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const nights = days - 1;
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 rounded-full border border-primary-400/30">
                  <span className="text-sm font-medium text-primary-200">{days}D / {nights}N</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* No Actuals Yet */}
        {!hasActuals ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Actuals Yet</h3>
            <p className="text-white/70 text-sm sm:text-base mb-6 max-w-md mx-auto">
              Transfer your cost forecast to actuals to start tracking real payments and expenses.
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <CircleIconButton
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  isLoading={isTransferring}
                  variant="primary"
                  size="medium"
                  title="Transfer Forecast to Actuals"
                  icon={
                    <svg className="w-4 h-4 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  }
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Transfer Forecast to Actuals
                </div>
              </div>
              <span className="text-sm text-white/60 font-medium">Transfer Forecast</span>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {settlement && (
              <>
                <div className="flex justify-end mb-4">
                  <div className="relative group">
                    <CircleIconButton
                      onClick={handleReset}
                      disabled={isResetting}
                      isLoading={isResetting}
                      variant="default"
                      size="small"
                      title="Reset Actuals"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      }
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      Reset All Actuals
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Estimated Total</div>
                    <div className="text-2xl font-bold text-white">
                      {settlement.total_estimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Actual Total</div>
                    <div className="text-2xl font-bold text-white">
                      {settlement.total_actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Variance</div>
                    <div className={`text-2xl font-bold ${settlement.variance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {settlement.variance >= 0 ? '+' : ''}{settlement.variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Expenses List */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden mb-6">
              <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Expense Actuals ({actuals.length})</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setOverBudgetOnly(false)}
                    className={`px-3 h-8 rounded-lg text-sm border transition-colors ${!overBudgetOnly ? 'bg-primary-500/30 border-primary-400 text-white' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}
                  >All</button>
                  <button
                    onClick={() => setOverBudgetOnly(true)}
                    className={`px-3 h-8 rounded-lg text-sm border transition-colors ${overBudgetOnly ? 'bg-red-500/30 border-red-400 text-white' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}
                  >Over budget</button>
                </div>
              </div>

              <div className="divide-y divide-white/10">
                {visibleExpenses.length === 0 ? (
                  <div className="p-6 text-center text-white/50 text-sm">No over-budget expenses.</div>
                ) : visibleExpenses.map(expense => {
                  const open = expandedGroups.has(expense.expense_id);
                  const over = expense.variance > 0.001;
                  const under = expense.variance < -0.001;
                  const badge = over
                    ? { text: `+${expense.expense_currency} ${expense.variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over`, cls: 'bg-red-500/15 text-red-300 border-red-400/40' }
                    : under
                      ? { text: `${expense.expense_currency} ${expense.variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} under`, cls: 'bg-green-500/15 text-green-300 border-green-400/40' }
                      : { text: 'on budget', cls: 'bg-primary-500/15 text-primary-300 border-primary-400/40' };
                  return (
                    <div key={expense.expense_id}>
                      {/* group header */}
                      <button onClick={() => toggleGroup(expense.expense_id)} className="w-full flex items-center justify-between gap-3 p-4 sm:px-6 hover:bg-white/5 transition-colors text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <svg className={`w-4 h-4 text-white/50 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">{expense.expense_description}</div>
                            <div className="text-white/50 text-xs mt-0.5">
                              Est {expense.expense_currency} {expense.estimated_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Act {expense.expense_currency} {expense.actualSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${badge.cls}`}>{badge.text}</span>
                      </button>

                      {/* payments (compact rows) */}
                      {open && (
                        <div className="px-4 sm:px-6 pb-3">
                          {expense.actuals.map(actual => (
                            <div key={actual.actual_id} className="flex items-center justify-between gap-3 py-2 px-1 border-b border-white/5 last:border-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm min-w-0">
                                <span className="text-white font-medium w-24 truncate">{actual.traveler_name}</span>
                                {actual.actual_amount != null && <span className="text-primary-300 font-medium whitespace-nowrap">{expense.expense_currency} {actual.actual_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                                {actual.paid_by_name && <span className="text-white/50 text-xs whitespace-nowrap">by {actual.paid_by_name}</span>}
                                {actual.actual_date && <span className="text-white/50 text-xs whitespace-nowrap">{formatDate(actual.actual_date, dateFormat)}</span>}
                                {actual.payment_method_key && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/15 whitespace-nowrap">{actual.payment_method_key}</span>}
                                {actual.actual_notes && (
                                  <button onClick={() => setNotesPopup(actual.actual_notes!)} className="text-primary-300/70 hover:text-primary-300 transition-colors" title="View note">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                )}
                              </div>
                              <button onClick={() => openEditModal(actual)} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors shrink-0" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settlement Summary */}
            {settlement && settlement.settlements.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Settlement Summary</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {settlement.settlements.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center text-white text-sm font-medium">
                            {s.from_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white text-sm">
                              <span className="font-medium">{s.from_name}</span>
                              <span className="text-white/60"> pays </span>
                              <span className="font-medium">{s.to_name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-primary-300 font-semibold">
                          {s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {notesPopup !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNotesPopup(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Note</h4>
              <button onClick={() => setNotesPopup(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-white/80 whitespace-pre-line">{notesPopup}</p>
          </div>
        </div>
      )}

      <ExpenseActualEditModal
        actual={editingActual}
        tripId={Number(tripId)}
        travelers={travelers}
        paymentMethods={paymentMethods}
        dateFormat={dateFormat}
        onClose={() => setEditingActual(null)}
        onSaved={() => { fetchActuals(); fetchSettlement(); }}
      />
    </div>
  );
}