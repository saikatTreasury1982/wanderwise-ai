'use client';

import { useState, useEffect } from 'react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import NoteField from '@/app/components/ui/NoteField';
import PaymentMethodCombobox, { PaymentMethod } from '@/app/components/ui/PaymentMethodCombobox';
import type { ExpenseActual } from '@/app/lib/types/expense-actual';

interface Traveler { traveler_id: number; traveler_name: string; is_active: number; }

interface Props {
  actual: ExpenseActual | null;
  tripId: number;
  travelers: Traveler[];
  paymentMethods: PaymentMethod[];
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseActualEditModal({
  actual, tripId, travelers, paymentMethods, onClose, onSaved,
}: Props) {
  const [form, setForm] = useState({
    actual_amount: '', actual_date: '', paid_by_traveler_id: '',
    payment_method_key: '', receipt_url: '', actual_notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (actual) {
      setForm({
        actual_amount: actual.actual_amount?.toString() ?? '',
        actual_date: actual.actual_date || '',
        paid_by_traveler_id: actual.paid_by_traveler_id?.toString() || actual.traveler_id.toString(),
        payment_method_key: actual.payment_method_key || '',
        receipt_url: actual.receipt_url || '',
        actual_notes: actual.actual_notes || '',
      });
    }
  }, [actual]);

  if (!actual) return null;

  const currency = actual.expense_currency;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/expense-actuals/${actual.actual_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_amount: parseFloat(form.actual_amount),
          actual_currency: currency, // derived, record-only
          actual_date: form.actual_date || null,
          paid_by_traveler_id: form.paid_by_traveler_id ? parseInt(form.paid_by_traveler_id) : null,
          payment_method_key: form.payment_method_key || null,
          receipt_url: form.receipt_url || null,
          actual_notes: form.actual_notes || null,
        }),
      });
      if (res.ok) { onSaved(); onClose(); }
      else { alert((await res.json()).error || 'Failed to update actual'); }
    } catch (e) {
      console.error('Error updating actual:', e);
      alert('Failed to update actual');
    } finally {
      setIsSaving(false);
    }
  };

  const label = 'block text-xs text-white/50 mb-1.5';
  const field = 'w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-400 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Edit Actual Payment</h2>
          <p className="text-white/60 text-sm mt-0.5">
            {actual.expense_description} · <span className="text-primary-300">{currency}</span>
          </p>
        </div>

        <div className="p-5">
          {/* Row 1 — amount + date */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <div className={label}>Actual amount <span className="text-red-400">*</span></div>
              <div className="flex">
                <span className="flex items-center px-3 rounded-l-lg bg-white/10 border border-r-0 border-white/20 text-xs text-white/60">{currency}</span>
                <input type="number" step="0.01" placeholder="0.00"
                  className="w-full px-3 py-2 rounded-r-lg text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-400"
                  value={form.actual_amount} onChange={e => setForm({ ...form, actual_amount: e.target.value })} />
              </div>
              <p className="text-[10px] text-white/40 mt-1">Estimated {currency} {actual.estimated_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex-1">
              <div className={label}>Payment date</div>
              <input type="date" className={field} value={form.actual_date} onChange={e => setForm({ ...form, actual_date: e.target.value })} />
            </div>
          </div>

          {/* Row 2 — paid by + method */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <div className={label}>Paid by</div>
              <select className={field} value={form.paid_by_traveler_id} onChange={e => setForm({ ...form, paid_by_traveler_id: e.target.value })}>
                <option value="" className="bg-gray-800">Not set</option>
                {travelers.map(t => <option key={t.traveler_id} value={t.traveler_id} className="bg-gray-800">{t.traveler_name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <div className={label}>Payment method</div>
              <PaymentMethodCombobox
                value={form.payment_method_key}
                methods={paymentMethods}
                onSelect={(key) => setForm({ ...form, payment_method_key: key })}
              />
            </div>
          </div>

          {/* Row 3 — receipt url */}
          <div className="mb-4">
            <div className={label}>Receipt URL</div>
            <input type="url" placeholder="https://…" className={field} value={form.receipt_url} onChange={e => setForm({ ...form, receipt_url: e.target.value })} />
          </div>

          {/* Row 4 — notes */}
          <div className="mb-4">
            <div className={label}>Notes</div>
            <NoteField value={form.actual_notes} onChange={(v) => setForm({ ...form, actual_notes: v })} placeholder="Notes about this payment" />
          </div>

          <div className="flex justify-end gap-2">
            <CircleIconButton variant="default" size="small" onClick={onClose} title="Cancel"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
            <CircleIconButton variant="primary" size="small" onClick={handleSave} isLoading={isSaving} disabled={!form.actual_amount} title="Save changes"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
          </div>
        </div>
      </div>
    </div>
  );
}