'use client';

import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { X } from 'lucide-react';
import type { AdhocExpense } from '@/app/lib/types/adhoc-expense';

interface AdhocExpenseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: AdhocExpense | null;
}

export default function AdhocExpenseViewModal({
  isOpen,
  onClose,
  expense,
}: AdhocExpenseViewModalProps) {
  if (!isOpen || !expense) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <style jsx global>{`
        .modal-scroll::-webkit-scrollbar {
          width: 6px !important;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent !important;
          margin: 12px 0 !important;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 10px !important;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
        @media (max-width: 640px) {
          .modal-scroll::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto modal-scroll bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Expense Details</h2>
            <CircleIconButton
              variant="default"
              onClick={onClose}
              icon={<X className="w-5 h-5" />}
              title="Close"
            />
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Status & Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 text-sm font-medium rounded-full border ${
                expense.is_active === 1 
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}>
                {expense.is_active === 1 ? 'Active' : 'Inactive'}
              </span>
              {expense.category && (
                <span className="px-2.5 py-1 text-sm font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {expense.category}
                </span>
              )}
            </div>

            {/* Expense Name */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{expense.expense_name}</h3>
              {expense.description && (
                <p className="text-white/70">{expense.description}</p>
              )}
            </div>

            {/* Date */}
            {expense.expense_date && (
              <div>
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Date</h4>
                <p className="text-white">{formatDate(expense.expense_date)}</p>
              </div>
            )}

            {/* Amount */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4">
              <p className="text-white/50 text-sm mb-2">Total Amount</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-green-400">
                  {expense.currency_code} {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {expense.travelers && expense.travelers.length > 0 && (
                <p className="text-sm text-white/50 mt-2">
                  {expense.currency_code} {(expense.amount / expense.travelers.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per person
                </p>
              )}
            </div>

            {/* Travelers */}
            {expense.travelers && expense.travelers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-3">
                  Travelers ({expense.travelers.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expense.travelers.map(t => (
                    <span
                      key={t.traveler_id}
                      className="px-3 py-1.5 text-sm bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-lg"
                    >
                      {t.traveler_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {expense.notes && (
              <div>
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-3">Notes</h4>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <ul className="list-disc list-inside space-y-2">
                    {expense.notes.split('\n').filter(line => line.trim()).map((line, i) => (
                      <li key={i} className="text-white/80">
                        {line.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50 mb-1">Created</p>
                  <p className="text-white/70">
                    {new Date(expense.created_at).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Last Updated</p>
                  <p className="text-white/70">
                    {new Date(expense.updated_at).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}