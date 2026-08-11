'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import Input from '@/app/components/ui/Input';
import CurrencyCombobox from '@/app/components/ui/CurrencyCombobox';
import NoteField from '@/app/components/ui/NoteField';
import ToggleSlider from '@/app/components/ui/ToggleSlider';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
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
  currency_symbol?: string | null;
}

interface Props {
  onClose: () => void;
  tripId: number;
  expense?: AdhocExpense | null;
  travelers: Traveler[];
  currencies: Currency[];
  onSuccess: () => void;
}

export default function AdhocExpenseEntryForm({
  onClose, tripId, expense, travelers, currencies, onSuccess,
}: Props) {
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

  const isEditing = !!expense && expense.adhoc_expense_id > 0;

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
      reset();
      setSelectedTravelers(travelers.filter(t => t.is_active === 1).map(t => t.traveler_id));
    }
  }, [expense, travelers]);

  const reset = () => {
    setExpenseName(''); setDescription(''); setAmount(''); setCurrency('USD');
    setCategory(''); setExpenseDate(''); setNotes(''); setIsActive(true); setSelectedTravelers([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleTraveler = (id: number) =>
    setSelectedTravelers(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });

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
      const res = await fetch(
        isEditing
          ? `/api/trips/${tripId}/adhoc-expenses/${expense!.adhoc_expense_id}`
          : `/api/trips/${tripId}/adhoc-expenses`,
        { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (res.ok) { onSuccess(); handleClose(); }
      else { alert((await res.json()).error || 'Failed to save expense'); }
    } catch (e) {
      console.error('Error saving expense:', e);
      alert('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const label = 'block text-xs text-white/50 mb-1.5';
  const field = 'w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-400 transition-colors';
  const sorted = [...travelers].sort((a, b) => b.is_active - a.is_active);

  // split calc
  const costSharerCount = travelers.filter(t => selectedTravelers.includes(t.traveler_id) && t.is_cost_sharer === 1).length;
  const nonSharerCount = selectedTravelers.length - costSharerCount;
  const perHead = amount && costSharerCount > 0 ? parseFloat(amount) / costSharerCount : null;

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">{isEditing ? 'Edit expense' : 'Add expense'}</h3>

      {/* Row 1 — name, description, category */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[160px]">
          <div className={label}>Expense name <span className="text-red-400">*</span></div>
          <Input name="expenseName" placeholder="Taxi to airport" value={expenseName} onChange={e => setExpenseName(e.target.value)} variant="glass" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className={label}>Description</div>
          <Input name="description" placeholder="Brief description" value={description} onChange={e => setDescription(e.target.value)} variant="glass" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <div className={label}>Category</div>
          <Input name="category" placeholder="Transport, Food…" value={category} onChange={e => setCategory(e.target.value)} variant="glass" />
        </div>
      </div>

      {/* Row 2 — amount, currency, date, status */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="w-36">
          <div className={label}>Amount <span className="text-red-400">*</span></div>
          <input type="number" step="0.01" placeholder="50" className={field} value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <div className={label}>Currency <span className="text-red-400">*</span></div>
          <CurrencyCombobox value={currency} currencies={currencies} onSelect={setCurrency} />
        </div>
        <div className="w-44">
          <div className={label}>Date</div>
          <input type="date" className={field} value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
        </div>
        <div>
          <div className={label}>Status</div>
          <ToggleSlider checked={isActive} onChange={setIsActive} leftLabel="Inactive" rightLabel="Active" />
        </div>
      </div>

      {/* Row 3 — travellers (left) + split callout (right) */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-[1.4] min-w-[240px] bg-white/5 border border-white/15 rounded-lg p-3">
          <div className={label}>Assign to travellers <span className="text-red-400">*</span></div>
          <div className="flex flex-wrap gap-3">
            {sorted.map(t => {
              const on = selectedTravelers.includes(t.traveler_id);
              return (
                <button key={t.traveler_id} type="button" onClick={() => toggleTraveler(t.traveler_id)}
                  className={cn('flex items-center gap-2', t.is_active === 0 && 'opacity-60')}>
                  <span className={cn('w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                    on ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/30 text-transparent')}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <span className="text-sm text-white/85 whitespace-nowrap">{t.traveler_name}</span>
                  {t.is_active === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/30">inactive</span>}
                </button>
              );
            })}
          </div>
        </div>

        {perHead != null && (
          <div className="flex-1 min-w-[200px] bg-primary-500/10 border border-primary-400/35 rounded-lg p-3 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Split among cost sharers</span>
              <span className="text-lg font-bold text-primary-300">{currency} {perHead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              {currency} {parseFloat(amount).toLocaleString()} ÷ {costSharerCount} cost sharer{costSharerCount > 1 ? 's' : ''}
            </p>
            {nonSharerCount > 0 && (
              <p className="text-xs text-white/40 mt-0.5">({nonSharerCount} non-cost sharer{nonSharerCount > 1 ? 's' : ''} not included)</p>
            )}
          </div>
        )}
      </div>

      {/* Row 4 — note */}
      <div className="mb-4">
        <div className={label}>Note</div>
        <NoteField value={notes} onChange={setNotes} placeholder="Airport transfer · Shared ride · Toll included" />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <CircleIconButton type="button" variant="default" size="small" onClick={handleClose} title="Clear"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
        <CircleIconButton type="button" variant="primary" size="small" onClick={handleSubmit} isLoading={isSubmitting}
          disabled={isSubmitting || !expenseName.trim() || !amount || selectedTravelers.length === 0}
          title={isEditing ? 'Update expense' : 'Save expense'}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
      </div>
    </div>
  );
}