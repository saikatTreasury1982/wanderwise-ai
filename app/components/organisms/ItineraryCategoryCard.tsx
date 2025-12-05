'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, List, Check, X, DollarSign } from 'lucide-react';
import type { ItineraryDayCategory, ItineraryActivity, CostSummary } from '@/app/lib/types/itinerary';
import ItineraryActivityRow from './ItineraryActivityRow';

interface ItineraryCategoryCardProps {
  tripId: number;
  dayId: number;
  category: ItineraryDayCategory;
  onUpdate: (category: ItineraryDayCategory) => void;
  onDelete: (categoryId: number) => void;
}

export default function ItineraryCategoryCard({ tripId, dayId, category, onUpdate, onDelete }: ItineraryCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(category.is_expanded === 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.category_name);
  const [editCost, setEditCost] = useState(category.category_cost?.toString() || '');
  const [editCurrency, setEditCurrency] = useState(category.currency_code || '');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [bulkActivities, setBulkActivities] = useState('');

  // Calculate category totals
  const getCategoryTotals = (): CostSummary[] => {
    if (category.category_cost !== null && category.currency_code) {
      return [{ currency_code: category.currency_code, total: category.category_cost }];
    }

    const totals: Record<string, number> = {};
    category.activities?.forEach(activity => {
      if (activity.activity_cost !== null && activity.currency_code) {
        totals[activity.currency_code] = (totals[activity.currency_code] || 0) + activity.activity_cost;
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

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/categories/${category.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: editName,
          category_cost: editCost ? parseFloat(editCost) : null,
          currency_code: editCost ? editCurrency || null : null,
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
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Category Header */}
      <div className="px-4 py-3 flex items-center gap-3">
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
                <span className="text-white font-medium">{category.category_name}</span>
                {totalCount > 0 && (
                  <span className="text-xs text-purple-300">
                    ({completedCount}/{totalCount})
                  </span>
                )}
              </div>
            </div>

            {/* Category Totals */}
            {categoryTotals.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="w-3 h-3 text-purple-300" />
                {categoryTotals.map(({ currency_code, total }, idx) => (
                  <span key={currency_code} className="text-purple-200">
                    {idx > 0 && ' + '}
                    {currency_code} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ))}
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
            <div className="divide-y divide-white/5">
              {category.activities.map((activity) => (
                <ItineraryActivityRow
                  key={activity.activity_id}
                  tripId={tripId}
                  dayId={dayId}
                  categoryId={category.category_id}
                  activity={activity}
                  disableCost={hasCategoryCost}
                  onUpdate={handleActivityUpdate}
                  onDelete={handleActivityDelete}
                />
              ))}
            </div>
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