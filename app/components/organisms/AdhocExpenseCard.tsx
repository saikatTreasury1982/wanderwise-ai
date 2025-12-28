'use client';

import { cn, formatDate, formatDateRange } from '@/app/lib/utils';
import type { AdhocExpense } from '@/app/lib/types/adhoc-expense';

interface AdhocExpenseCardProps {
  expense: AdhocExpense;
  dateFormat?: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onView: (expense: AdhocExpense) => void;
  onEdit: (expense: AdhocExpense) => void;
  onCopy: (expense: AdhocExpense) => void;
  onDelete: (expenseId: number) => void;
  onStatusChange: (expenseId: number, isActive: number) => void;
}

export default function AdhocExpenseCard({
  expense,
  dateFormat = 'DD Mmm YYYY',
  onView,
  onEdit,
  onCopy,
  onDelete,
  onStatusChange,
}: AdhocExpenseCardProps) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-300 border-green-400/30',
    inactive: 'bg-red-500/20 text-red-300 border-red-400/30',
  };

  return (
    <div
      className={cn(
        'bg-white/10 backdrop-blur-xl',
        'border border-white/20',
        'rounded-xl p-4',
        'transition-all duration-200',
        'hover:bg-white/15 hover:border-white/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Status & Category badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full border',
              statusColors[expense.is_active === 1 ? 'active' : 'inactive']
            )}>
              {expense.is_active === 1 ? 'Active' : 'Inactive'}
            </span>
            {expense.category && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-purple-500/20 text-purple-300 border-purple-400/30">
                {expense.category}
              </span>
            )}
          </div>

          {/* Expense Name */}
          <div className="text-base font-semibold text-white mb-2">
            {expense.expense_name}
          </div>

          {/* Description */}
          {expense.description && (
            <div className="text-sm text-white/60 mb-2">
              {expense.description}
            </div>
          )}

          {/* Date */}
          {expense.expense_date && (
            <div className="text-sm text-white/60 mb-2">
              {formatDate(expense.expense_date, dateFormat)}
            </div>
          )}

          {/* Travelers */}
          {expense.travelers && expense.travelers.length > 0 && (
            <div className="text-xs text-white/50 mb-2">
              {expense.travelers.map(t => t.traveler_name).join(', ')} ({expense.travelers.length})
            </div>
          )}

          {/* Notes Preview */}
          {expense.notes && (
            <div className="mt-2 text-sm text-white/60">
              <ul className="list-disc list-inside space-y-0.5">
                {expense.notes.split('\n').filter(line => line.trim()).slice(0, 2).map((line, i) => (
                  <li key={i}>{line.trim()}</li>
                ))}
                {expense.notes.split('\n').filter(line => line.trim()).length > 2 && (
                  <li className="text-white/40">...</li>
                )}
              </ul>
            </div>
          )}

          {/* Price */}
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-purple-300">
                {expense.currency_code} {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-white/50">total</span>
            </div>
            {expense.travelers && expense.travelers.length > 0 && (
              <p className="text-xs text-white/50 mt-0.5">
                {expense.currency_code} {(expense.amount / expense.travelers.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {expense.travelers.length} traveler{expense.travelers.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          {/* Activate */}
          {expense.is_active === 0 && (
            <button
              onClick={() => onStatusChange(expense.adhoc_expense_id, 1)}
              className="p-2 rounded-full text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-colors"
              title="Activate expense"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}

          {/* Deactivate */}
          {expense.is_active === 1 && (
            <button
              onClick={() => onStatusChange(expense.adhoc_expense_id, 0)}
              className="p-2 rounded-full text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Deactivate expense"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* View */}
          <button
            onClick={() => onView(expense)}
            className="p-2 rounded-full text-white/70 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            title="View details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(expense)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit expense"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Copy */}
          <button
            onClick={() => onCopy(expense)}
            className="p-2 rounded-full text-white/70 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Copy expense"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(expense.adhoc_expense_id)}
            className="p-2 rounded-full text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete expense"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}