'use client';

import { useState } from 'react';
import { Plus, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { ItineraryDay, ItineraryDayCategory, CostSummary } from '@/app/lib/types/itinerary';
import ItineraryCategoryCard from './ItineraryCategoryCard';

interface ItineraryDayCardProps {
  tripId: number;
  day: ItineraryDay;
  dayDate: string;
  onUpdate: (day: ItineraryDay) => void;
  defaultCollapsed?: boolean;
}

export default function ItineraryDayCard({ tripId, day, dayDate, onUpdate, defaultCollapsed = false }: ItineraryDayCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(day.description || '');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Calculate day totals by currency
  const getDayTotals = (): CostSummary[] => {
    const totals: Record<string, number> = {};
    
    day.categories?.forEach(category => {
      if (category.category_cost !== null && category.currency_code) {
        // Use category-level cost
        totals[category.currency_code] = (totals[category.currency_code] || 0) + category.category_cost;
      } else {
        // Sum activity costs
        category.activities?.forEach(activity => {
          if (activity.activity_cost !== null && activity.currency_code) {
            totals[activity.currency_code] = (totals[activity.currency_code] || 0) + activity.activity_cost;
          }
        });
      }
    });

    return Object.entries(totals).map(([currency_code, total]) => ({ currency_code, total }));
  };

  const dayTotals = getDayTotals();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleSaveDescription = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${day.day_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setIsEditingDescription(false);
      }
    } catch (err) {
      console.error('Error updating description:', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${day.day_id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: newCategoryName.trim() }),
      });

      if (res.ok) {
        const newCategory = await res.json();
        const updatedDay = {
          ...day,
          categories: [...(day.categories || []), newCategory],
        };
        onUpdate(updatedDay);
        setNewCategoryName('');
        setIsAddingCategory(false);
      }
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleCategoryUpdate = (updatedCategory: ItineraryDayCategory) => {
    const updatedDay = {
      ...day,
      categories: day.categories?.map(c => 
        c.category_id === updatedCategory.category_id ? updatedCategory : c
      ),
    };
    onUpdate(updatedDay);
  };

  const handleCategoryDelete = (categoryId: number) => {
    const updatedDay = {
      ...day,
      categories: day.categories?.filter(c => c.category_id !== categoryId),
    };
    onUpdate(updatedDay);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
      {/* Day Header */}
      <div 
        className={`px-6 py-4 ${!isCollapsed ? 'border-b border-white/10' : ''} cursor-pointer`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-purple-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-300" />
              )}
            </button>
            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{day.day_number}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Day {day.day_number}</h2>
              <p className="text-sm text-purple-200">{formatDate(dayDate)}</p>
            </div>
          </div>

          {/* Day Totals */}
          {dayTotals.length > 0 && (
            <div className="text-right">
              {dayTotals.map(({ currency_code, total }) => (
                <div key={currency_code} className="text-purple-200">
                  <span className="text-white font-semibold">{currency_code} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {!isCollapsed && (isEditingDescription ? (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this day..."
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveDescription();
                if (e.key === 'Escape') setIsEditingDescription(false);
              }}
            />
            <button
              onClick={handleSaveDescription}
              className="p-2 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditingDescription(false)}
              className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingDescription(true)}
            className="flex items-center gap-2 mt-3 text-sm text-purple-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
        {day.description || 'Add description...'}
        </button>
      ))}
    </div>

      {/* Categories */}
      {!isCollapsed && (
      <div className="p-4 space-y-4"> 
        {day.categories && day.categories.length > 0 ? (
          day.categories.map((category) => (
            <ItineraryCategoryCard
              key={category.category_id}
              tripId={tripId}
              dayId={day.day_id}
              category={category}
              onUpdate={handleCategoryUpdate}
              onDelete={handleCategoryDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-purple-300">
            <p>No categories yet. Add one to start planning!</p>
          </div>
        )}

        {/* Add Category */}
        {isAddingCategory ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g., Morning Activities, Meals...)"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }
              }}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="p-3 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName('');
              }}
              className="p-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-purple-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        )}
      </div>
    )}
  </div>
);
}