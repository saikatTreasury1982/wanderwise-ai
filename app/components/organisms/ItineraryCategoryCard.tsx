'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, List, Check, X, DollarSign, Copy, Eye, EyeOff } from 'lucide-react';
import type { ItineraryDayCategory, ItineraryActivity, CostSummary } from '@/app/lib/types/itinerary';
import ItineraryActivityRow from './ItineraryActivityRow';
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

interface ItineraryCategoryCardProps {
  tripId: number;
  dayId: number;
  category: ItineraryDayCategory;
  onUpdate: (category: ItineraryDayCategory) => void;
  onDelete: (categoryId: number) => void;
  onRefetch: () => Promise<void>;
}

export default function ItineraryCategoryCard({ tripId, dayId, category, onUpdate, onDelete, onRefetch }: ItineraryCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(category.is_expanded === 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.category_name);
  const [editCost, setEditCost] = useState(category.category_cost?.toString() || '');
  const [editCurrency, setEditCurrency] = useState(category.currency_code || '');
  const [editCostType, setEditCostType] = useState<'total' | 'per_head'>(category.cost_type || 'total');
  const [editHeadcount, setEditHeadcount] = useState(category.headcount?.toString() || '');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [bulkActivities, setBulkActivities] = useState('');
  const [isActive, setIsActive] = useState(category.is_active !== 0);
  const [isCopying, setIsCopying] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
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

  const activitySensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

  const handleActivityDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activities = category.activities || [];
    const oldIndex = activities.findIndex(a => a.activity_id === active.id);
    const newIndex = activities.findIndex(a => a.activity_id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedActivities = arrayMove(activities, oldIndex, newIndex);
    
    // Update local state
    onUpdate({
      ...category,
      activities: reorderedActivities,
    });

    // Update database
    const activityOrders = reorderedActivities.map((act, index) => ({
      activity_id: act.activity_id,
      display_order: index,
    }));

    try {
      await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}/activities/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityOrders }),
      });
    } catch (err) {
      console.error('Error saving activity order:', err);
    }
  };

  // Calculate category totals
  const getCategoryTotals = (): CostSummary[] => {
  if (category.category_cost !== null && category.currency_code) {
    let cost = category.category_cost;
    if (category.cost_type === 'per_head' && category.headcount) {
      cost = category.category_cost * category.headcount;
    }
    return [{ currency_code: category.currency_code, total: cost }];
  }

  const totals: Record<string, number> = {};
    category.activities?.forEach(activity => {
      if (activity.activity_cost !== null && activity.currency_code) {
        let cost = activity.activity_cost;
        if (activity.cost_type === 'per_head' && activity.headcount) {
          cost = activity.activity_cost * activity.headcount;
        }
        totals[activity.currency_code] = (totals[activity.currency_code] || 0) + cost;
      }
    });

    return Object.entries(totals).map(([currency_code, total]) => ({ currency_code, total }));
  };

  const categoryTotals = getCategoryTotals();
  const hasCategoryCost = category.category_cost !== null;
  const completedCount = category.activities?.filter(a => a.is_completed).length || 0;
  const totalCount = category.activities?.length || 0;

  const handleToggleExpand = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    try {
      await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_expanded: newExpanded ? 1 : 0 }),
      });
    } catch (err) {
      console.error('Error updating expand state:', err);
    }
  };

  const handleToggleActive = async () => {
    const newActive = !isActive;
    setIsTogglingActive(true);
    
    try {
      await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive ? 1 : 0 }),
      });
      
      setIsActive(newActive);
      
      // Update parent
      onUpdate({
        ...category,
        is_active: newActive ? 1 : 0,
      });
    } catch (err) {
      console.error('Error updating active state:', err);
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: editName,
          category_cost: editCost ? parseFloat(editCost) : null,
          currency_code: editCost ? editCurrency || null : null,
          cost_type: editCost ? editCostType : 'total',
          headcount: editCost && editCostType === 'per_head' && editHeadcount ? parseInt(editHeadcount) : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this category and all its activities?')) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete(category.category_id);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleCopy = async () => {
    setIsCopying(true);
    
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}/copy`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Copy failed:', error);
        alert(`Failed to copy: ${error.error || 'Unknown error'}`);
        setIsCopying(false);
        return;
      }

      // Show success immediately
      await onRefetch();
      alert('✓ Category copied successfully!');
    } catch (err) {
      console.error('Error copying category:', err);
      alert('Failed to copy category');
    } finally {
      setIsCopying(false);
    }
  };  

  const handleAddActivity = async () => {
    if (!newActivityName.trim()) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_name: newActivityName.trim() }),
      });

      if (res.ok) {
        const newActivity = await res.json();
        onUpdate({
          ...category,
          activities: [...(category.activities || []), newActivity],
        });
        setNewActivityName('');
        setIsAddingActivity(false);
      }
    } catch (err) {
      console.error('Error adding activity:', err);
    }
  };

  const handleBulkAdd = async () => {
    const activities = bulkActivities.split('\n').filter(line => line.trim());
    if (activities.length === 0) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, activities }),
      });

      if (res.ok) {
        const newActivities = await res.json();
        onUpdate({
          ...category,
          activities: [...(category.activities || []), ...newActivities],
        });
        setBulkActivities('');
        setIsBulkAdding(false);
      }
    } catch (err) {
      console.error('Error bulk adding activities:', err);
    }
  };

  const handleActivityUpdate = (updatedActivity: ItineraryActivity) => {
    onUpdate({
      ...category,
      activities: category.activities?.map(a =>
        a.activity_id === updatedActivity.activity_id ? updatedActivity : a
      ),
    });
  };

  const handleActivityDelete = (activityId: number) => {
    onUpdate({
      ...category,
      activities: category.activities?.filter(a => a.activity_id !== activityId),
    });
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
    >
      {/* Category Header */}
      <div 
        className={`px-4 py-3 flex items-center gap-3 transition-opacity ${
          !isActive ? 'opacity-50' : 'opacity-100'
        }`}
      >
        
        {/* Active/Inactive Toggle */}
        <button
          onClick={handleToggleActive}
          disabled={isTogglingActive}
          className={`p-1 rounded transition-colors ${
            isTogglingActive 
              ? 'cursor-wait' 
              : 'hover:bg-white/10'
          }`}
          title={isTogglingActive ? 'Processing...' : (isActive ? 'Mark as inactive' : 'Mark as active')}
        >
          {isTogglingActive ? (
            <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
          ) : isActive ? (
            <Eye className="w-5 h-5 text-green-400" />
          ) : (
            <EyeOff className="w-5 h-5 text-white/40" />
          )}
        </button>

        {/* ADD DRAG HANDLE HERE */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-purple-300" />
        </button>

        <button
          onClick={handleToggleExpand}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-purple-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-purple-300" />
          )}
        </button>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              autoFocus
            />
            <input
              type="number"
              value={editCost}
              onChange={(e) => setEditCost(e.target.value)}
              placeholder="Cost"
              className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
            />
            <input
              type="text"
              value={editCurrency}
              onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
              maxLength={3}
              className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm uppercase"
            />
            <select
              value={editCostType}
              onChange={(e) => setEditCostType(e.target.value as 'total' | 'per_head')}
              className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
            >
              <option value="total" className="bg-gray-800 text-white">Total</option>
              <option value="per_head" className="bg-gray-800 text-white">Per Head</option>
            </select>
            {editCostType === 'per_head' && (
              <input
                type="number"
                value={editHeadcount}
                onChange={(e) => setEditHeadcount(e.target.value)}
                placeholder="×"
                className="w-12 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                min="1"
              />
            )}
            <button onClick={handleSaveEdit} className="p-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                  {category.category_name}
                </span>
                {!isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                    Inactive
                  </span>
                )}
                {totalCount > 0 && (
                  <span className="text-xs text-purple-300">
                    ({completedCount}/{totalCount})
                  </span>
                )}
              </div>
            </div>

            {/* Category Totals - Only show for active categories */}
            {isActive && categoryTotals.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="w-3 h-3 text-purple-300" />
                {category.category_cost !== null && category.cost_type === 'per_head' && category.headcount ? (
                  <span className="text-purple-200">
                    {category.currency_code} {category.category_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {category.headcount} = {category.currency_code} {(category.category_cost * category.headcount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  categoryTotals.map(({ currency_code, total }, idx) => (
                    <span key={currency_code} className="text-purple-200">
                      {idx > 0 && ' + '}
                      {currency_code} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ))
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAddingActivity(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
                title="Add activity"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsBulkAdding(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
                title="Bulk add"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={isCopying}
                className={`p-1.5 rounded-full transition-colors ${
                  isCopying 
                    ? 'bg-purple-500/30 text-purple-200 cursor-wait' 
                    : 'hover:bg-white/10 text-purple-300 hover:text-white'
                }`}
                title={isCopying ? 'Copying...' : 'Copy category'}
              >
                {isCopying ? (
                  <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
                title="Edit category"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full hover:bg-red-500/20 text-purple-300 hover:text-red-300 transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Activities */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {/* Bulk Add Mode */}
          {isBulkAdding && (
            <div className="p-4 bg-white/5">
              <textarea
                value={bulkActivities}
                onChange={(e) => setBulkActivities(e.target.value)}
                placeholder="Enter activities, one per line..."
                className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 text-sm resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setIsBulkAdding(false);
                    setBulkActivities('');
                  }}
                  className="px-3 py-1.5 text-sm text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAdd}
                  disabled={!bulkActivities.trim()}
                  className="px-3 py-1.5 text-sm bg-purple-500/30 text-white rounded-lg hover:bg-purple-500/40 disabled:opacity-50"
                >
                  Add All
                </button>
              </div>
            </div>
          )}

          {/* Activity List */}
          {category.activities && category.activities.length > 0 ? (
            <DndContext
              sensors={activitySensors}
              collisionDetection={closestCenter}
              onDragEnd={handleActivityDragEnd}
            >
              <SortableContext
                items={category.activities.map(a => a.activity_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-white/5">
                  {category.activities.map((activity) => (
                    <ItineraryActivityRow
                      key={activity.activity_id}
                      tripId={tripId}
                      dayId={dayId}
                      categoryId={category.category_id}
                      activity={activity}
                      disableCost={hasCategoryCost}
                      isActive={isActive}
                      onUpdate={handleActivityUpdate}
                      onDelete={handleActivityDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : !isBulkAdding && !isAddingActivity && (
            <div className="px-4 py-6 text-center text-sm text-purple-300">
              No activities yet
            </div>
          )}

          {/* Add Single Activity */}
          {isAddingActivity && !isBulkAdding && (
            <div className="px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                placeholder="Activity name..."
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddActivity();
                  if (e.key === 'Escape') {
                    setIsAddingActivity(false);
                    setNewActivityName('');
                  }
                }}
              />
              <button
                onClick={handleAddActivity}
                disabled={!newActivityName.trim()}
                className="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsAddingActivity(false);
                  setNewActivityName('');
                }}
                className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}