'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { formatDateRange, formatDate } from '@/app/lib/utils';
import type { ExpenseActual, SettlementSummary } from '@/app/lib/types/expense-actual';

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
  
  // Edit modal state
  const [editingActual, setEditingActual] = useState<ExpenseActual | null>(null);
  const [editForm, setEditForm] = useState({
    actual_amount: '',
    actual_date: '',
    paid_by_traveler_id: '',
    payment_method_key: '',
    receipt_url: '',
    actual_notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const openEditModal = (actual: ExpenseActual) => {
    setEditingActual(actual);
    setEditForm({
      actual_amount: actual.actual_amount.toString(),
      actual_date: actual.actual_date || '',
      paid_by_traveler_id: actual.paid_by_traveler_id?.toString() || actual.traveler_id.toString(), // Default to the traveler
      payment_method_key: actual.payment_method_key || '',
      receipt_url: actual.receipt_url || '',
      actual_notes: actual.actual_notes || '',
    });
  };

  const closeEditModal = () => {
    setEditingActual(null);
    setEditForm({
      actual_amount: '',
      actual_date: '',
      paid_by_traveler_id: '',
      payment_method_key: '',
      receipt_url: '',
      actual_notes: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingActual) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/expense-actuals/${editingActual.actual_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_amount: parseFloat(editForm.actual_amount),
          actual_date: editForm.actual_date || null,
          paid_by_traveler_id: editForm.paid_by_traveler_id ? parseInt(editForm.paid_by_traveler_id) : null,
          payment_method_key: editForm.payment_method_key || null,
          receipt_url: editForm.receipt_url || null,
          actual_notes: editForm.actual_notes || null,
        }),
      });

      if (response.ok) {
        await fetchActuals();
        await fetchSettlement();
        closeEditModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update actual');
      }
    } catch (error) {
      console.error('Error updating actual:', error);
      alert('Failed to update actual');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
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
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{destination}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-400/30">
                  <span className="text-sm font-medium text-purple-200">{days}D / {nights}N</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* No Actuals Yet */}
        {!hasActuals ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-14 h-14 sm:w-16 sm:h-16"
                  title="Transfer Forecast to Actuals"
                  icon={
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="w-10 h-10 sm:w-12 sm:h-12"
                      title="Reset Actuals"
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="px-4 sm:px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Expense Actuals ({actuals.length})</h3>
              </div>
              <div className="divide-y divide-white/10">
                {expenses.map(expense => (
                  <div key={expense.expense_id} className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{expense.expense_description}</h4>
                        <p className="text-white/50 text-sm">
                          Estimated: {expense.expense_currency} {expense.estimated_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {expense.actuals.map(actual => (
                        <div
                          key={actual.actual_id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{actual.traveler_name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60 mt-1">
                              {actual.actual_amount != null && (
                                <span>Amount: {expense.expense_currency} {actual.actual_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              )}
                              {actual.paid_by_name && <span>Paid by: {actual.paid_by_name}</span>}
                              {actual.actual_date && <span>Date: {formatDate(actual.actual_date, dateFormat)}</span>}
                              {actual.payment_method_key && <span>Method: {actual.payment_method_key}</span>}
                            </div>
                            {actual.actual_notes && (
                              <div className="text-xs text-white/50 mt-2 italic">
                                {actual.actual_notes}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => openEditModal(actual)}
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                          <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-white text-sm font-medium">
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
                        <div className="text-purple-300 font-semibold">
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

      {/* Edit Modal */}
      {editingActual && (
        <>
          <style jsx>{`
            .modal-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .modal-scroll::-webkit-scrollbar-track {
              background: transparent;
              margin: 12px 0;
            }
            .modal-scroll::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 10px;
            }
            .modal-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
            .modal-scroll::-webkit-scrollbar-button {
              display: none !important;
              height: 0 !important;
              width: 0 !important;
            }
            @media (max-width: 640px) {
              .modal-scroll::-webkit-scrollbar {
                display: none;
              }
            }
          `}</style>

          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeEditModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
              className="modal-scroll relative z-10 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Edit Actual Payment</h2>
                <p className="text-white/60 text-sm mt-1">{editingActual.expense_description}</p>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 space-y-5">
                {/* Amount */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">
                    Actual Amount <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={editForm.actual_amount}
                    onChange={e => setEditForm({ ...editForm, actual_amount: e.target.value })}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    required
                  />
                  <p className="text-xs text-white/50 mt-1.5">
                    Estimated: {editingActual.expense_currency} {editingActual.estimated_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Paid By</label>
                  <select
                    value={editForm.paid_by_traveler_id}
                    onChange={e => setEditForm({ ...editForm, paid_by_traveler_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-purple-400"
                  >
                    <option value="" className="bg-gray-800">Not set</option>
                    {travelers.map(t => (
                      <option key={t.traveler_id} value={t.traveler_id} className="bg-gray-800">
                        {t.traveler_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Payment Date</label>
                  <input
                    type="date"
                    value={editForm.actual_date}
                    onChange={e => setEditForm({ ...editForm, actual_date: e.target.value })}
                    className="w-full px-0.3 py-3 sm:px-3 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Payment Method</label>
                  <select
                    value={editForm.payment_method_key}
                    onChange={e => setEditForm({ ...editForm, payment_method_key: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-purple-400"
                  >
                    <option value="" className="bg-gray-800">Not set</option>
                    {paymentMethods.map(pm => (
                      <option key={pm.payment_method_key} value={pm.payment_method_key} className="bg-gray-800">
                        {pm.payment_method_key}
                        {pm.issuer && ` (${pm.issuer}`}
                        {pm.payment_type && `${pm.issuer ? ' • ' : ' ('}${pm.payment_type})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receipt URL */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Receipt URL</label>
                  <input
                    type="url"
                    value={editForm.receipt_url}
                    onChange={e => setEditForm({ ...editForm, receipt_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Notes</label>
                  <textarea
                    value={editForm.actual_notes}
                    onChange={e => setEditForm({ ...editForm, actual_notes: e.target.value })}
                    rows={3}
                    placeholder="Add any notes about this payment..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <CircleIconButton
                    variant="default"
                    onClick={closeEditModal}
                    title="Cancel"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                  <CircleIconButton
                    variant="primary"
                    onClick={handleSaveEdit}
                    isLoading={isSaving}
                    disabled={!editForm.actual_amount}
                    title="Save changes"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}