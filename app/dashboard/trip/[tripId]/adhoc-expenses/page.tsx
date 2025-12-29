'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import AdhocExpenseCard from '@/app/components/organisms/AdhocExpenseCard';
import AdhocExpenseViewModal from '@/app/components/organisms/AdhocExpenseViewModal';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { cn } from '@/app/lib/utils';
import type { AdhocExpense, CreateAdhocExpenseInput } from '@/app/lib/types/adhoc-expense';
import { formatDateRange } from '@/app/lib/utils';

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
  is_cost_sharer: number;
}

interface Currency {
  currency_code: string;
  currency_name: string;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function AdhocExpensesPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<AdhocExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<AdhocExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<AdhocExpense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({
    date_format: 'YYYY-MM-DD',
  });

  // Form state
  const [expenseName, setExpenseName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedTravelers, setSelectedTravelers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = selectedExpense && selectedExpense.adhoc_expense_id > 0;

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.status === 404) {
        router.push('/dashboard');
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

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/adhoc-expenses`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
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

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies');
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.currencies);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrip(), fetchExpenses(), fetchTravelers(), fetchCurrencies(), fetchPreferences()]);
      setIsLoading(false);
    };
    loadData();
  }, [tripId]);

  // Load expense data when editing
  useEffect(() => {
    if (selectedExpense) {
      setExpenseName(selectedExpense.expense_name);
      setDescription(selectedExpense.description || '');
      setAmount(selectedExpense.amount.toString());
      setCurrency(selectedExpense.currency_code);
      setCategory(selectedExpense.category || '');
      setExpenseDate(selectedExpense.expense_date || '');
      setNotes(selectedExpense.notes || '');
      setIsActive(selectedExpense.is_active === 1);
      setSelectedTravelers(selectedExpense.travelers?.map(t => t.traveler_id) || []);
    } else {
      resetForm();
      // Auto-select all active travelers
      const activeTravelerIds = travelers.filter(t => t.is_active === 1).map(t => t.traveler_id);
      setSelectedTravelers(activeTravelerIds);
    }
  }, [selectedExpense, travelers]);

  const resetForm = () => {
    setExpenseName('');
    setDescription('');
    setAmount('');
    setCurrency('');
    setCategory('');
    setExpenseDate('');
    setNotes('');
    setIsActive(true);
    setSelectedTravelers([]);
    setError(null);
  };

  const handleView = (expense: AdhocExpense) => {
    setViewingExpense(expense);
  };

  const handleEdit = (expense: AdhocExpense) => {
    setSelectedExpense(expense);
    setShowForm(true);
  };

  const handleCopy = async (expense: AdhocExpense) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/adhoc-expenses/${expense.adhoc_expense_id}`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchExpenses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to copy expense');
      }
    } catch (error) {
      console.error('Error copying expense:', error);
      alert('Failed to copy expense');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/adhoc-expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchExpenses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (expenseId: number, isActive: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/adhoc-expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (response.ok) {
        await fetchExpenses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSuccess = () => {
    fetchExpenses();
    setSelectedExpense(null);
    setShowForm(false);
  };

  const handleFormClear = () => {
    setSelectedExpense(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setShowForm(true);
  };

  const toggleTraveler = (travelerId: number) => {
    setSelectedTravelers(prev =>
      prev.includes(travelerId)
        ? prev.length > 1 ? prev.filter(id => id !== travelerId) : prev
        : [...prev, travelerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!expenseName.trim() || !amount || selectedTravelers.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const payload: any = {
        expense_name: expenseName.trim(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        currency_code: currency,
        expense_date: expenseDate || undefined,
        category: category.trim() || undefined,
        is_active: isActive ? 1 : 0,
        notes: notes.trim() || undefined,
        traveler_ids: selectedTravelers,
      };

      let response;
      if (isEditing) {
        response = await fetch(`/api/trips/${tripId}/adhoc-expenses/${selectedExpense.adhoc_expense_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/trips/${tripId}/adhoc-expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save expense');
      }

      resetForm();
      handleFormSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group expenses for display
  const activeExpenses = expenses.filter(e => e.is_active === 1);
  const inactiveExpenses = expenses.filter(e => e.is_active === 0);

  // Sort travelers: active first, then inactive
  const sortedTravelers = [...travelers].sort((a, b) => b.is_active - a.is_active);

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

  if (!trip) {
    return null;
  }

  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ');

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

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Extra Costs</h1>
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
              <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, preferences.date_format)}</span>
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

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Form (conditional) */}
          {showForm && (
            <div>
              <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {isEditing ? 'Edit Expense' : 'Add Expense'}
                </h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  {/* Expense Name */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">
                      Expense Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      placeholder="Taxi to airport"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Amount & Currency */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">
                        Amount <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="50"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">
                        Currency <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-purple-400"
                        required
                      >
                        <option value="" className="bg-gray-800">Select</option>
                        {currencies.map(c => (
                          <option key={c.currency_code} value={c.currency_code} className="bg-gray-800">
                            {c.currency_code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Transport, Food, Entertainment"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Total Projected Amount */}
                  {amount && selectedTravelers.length > 0 && (() => {
                    const costSharers = travelers.filter(t => 
                      selectedTravelers.includes(t.traveler_id) && t.is_cost_sharer === 1
                    );
                    const costSharerCount = costSharers.length;
                    
                    return costSharerCount > 0 && (
                      <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base text-white/70">Split Among Cost Sharers</span>
                          <span className="text-xl font-bold text-purple-300">
                            {currency || ''} {(parseFloat(amount) / costSharerCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/50 mt-1">
                          {currency || ''} {parseFloat(amount).toLocaleString()} ÷ {costSharerCount} cost sharer{costSharerCount > 1 ? 's' : ''}
                        </p>
                        {selectedTravelers.length > costSharerCount && (
                          <p className="text-xs text-white/40 mt-1">
                            ({selectedTravelers.length - costSharerCount} non-cost sharer{selectedTravelers.length - costSharerCount > 1 ? 's' : ''} not included)
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Travelers */}
                  {sortedTravelers.length > 0 && (
                    <div>
                      <label className="block text-sm text-white/70 mb-3">
                        Travelers <span className="text-red-400">*</span>
                      </label>
                      <div className="space-y-2">
                        {sortedTravelers.map(t => (
                          <label
                            key={t.traveler_id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
                              t.is_active === 0 && "opacity-60"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTravelers.includes(t.traveler_id)}
                              onChange={() => toggleTraveler(t.traveler_id)}
                              className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400 cursor-pointer"
                            />
                            <span className="text-base text-white/80">{t.traveler_name}</span>
                            {t.is_active === 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/30">
                                inactive
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">
                      Notes <span className="text-xs text-white/40">(each line becomes a bullet point)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Airport transfer&#10;Shared ride&#10;Toll included"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400 resize-none"
                    />
                    {notes && notes.trim() && (
                      <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-white/50 mb-1.5">Preview:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {notes.split('\n').filter(line => line.trim()).map((line, i) => (
                            <li key={i} className="text-sm text-white/70">{line.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Status</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isActive}
                          onChange={() => setIsActive(true)}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-base">Active (include in forecast)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isActive}
                          onChange={() => setIsActive(false)}
                          className="w-4 h-4"
                        />
                        <span className="text-white/70 text-base">Inactive (exclude)</span>
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <CircleIconButton
                      type="button"
                      variant="default"
                      onClick={handleFormClear}
                      title="Clear form"
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    />
                    <CircleIconButton
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      title={isEditing ? 'Update expense' : 'Save expense'}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Right column - Expenses list */}
          <div className={showForm ? '' : 'lg:col-span-2'}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Saved Expenses ({expenses.length})
              </h3>
            </div>

            {expenses.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white/70 mb-2">No expenses yet.</p>
                <p className="text-white/50 text-sm">Click the + button to add your first expense.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active */}
                {activeExpenses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Active</h4>
                    <div className="space-y-3">
                      {activeExpenses.map(expense => (
                        <AdhocExpenseCard
                          key={expense.adhoc_expense_id}
                          expense={expense}
                          dateFormat={preferences.date_format}
                          onView={handleView}
                          onEdit={handleEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive */}
                {inactiveExpenses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">Inactive</h4>
                    <div className="space-y-3">
                      {inactiveExpenses.map(expense => (
                        <AdhocExpenseCard
                          key={expense.adhoc_expense_id}
                          expense={expense}
                          dateFormat={preferences.date_format}
                          onView={handleView}
                          onEdit={handleEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      {!showForm && (
        <FloatingActionButton
          onClick={handleAddNew}
          ariaLabel="Add expense"
        />
      )}

      {/* View Modal */}
      <AdhocExpenseViewModal
        isOpen={viewingExpense !== null}
        onClose={() => setViewingExpense(null)}
        expense={viewingExpense}
      />
    </div>
  );
}