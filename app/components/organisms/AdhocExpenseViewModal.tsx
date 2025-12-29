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
          className="relative z-10 w-full max-w-lg md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4 sm:p-5 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Expense Details</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
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
            {(() => {
              const costSharers = expense.travelers?.filter(t => t.is_cost_sharer === 1) || [];
              const costSharerCount = costSharers.length;
              
              return (
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                  <p className="text-white/50 text-xs sm:text-sm mb-1.5">Total Amount</p>
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                      {expense.currency_code} {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-sm text-white/50">total</span>
                  </div>
                  {costSharerCount > 0 && (
                    <p className="text-sm text-white/50 mt-1.5">
                      {expense.currency_code} {(expense.amount / costSharerCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per cost sharer
                    </p>
                  )}
                  {expense.travelers && expense.travelers.length > costSharerCount && (
                    <p className="text-xs text-white/40 mt-1">
                      ({expense.travelers.length - costSharerCount} non-cost sharer{expense.travelers.length - costSharerCount > 1 ? 's' : ''} not included)
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Travelers */}
            {expense.travelers && expense.travelers.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wide mb-2 sm:mb-3">Travelers</h3>
                <div className="flex flex-wrap gap-2">
                  {expense.travelers.map(t => (
                    <span
                      key={t.traveler_id}
                      className={`px-2.5 py-1.5 text-sm rounded-lg ${
                        t.is_cost_sharer === 1
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                      }`}
                    >
                      {t.traveler_name}
                      {t.is_cost_sharer === 0 && <span className="ml-1 text-xs">(non-cost)</span>}
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