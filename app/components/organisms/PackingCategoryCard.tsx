'use client';

import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import PackingItemRow from './PackingItemRow';
import type { PackingCategory } from '@/app/lib/types/packing';

interface PackingCategoryCardProps {
  category: PackingCategory;
  tripId: number;
  onUpdateCategory: (categoryId: number, name: string) => void;
  onDeleteCategory: (categoryId: number) => void;
  onAddItem: (categoryId: number, itemName: string) => void;
  onToggleItem: (itemId: number) => void;
  onUpdateItem: (itemId: number, name: string) => void;
  onUpdateItemPriority: (itemId: number, priority: string) => void;
  onDeleteItem: (itemId: number) => void;
}

export default function PackingCategoryCard({
  category,
  tripId,
  onUpdateCategory,
  onDeleteCategory,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onUpdateItemPriority,
  onDeleteItem,
}: PackingCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(category.category_name);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkItems, setBulkItems] = useState('');

  const items = category.items || [];
  const packedCount = items.filter(i => i.is_packed === 1).length;
  const totalCount = items.length;

  const handleSaveName = () => {
    if (editName.trim() && editName !== category.category_name) {
      onUpdateCategory(category.category_id, editName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setEditName(category.category_name);
    setIsEditingName(false);
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(category.category_id, newItemName.trim());
      setNewItemName('');
      setIsAddingItem(false);
    }
  };

  const handleBulkAdd = () => {
    const items = bulkItems
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (items.length > 0) {
      items.forEach(item => {
        onAddItem(category.category_id, item);
      });
      setBulkItems('');
      setIsBulkAdding(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl relative">
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 cursor-pointer',
          'hover:bg-white/5 transition-colors'
        )}
        onClick={() => !isEditingName && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        <svg
          className={cn(
            'w-4 h-4 text-white/70 transition-transform',
            isExpanded && 'rotate-90'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Category Name */}
        {isEditingName ? (
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveName();
              else if (e.key === 'Escape') handleCancelName();
            }}
            onClick={e => e.stopPropagation()}
            autoFocus
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white font-medium focus:outline-none focus:border-purple-400"
          />
        ) : (
          <span className="flex-1 text-white font-medium">{category.category_name}</span>
        )}

        {/* Progress */}
        <span className="text-sm text-white/50">
          {packedCount}/{totalCount}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {/* Add Item */}
          <button
            onClick={() => {
              setIsExpanded(true);
              setIsAddingItem(true);
              setIsBulkAdding(false);
            }}
            className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 transition-colors"
            title="Add item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

            {/* Bulk Add */}
            <button
              onClick={() => {
                setIsExpanded(true);
                setIsBulkAdding(true);
                setIsAddingItem(false);
              }}
              className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 hover:bg-blue-500/30 transition-colors"
              title="Bulk add items"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>

          {/* Edit Category */}
          <button
            onClick={() => setIsEditingName(true)}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            title="Edit category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete Category */}
          <button
            onClick={() => onDeleteCategory(category.category_id)}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-400/30 transition-colors"
            title="Delete category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Items */}
      {isExpanded && (
        <div className="border-t border-white/10 px-2 py-2">
          {items.length === 0 && !isAddingItem ? (
            <p className="text-white/40 text-sm text-center py-3">No items yet</p>
          ) : (
            <div className="space-y-1">
              {items.map(item => (
                <PackingItemRow
                  key={item.item_id}
                  item={item}
                  tripId={tripId}
                  onToggle={onToggleItem}
                  onUpdate={onUpdateItem}
                  onUpdatePriority={onUpdateItemPriority}
                  onDelete={onDeleteItem}
                />
              ))}
            </div>
          )}

          {/* Add Item Form */}
          {isAddingItem && (
            <div className="flex items-center gap-2 px-3 py-2 mt-2">
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddItem();
                  else if (e.key === 'Escape') {
                    setIsAddingItem(false);
                    setNewItemName('');
                  }
                }}
                placeholder="Enter item name..."
                autoFocus
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemName('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
                title="Save"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Bulk Add Form */}
          {isBulkAdding && (
            <div className="px-3 py-2 mt-2 space-y-2">
              <p className="text-xs text-white/50">Paste or type items (one per line)</p>
              <textarea
                value={bulkItems}
                onChange={e => setBulkItems(e.target.value)}
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                rows={5}
                autoFocus
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-400 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsBulkAdding(false);
                    setBulkItems('');
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleBulkAdd}
                  disabled={!bulkItems.trim()}
                  className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                  title="Add all items"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}