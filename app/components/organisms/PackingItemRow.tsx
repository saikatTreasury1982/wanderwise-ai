'use client';

import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import type { PackingItem, PackingPriority } from '@/app/lib/types/packing';

interface PackingItemRowProps {
  item: PackingItem;
  tripId: number;
  onToggle: (itemId: number) => void;
  onUpdate: (itemId: number, name: string) => void;
  onUpdatePriority: (itemId: number, priority: PackingPriority) => void;
  onDelete: (itemId: number) => void;
}

const priorityConfig: Record<PackingPriority, { icon: string; color: string; label: string }> = {
  critical: { icon: '🔴', color: 'text-red-400', label: 'Critical' },
  important: { icon: '🟡', color: 'text-yellow-400', label: 'Important' },
  normal: { icon: '⚪', color: 'text-white/40', label: 'Normal' },
};

export default function PackingItemRow({
  item,
  tripId,
  onToggle,
  onUpdate,
  onUpdatePriority,
  onDelete,
}: PackingItemRowProps) {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.item_name);

  const handleSave = () => {
    if (editName.trim() && editName !== item.item_name) {
      onUpdate(item.item_id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.item_name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg',
        'hover:bg-white/5 transition-colors'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.item_id)}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          item.is_packed
            ? 'bg-green-500 border-green-500'
            : 'border-white/30 hover:border-white/50'
        )}
      >
        {item.is_packed === 1 && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Item Name */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-purple-400"
        />
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <span
            className={cn(
              'text-sm transition-colors',
              item.is_packed ? 'text-white/50 line-through' : 'text-white/90'
            )}
          >
            {item.item_name}
          </span>
          {item.priority !== 'normal' && (
            <span className="text-xs" title={priorityConfig[item.priority].label}>
              {priorityConfig[item.priority].icon}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          {/* Priority Menu */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Set priority"
            >
              <span className="text-xs">{priorityConfig[item.priority || 'normal'].icon}</span>
            </button>
            {showPriorityMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPriorityMenu(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 top-9 z-50 bg-gray-800 border border-white/20 rounded-lg shadow-xl">
                  {(['critical', 'important', 'normal'] as PackingPriority[]).map(priority => (
                    <button
                      key={priority}
                      onClick={() => {
                        onUpdatePriority(item.item_id, priority);
                        setShowPriorityMenu(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap',
                        item.priority === priority && 'bg-white/5'
                      )}
                    >
                      <span>{priorityConfig[priority].icon}</span>
                      <span className="text-white/90">{priorityConfig[priority].label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.item_id)}
            className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-400/30 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}