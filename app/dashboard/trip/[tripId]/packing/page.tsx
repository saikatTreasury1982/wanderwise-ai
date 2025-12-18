'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import LoadingOverlay from '@/app/components/ui/LoadingOverlay';
import PackingCategoryCard from '@/app/components/organisms/PackingCategoryCard';
import TripAlertSettingsModal from '@/app/components/organisms/TripAlertSettingsModal';
import { formatDateRange } from '@/app/lib/utils';
import type { PackingCategory, PackingStats, PackingItem } from '@/app/lib/types/packing';
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


interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default function PackingChecklistPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [categories, setCategories] = useState<PackingCategory[]>([]);
  const [stats, setStats] = useState<PackingStats>({ totalItems: 0, packedItems: 0, percentage: 0 });
  const [preferences, setPreferences] = useState<{ date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY' }>({
    date_format: 'YYYY-MM-DD',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchPackingList = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/packing`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching packing list:', error);
    }
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex(c => c.category_id === active.id);
    const newIndex = categories.findIndex(c => c.category_id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
    
    // Update local state immediately
    setCategories(reorderedCategories);

    // Update database
    const categoryOrders = reorderedCategories.map((cat, index) => ({
      category_id: cat.category_id,
      display_order: index,
    }));

    try {
      await fetch(`/api/trips/${tripId}/packing/categories/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryOrders }),
      });
    } catch (err) {
      console.error('Error saving category order:', err);
      // Revert on error
      await fetchPackingList();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trip
        const tripResponse = await fetch(`/api/trips/${tripId}`);
        if (tripResponse.status === 401) {
          router.push('/login');
          return;
        }
        if (tripResponse.status === 404) {
          router.push('/dashboard');
          return;
        }
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          setTrip(tripData.trip);
        }

        // Fetch packing list
        await fetchPackingList();

        // Fetch preferences
        const prefResponse = await fetch('/api/user/preferences');
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          setPreferences(prefData.preferences);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tripId, router]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: newCategoryName.trim() }),
      });
      if (response.ok) {
        await fetchPackingList();
        setNewCategoryName('');
        setIsAddingCategory(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCategory = async (categoryId: number, name: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: name }),
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Delete this category and all its items?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReorderItems = async (categoryId: number, reorderedItems: PackingItem[]) => {
    // Optimistically update local state
    setCategories(prev => 
      prev.map(cat => 
        cat.category_id === categoryId 
          ? { ...cat, items: reorderedItems }
          : cat
      )
    );
  };

  const handleAddItem = async (categoryId: number, itemName: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemName }),
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleItem = async (itemId: number, categoryId: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}/items/${itemId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleUpdateItem = async (itemId: number, name: string, categoryId: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: name }),
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItemPriority = async (itemId: number, priority: string, categoryId: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error updating item priority:', error);
    }
  };

  const handleDeleteItem = async (itemId: number, categoryId: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/categories/${categoryId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const destination = [trip.destination_city, trip.destination_country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen relative p-6 pb-24">
      <PageBackground />
      <LoadingOverlay isLoading={isProcessing} />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Hub
          </button>

          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold text-white">Checklist</h1>
            <button
              onClick={() => setIsAlertSettingsOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Alert Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
          
          <p className="text-white/70 text-lg mb-3">{trip.trip_name}</p>
          
          <div className="flex flex-wrap items-center gap-3">
            {destination && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{destination}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, preferences.date_format)}</span>
            </div>
            
            {(() => {
              const start = new Date(trip.start_date);
              const end = new Date(trip.end_date);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const nights = days - 1;
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-400/30">
                  <span className="text-sm font-medium text-purple-200">{days}D / {nights}N</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Progress Bar */}
        {stats.totalItems > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">
                {stats.packedItems} of {stats.totalItems} packed
              </span>
              <span className="text-sm text-purple-300 font-medium">{stats.percentage}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-4">
          {categories.length === 0 && !isAddingCategory ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No packing list yet</h3>
              <p className="text-white/60">Click the + button to add your first category</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={categories.map(c => c.category_id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map(category => (
                  <PackingCategoryCard
                    key={category.category_id}
                    category={category}
                    tripId={Number(tripId)}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddItem={handleAddItem}
                    onToggleItem={(itemId) => handleToggleItem(itemId, category.category_id)}
                    onUpdateItem={(itemId, name) => handleUpdateItem(itemId, name, category.category_id)}
                    onUpdateItemPriority={(itemId, priority) => handleUpdateItemPriority(itemId, priority, category.category_id)}
                    onDeleteItem={(itemId) => handleDeleteItem(itemId, category.category_id)}
                    onReorderItems={handleReorderItems}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Add Category Form */}
          {isAddingCategory && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddCategory();
                    else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                  placeholder="Enter category name..."
                  autoFocus
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  title="Cancel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
                  title="Save"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Settings Modal */}
      <TripAlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        tripId={Number(tripId)}
        tripName={trip?.trip_name || ''}
      />

      {/* FAB */}
      {!isAddingCategory && (
        <FloatingActionButton
          onClick={() => setIsAddingCategory(true)}
          ariaLabel="Add category"
        />
      )}
    </div>
  );
}