'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import AdhocExpenseCard from '@/app/components/organisms/AdhocExpenseCard';
import AdhocExpenseViewModal from '@/app/components/organisms/AdhocExpenseViewModal';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import AdhocExpenseEntryForm from '@/app/components/organisms/AdhocExpenseEntryForm';
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

  // Group expenses for display
  const activeExpenses = expenses.filter(e => e.is_active === 1);
  const inactiveExpenses = expenses.filter(e => e.is_active === 0);

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
              <AdhocExpenseEntryForm
                isOpen={showForm}
                onClose={handleFormClear}
                tripId={parseInt(tripId)}
                expense={selectedExpense}
                travelers={travelers}
                currencies={currencies}
                onSuccess={handleFormSuccess}
              />
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