'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import ToggleSlider from '@/app/components/ui/ToggleSlider';
import type { AdhocExpense } from '@/app/lib/types/adhoc-expense';

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

interface AdhocExpenseEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  expense?: AdhocExpense | null;
  travelers: Traveler[];
  currencies: Currency[];
  onSuccess: () => void;
}

export default function AdhocExpenseEntryForm({
  isOpen,
  onClose,
  tripId,
  expense,
  travelers,
  currencies,
  onSuccess,
}: AdhocExpenseEntryFormProps) {
  const [expenseName, setExpenseName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedTravelers, setSelectedTravelers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = expense && expense.adhoc_expense_id > 0;

  useEffect(() => {
    if (expense) {
      setExpenseName(expense.expense_name);
      setDescription(expense.description || '');
      setAmount(expense.amount.toString());
      setCurrency(expense.currency_code);
      setCategory(expense.category || '');
      setExpenseDate(expense.expense_date || '');
      setNotes(expense.notes || '');
      setIsActive(expense.is_active === 1);
      setSelectedTravelers(expense.travelers?.map(t => t.traveler_id) || []);
    } else {
      resetForm();
      // Auto-select all active travelers
      const activeTravelerIds = travelers.filter(t => t.is_active === 1).map(t => t.traveler_id);
      setSelectedTravelers(activeTravelerIds);
    }
  }, [expense, travelers]);

  const resetForm = () => {
    setExpenseName('');
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setCategory('');
    setExpenseDate('');
    setNotes('');
    setIsActive(true);
    setSelectedTravelers([]);
  };

  const handleToggleTraveler = (travelerId: number) => {
    setSelectedTravelers(prev => {
      if (prev.includes(travelerId)) {
        if (prev.length === 1) return prev; // Don't allow deselecting all
        return prev.filter(id => id !== travelerId);
      }
      return [...prev, travelerId];
    });
  };

  const handleSubmit = async () => {
    if (!expenseName.trim() || !amount || selectedTravelers.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        expense_name: expenseName.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        currency_code: currency,
        category: category.trim() || null,
        expense_date: expenseDate || null,
        notes: notes.trim() || null,
        is_active: isActive ? 1 : 0,
        traveler_ids: selectedTravelers,
      };

      let response;
      if (isEditing) {
        response = await fetch(`/api/trips/${tripId}/adhoc-expenses/${expense.adhoc_expense_id}`, {
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

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Sort travelers: active first, then inactive
  const sortedTravelers = [...travelers].sort((a, b) => b.is_active - a.is_active);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h3>
      </div>

      {/* Content */}
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
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder:text-white/30 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Amount & Currency - Stack on mobile */}
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
            >
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
        <div className="min-w-0">
          <label className="block text-sm text-white/60 mb-1.5">Date</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-0.3 py-3 sm:px-3 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Total Projected */}
        {amount && selectedTravelers.length > 0 && (() => {
          const costSharers = travelers.filter(t => 
            selectedTravelers.includes(t.traveler_id) && t.is_cost_sharer === 1
          );
          const costSharerCount = costSharers.length;
          
          return costSharerCount > 0 && (
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">Split Among Cost Sharers</span>
                <span className="text-lg font-bold text-purple-300">
                  {currency} {(parseFloat(amount) / costSharerCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                {currency} {parseFloat(amount).toLocaleString()} ÷ {costSharerCount} cost sharer{costSharerCount > 1 ? 's' : ''}
              </p>
              {selectedTravelers.length > costSharerCount && (
                <p className="text-xs text-white/40 mt-1">
                  ({selectedTravelers.length - costSharerCount} non-cost sharer{selectedTravelers.length - costSharerCount > 1 ? 's' : ''} not included)
                </p>
              )}
            </div>
          );
        })()}
        
        {/* Assign to Travelers */}
        <div>
          <label className="block text-sm text-white/70 mb-3">
            Assign to Travelers <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {sortedTravelers.map(traveler => (
              <label
                key={traveler.traveler_id}
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => handleToggleTraveler(traveler.traveler_id)}
                  className="flex-shrink-0"
                >
                  {selectedTravelers.includes(traveler.traveler_id) ? (
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                  )}
                </button>
                <span className="text-white flex-1 text-base">{traveler.traveler_name}</span>
                {traveler.is_active === 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/30">
                    inactive
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">
            Notes <span className="text-xs text-white/40">(each line becomes a bullet point)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Airport transfer&#10;Shared ride&#10;Toll included"
            rows={4}
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
          <label className="block text-sm text-white/60 mb-2">Status</label>
          <ToggleSlider
            checked={isActive}
            onChange={setIsActive}
            leftLabel="Inactive"
            rightLabel="Active"
          />
          <p className="text-xs text-white/40 mt-2">
            {isActive ? 'Include in forecast' : 'Exclude from forecast'}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <CircleIconButton
          type="button"
          variant="default"
          onClick={handleClose}
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
          onClick={handleSubmit}
          disabled={isSubmitting || !expenseName.trim() || !amount || selectedTravelers.length === 0}
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
  );
}