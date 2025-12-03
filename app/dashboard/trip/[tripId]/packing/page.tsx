'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/components/ui/PageBackground';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import PackingCategoryCard from '@/components/organisms/PackingCategoryCard';
import { formatDateRange } from '@/lib/utils';
import type { PackingCategory, PackingStats } from '@/lib/types/packing';


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
      const response = await fetch(`/api/trips/${tripId}/packing/${categoryId}`, {
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
      const response = await fetch(`/api/trips/${tripId}/packing/${categoryId}`, {
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

  const handleAddItem = async (categoryId: number, itemName: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/${categoryId}`, {
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

  const handleToggleItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/items/${itemId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchPackingList();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleUpdateItem = async (itemId: number, name: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/items/${itemId}`, {
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

  const handleDeleteItem = async (itemId: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/packing/items/${itemId}`, {
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

          <h1 className="text-3xl font-bold text-white mb-2">Packing Checklist</h1>
          <p className="text-white/70">
            {[trip.trip_name, destination, formatDateRange(trip.start_date, trip.end_date, preferences.date_format)]
              .filter(Boolean)
              .join(' | ')}
          </p>
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
            categories.map(category => (
              <PackingCategoryCard
                key={category.category_id}
                category={category}
                tripId={Number(tripId)}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddItem={handleAddItem}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            ))
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