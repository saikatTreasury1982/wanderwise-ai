'use client';

import { useState } from 'react';
import { formatDate } from '@/app/lib/utils';
import { Plus, Edit2, Check, X } from 'lucide-react';
import type { ItineraryDayRange, ItineraryDayCategory, CostSummary } from '@/app/lib/types/itinerary';
import ItineraryCategoryCard from './ItineraryCategoryCard';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Props {
  tripId: number;
  range: ItineraryDayRange;
  startDate: string;   // derived calendar date of start_day
  endDate: string;     // derived calendar date of end_day
  dateFormat?: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  onUpdate: (range: ItineraryDayRange) => void;
}

export default function ItineraryRangeCard({ tripId, range, startDate, endDate, dateFormat = 'DD Mmm YYYY', onUpdate }: Props) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [rangeName, setRangeName] = useState(range.range_name || '');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isAddingCategoryLoading, setIsAddingCategoryLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isSingleDay = range.start_day === range.end_day;
  const dayLabel = isSingleDay ? `Day ${range.start_day}` : `Days ${range.start_day}–${range.end_day}`;
  const dateLabel = isSingleDay
    ? formatDate(startDate, dateFormat)
    : `${formatDate(startDate, dateFormat)} – ${formatDate(endDate, dateFormat)}`;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = range.categories?.findIndex(c => c.category_id === active.id) ?? -1;
    const newIndex = range.categories?.findIndex(c => c.category_id === over.id) ?? -1;
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(range.categories || [], oldIndex, newIndex);
    onUpdate({ ...range, categories: reordered });
    const categoryOrders = reordered.map((cat, i) => ({ category_id: cat.category_id, display_order: i }));
    try {
      await fetch(`/api/trips/${tripId}/itinerary-ranges/${range.day_range_id}/categories/reorder`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryOrders }),
      });
    } catch (err) { console.error('Error saving category order:', err); }
  };

  const refetchRange = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary-ranges/${range.day_range_id}`);
      if (res.ok) onUpdate(await res.json());
    } catch (err) { console.error('Error refetching range:', err); }
  };

  const getRangeTotals = (): CostSummary[] => {
    const totals: Record<string, number> = {};
    range.categories?.forEach(category => {
      if (category.is_active === 0) return;
      if (category.category_cost !== null && category.currency_code) {
        let cost = category.category_cost;
        if (category.cost_type === 'per_head' && category.headcount) cost = category.category_cost * category.headcount;
        totals[category.currency_code] = (totals[category.currency_code] || 0) + cost;
      } else {
        category.activities?.forEach(activity => {
          if (activity.activity_cost !== null && activity.currency_code) {
            let cost = activity.activity_cost;
            if (activity.cost_type === 'per_head' && activity.headcount) cost = activity.activity_cost * activity.headcount;
            totals[activity.currency_code] = (totals[activity.currency_code] || 0) + cost;
          }
        });
      }
    });
    return Object.entries(totals).map(([currency_code, total]) => ({ currency_code, total }));
  };
  const rangeTotals = getRangeTotals();

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary-ranges/${range.day_range_id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ range_name: rangeName || null }),
      });
      if (res.ok) { onUpdate(await res.json()); setIsEditingName(false); }
    } catch (err) { console.error('Error updating range name:', err); }
    finally { setIsSavingName(false); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategoryLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary-ranges/${range.day_range_id}/categories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_name: newCategoryName.trim() }),
      });
      if (res.ok) {
        const newCategory = await res.json();
        onUpdate({ ...range, categories: [...(range.categories || []), newCategory] });
        setNewCategoryName(''); setIsAddingCategory(false);
      }
    } catch (err) { console.error('Error adding category:', err); }
    finally { setIsAddingCategoryLoading(false); }
  };

  const handleCategoryUpdate = (updated: ItineraryDayCategory) =>
    onUpdate({ ...range, categories: range.categories?.map(c => c.category_id === updated.category_id ? updated : c) });
  const handleCategoryDelete = (categoryId: number) =>
    onUpdate({ ...range, categories: range.categories?.filter(c => c.category_id !== categoryId) });

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
      {/* Range Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="px-3 h-12 min-w-12 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white whitespace-nowrap">{dayLabel}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {range.range_name || dayLabel}
              </h2>
              <p className="text-sm text-primary-200 mt-0.5">{dateLabel}</p>
            </div>
          </div>
          {rangeTotals.length > 0 && (
            <div className="text-right">
              {rangeTotals.map(({ currency_code, total }) => (
                <div key={currency_code} className="text-white font-semibold">
                  {currency_code} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Name edit */}
        <div className="mt-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text" value={rangeName} onChange={(e) => setRangeName(e.target.value)}
                placeholder="Name this range… (e.g. Sea Days)"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-primary-300 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') { setIsEditingName(false); setRangeName(range.range_name || ''); }
                }}
              />
              <button onClick={handleSaveName} disabled={isSavingName}
                className="p-2 rounded-full hover:bg-white/10 text-primary-300 hover:text-white transition-colors disabled:opacity-50" title="Save">
                {isSavingName ? <div className="w-4 h-4 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setIsEditingName(false); setRangeName(range.range_name || ''); }}
                className="p-2 rounded-full hover:bg-white/10 text-primary-300 hover:text-white transition-colors" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 text-sm text-primary-300 hover:text-white transition-colors">
              <Edit2 className="w-3 h-3" />
              {range.range_name ? 'Edit name' : 'Add name…'}
            </button>
          )}
        </div>
      </div>

      {/* Categories — reuses ItineraryCategoryCard, but dayId prop swapped for range context */}
      <div className="p-4 space-y-4">
        {range.categories && range.categories.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={range.categories.map(c => c.category_id)} strategy={verticalListSortingStrategy}>
              {range.categories.map((category) => (
                <ItineraryCategoryCard
                  key={category.category_id}
                  tripId={tripId}
                  dayId={range.day_range_id}
                  rangeMode
                  category={category}
                  onUpdate={handleCategoryUpdate}
                  onDelete={handleCategoryDelete}
                  onRefetch={refetchRange}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-primary-300"><p>No categories yet. Add one to start planning!</p></div>
        )}

        {isAddingCategory ? (
          <div className="flex items-center gap-2">
            <input
              type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g., Meals, Sightseeing…)"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-primary-300"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setIsAddingCategory(false); setNewCategoryName(''); } }}
            />
            <button onClick={handleAddCategory} disabled={!newCategoryName.trim() || isAddingCategoryLoading}
              className="p-3 rounded-full hover:bg-white/10 text-primary-300 hover:text-white transition-colors disabled:opacity-50" title="Add">
              {isAddingCategoryLoading ? <div className="w-5 h-5 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
              className="p-3 rounded-full hover:bg-white/10 text-primary-300 hover:text-white transition-colors" title="Cancel">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setIsAddingCategory(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-primary-300 hover:bg-white/10 hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        )}
      </div>
    </div>
  );
}