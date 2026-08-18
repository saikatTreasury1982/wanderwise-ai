'use client';

import { useState, useEffect, useMemo } from 'react';
import PageBackground from '@/app/components/ui/PageBackground';
import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import TripGridCard from '@/app/components/organisms/TripGridCard';
import TripSummaryHeader from '@/app/components/organisms/TripSummaryHeader';
import TripForm from '@/app/components/organisms/TripForm';
import EmptyState from '@/app/components/organisms/EmptyState';
import PackingAlertWidget from '@/app/components/organisms/PackingAlertWidget';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import SelectPill from '@/app/components/ui/SelectPill';
import { MoreVertical, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TripListItem {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
  first_city: string | null;
  first_country: string | null;
  first_latitude: number | null;
  first_longitude: number | null;
  all_destinations: string | null;
  active_travelers: number;
  cost_sharers: number;
}

interface TripStatus { status_code: number; status_name: string; }
interface UserPreferences { date_format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'; time_format: string; decimal_places: number; }

export default function DashboardPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({ date_format: 'YYYY-MM-DD', time_format: '24h', decimal_places: 2 });
  const [statuses, setStatuses] = useState<TripStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripListItem | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState('all');
  const [filterDestination, setFilterDestination] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips');
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips);
      }
    } catch (e) { console.error('Error fetching trips:', e); }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetch('/api/statuses');
      if (res.ok) setStatuses((await res.json()).statuses);
    } catch (e) { console.error('Error fetching statuses:', e); }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) setPreferences((await res.json()).preferences);
    } catch (e) { console.error('Error fetching preferences:', e); }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([fetchTrips(), fetchPreferences(), fetchStatuses()]);
      setIsLoading(false);
    })();
  }, []);

  // parse a trip's destinations list from all_destinations ("A||B||C")
  const destsOf = (t: TripListItem): string[] =>
    t.all_destinations ? t.all_destinations.split('||').filter(Boolean) : [];

  const uniqueYears = useMemo(
    () => Array.from(new Set(trips.map(t => new Date(t.start_date).getFullYear().toString()))).sort((a, b) => b.localeCompare(a)),
    [trips]
  );

  const uniqueDestinations = useMemo(() => {
    const set = new Set<string>();
    trips.forEach(t => destsOf(t).forEach(d => set.add(d)));
    return Array.from(set).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (filterYear !== 'all' && new Date(t.start_date).getFullYear().toString() !== filterYear) return false;
      if (filterDestination !== 'all' && !destsOf(t).includes(filterDestination)) return false;
      return true;
    });
  }, [trips, filterYear, filterDestination]);

  // auto-select: keep current if still visible, else pick active, else next-upcoming, else first
  useEffect(() => {
    if (filteredTrips.length === 0) { setSelectedTripId(null); return; }
    if (selectedTripId && filteredTrips.some(t => t.trip_id === selectedTripId)) return;

    const active = filteredTrips.find(t => t.status_code === 2);
    const now = Date.now();
    const upcoming = [...filteredTrips]
      .filter(t => new Date(t.start_date).getTime() >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
    setSelectedTripId((active || upcoming || filteredTrips[0]).trip_id);
  }, [filteredTrips, selectedTripId]);

  const selectedTrip = trips.find(t => t.trip_id === selectedTripId) || null;

  const hasActiveFilters = filterYear !== 'all' || filterDestination !== 'all';
  const clearFilters = () => { setFilterYear('all'); setFilterDestination('all'); };

  // actions
  const handleCreateTrip = () => { setEditingTrip(null); setIsFormOpen(true); };
  const handleEditTrip = (tripId: number) => {
    const t = trips.find(x => x.trip_id === tripId) || null;
    setEditingTrip(t); setIsFormOpen(true);
  };
  const handleFormClose = () => { setIsFormOpen(false); setEditingTrip(null); };
  const handleFormSuccess = () => fetchTrips();

  const handleDeleteTrip = async (tripId: number) => {
    const ok = confirm(
      'Are you sure you want to permanently delete this trip?\n\n' +
      'All trip data including itinerary, expenses, travelers, and packing lists will be permanently removed.\n\n' +
      'This action cannot be undone.'
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (res.ok) { await fetchTrips(); }
      else alert((await res.json()).error || 'Failed to delete trip');
    } catch (e) { console.error('Error deleting trip:', e); alert('Failed to delete trip'); }
  };

  const setStatus = async (tripId: number, newStatus: number) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status_code: newStatus }),
      });
      if (res.ok) return true;
      alert((await res.json()).error || 'Failed to update trip'); return false;
    } catch (e) { console.error('Error updating trip:', e); alert('Failed to update trip'); return false; }
  };

  // status-adaptive primary action from the header
  const handlePrimaryAction = async (trip: TripListItem) => {
    switch (trip.status_code) {
      case 1: // draft → start planning (set active) then open
        if (await setStatus(trip.trip_id, 2)) router.push(`/dashboard/trip/${trip.trip_id}`);
        break;
      case 2: // active → open
      case 3: // completed → open (view directly)
      case 4: // suspended → open
        router.push(`/dashboard/trip/${trip.trip_id}`);
        break;
    }
  };

  const handleReactivate = async (tripId: number) => {
    if (confirm('Reactivate this trip?')) {
      if (await setStatus(tripId, 2)) await fetchTrips();
    }
  };

  const handleMarkComplete = async (tripId: number) => {
    if (confirm('Mark this trip as completed?')) {
      if (await setStatus(tripId, 3)) await fetchTrips();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const hasTrips = trips.length > 0;

  return (
    <div className="min-h-screen relative p-4 sm:p-6">
      <PageBackground />
      <div className="relative z-10 max-w-3xl mx-auto">
        {hasTrips ? (
          <>
            {/* Header row: title + menu */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Trips</h1>
              <div className="relative">
                <CircleIconButton variant="default" size="small" onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" icon={<MoreVertical className="w-4 h-4" />} />
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                      <button onClick={() => { setIsMenuOpen(false); router.push('/dashboard/preferences'); }} className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors">
                        <Settings className="w-5 h-5" /> <span>Preferences</span>
                      </button>
                      <div className="h-px bg-white/10" />
                      <button onClick={async () => { setIsMenuOpen(false); if (confirm('Are you sure you want to sign out?')) { try { await fetch('/api/auth/session/close', { method: 'POST' }); router.push('/login'); } catch (e) { console.error('Logout error:', e); } } }} className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-5 h-5" /> <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Filters */}
            {trips.length > 1 && (
              <div className="flex items-center gap-3 mb-4 mt-4 flex-wrap">
                <SelectPill value={filterYear} onChange={setFilterYear} ariaLabel="Filter by year" placeholderOption={{ value: 'all', label: 'All Years' }} options={uniqueYears.map(y => ({ value: y, label: y }))} />
                <SelectPill value={filterDestination} onChange={setFilterDestination} ariaLabel="Filter by destination" placeholderOption={{ value: 'all', label: 'All Destinations' }} options={uniqueDestinations.map(d => ({ value: d, label: d }))} />
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="p-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/15 transition-all group" title="Clear filters">
                    <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                {hasActiveFilters && <span className="text-sm text-white/60">{filteredTrips.length} of {trips.length} trips</span>}
              </div>
            )}

            {/* Selected trip summary header */}
            {selectedTrip && (
              <div className="mb-6">
                <TripSummaryHeader
                  trip={selectedTrip}
                  statuses={statuses}
                  dateFormat={preferences.date_format}
                  onEdit={handleEditTrip}
                  onDelete={handleDeleteTrip}
                  onPrimaryAction={handlePrimaryAction}
                  onReactivate={handleReactivate}
                  onMarkComplete={handleMarkComplete}
                />
              </div>
            )}

            {/* Packing alerts */}
            <PackingAlertWidget />

            {/* Trip grid */}
            {filteredTrips.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60 text-lg mb-4">No trips match your filters</p>
                <button onClick={clearFilters} className="px-6 py-3 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-300 hover:bg-primary-500/30 transition-all">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredTrips.map(trip => (
                  <TripGridCard
                    key={trip.trip_id}
                    trip={trip}
                    statuses={statuses}
                    dateFormat={preferences.date_format}
                    selected={trip.trip_id === selectedTripId}
                    onSelect={setSelectedTripId}
                  />
                ))}
              </div>
            )}

            <FloatingActionButton onClick={handleCreateTrip} ariaLabel="Create new trip" />
          </>
        ) : (
          <EmptyState onCreateTrip={handleCreateTrip} />
        )}
      </div>

      {/* Trip Form Modal */}
      <TripForm isOpen={isFormOpen} onClose={handleFormClose} onSuccess={handleFormSuccess} trip={editingTrip as any} />
    </div>
  );
}