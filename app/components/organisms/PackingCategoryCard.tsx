'use client';

import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import PackingItemRow from './PackingItemRow';
import type { PackingCategory } from '@/app/lib/types/packing';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
  onReorderItems: (categoryId: number, reorderedItems: any[]) => void;
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
  onReorderItems,
}: PackingCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(category.category_name);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkItems, setBulkItems] = useState('');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.category_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const items = category.items || [];
  const packedCount = items.filter(i => i.is_packed === 1).length;
  const totalCount = items.length;

  const itemSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleItemDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(i => i.item_id === active.id);
    const newIndex = items.findIndex(i => i.item_id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    
    // Update parent state immediately (optimistic update)
    onReorderItems(category.category_id, reorderedItems);
    
    // Update display orders in database
    const itemOrders = reorderedItems.map((item, index) => ({
      item_id: item.item_id,
      display_order: index,
    }));

    try {
      await fetch(`/api/trips/${tripId}/packing/categories/${category.category_id}/items/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemOrders }),
      });
    } catch (err) {
      console.error('Error saving item order:', err);
      // Could revert here if needed
    }
  };

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
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl relative"
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          'hover:bg-white/5 transition-colors'
        )}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-purple-300" />
        </button>

        {/* Expand/Collapse Icon - Always clickable */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 -m-1 hover:bg-white/10 rounded transition-colors"
        >
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
        </button>

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
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left text-white font-medium hover:text-white/80 transition-colors"
          >
            {category.category_name}
          </button>
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
            <DndContext
              sensors={itemSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd}
            >
              <SortableContext
                items={items.map(i => i.item_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {items.map(item => (
                    <PackingItemRow
                      key={item.item_id}
                      item={item}
                      tripId={tripId}
                      categoryId={category.category_id}
                      onToggle={onToggleItem}
                      onUpdate={onUpdateItem}
                      onUpdatePriority={onUpdateItemPriority}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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