'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import Input from '@/app/components/ui/Input';
import SelectPill from '@/app/components/ui/SelectPill';
import CurrencyCombobox from '@/app/components/ui/CurrencyCombobox';
import NoteField from '@/app/components/ui/NoteField';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import type { AccommodationOption } from '@/app/lib/types/accommodation';

interface Traveler { traveler_id: number; traveler_name: string; is_active: number; is_cost_sharer: number; }
interface Currency { currency_code: string; currency_name: string; }
interface AccommodationType { type_name: string; }

interface Props {
  tripId: number;
  accommodation?: AccommodationOption | null;
  travelers: Traveler[];
  currencies: Currency[];
  accommodationTypes: AccommodationType[];
  onSuccess: () => void;
  onClear: () => void;
}

export default function AccommodationEntryForm({
  tripId, accommodation, travelers, currencies, accommodationTypes, onSuccess, onClear,
}: Props) {
  const [typeName, setTypeName] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [ciDate, setCiDate] = useState('');
  const [ciTime, setCiTime] = useState('');
  const [coDate, setCoDate] = useState('');
  const [coTime, setCoTime] = useState('');
  const [numRooms, setNumRooms] = useState(1);
  const [pricePerNight, setPricePerNight] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [bookingSource, setBookingSource] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTravelers, setSelectedTravelers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!accommodation && accommodation.accommodation_option_id > 0;

  const nights = (() => {
    if (!ciDate || !coDate) return null;
    const d = Math.ceil((new Date(coDate).getTime() - new Date(ciDate).getTime()) / 86400000);
    return d > 0 ? d : null;
  })();

  useEffect(() => {
    if (accommodation) {
      setTypeName(accommodation.type_name || '');
      setName(accommodation.accommodation_name || '');
      setLocation(accommodation.location || '');
      setAddress(accommodation.address || '');
      setCiDate(accommodation.check_in_date || '');
      setCiTime(accommodation.check_in_time || '');
      setCoDate(accommodation.check_out_date || '');
      setCoTime(accommodation.check_out_time || '');
      setNumRooms(accommodation.num_rooms || 1);
      setPricePerNight(accommodation.price_per_night?.toString() || '');
      setTotalPrice(accommodation.total_price?.toString() || '');
      setCurrency(accommodation.currency_code || '');
      setBookingRef(accommodation.booking_reference || '');
      setBookingSource(accommodation.booking_source || '');
      setNotes(accommodation.notes || '');
      setSelectedTravelers(accommodation.travelers?.map(t => t.traveler_id) || []);
    } else {
      reset();
    }
  }, [accommodation]);

  useEffect(() => {
    if (pricePerNight && ciDate && coDate) {
      const n = Math.ceil((new Date(coDate).getTime() - new Date(ciDate).getTime()) / 86400000);
      if (n > 0) setTotalPrice((parseFloat(pricePerNight) * n).toFixed(2));
    }
  }, [pricePerNight, ciDate, coDate]);

  const reset = () => {
    setTypeName(''); setName(''); setLocation(''); setAddress('');
    setCiDate(''); setCiTime(''); setCoDate(''); setCoTime('');
    setNumRooms(1); setPricePerNight(''); setTotalPrice(''); setCurrency('');
    setBookingRef(''); setBookingSource(''); setNotes(''); setSelectedTravelers([]); setError(null);
  };

  const handleClear = () => { reset(); onClear(); };

  const toggleTraveler = (id: number) =>
    setSelectedTravelers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        type_name: typeName || undefined,
        accommodation_name: name || undefined,
        address: address || undefined,
        location: location || undefined,
        check_in_date: ciDate || undefined,
        check_in_time: ciTime || undefined,
        check_out_date: coDate || undefined,
        check_out_time: coTime || undefined,
        num_rooms: numRooms,
        price_per_night: pricePerNight ? parseFloat(pricePerNight) : undefined,
        total_price: totalPrice ? parseFloat(totalPrice) : undefined,
        currency_code: currency || undefined,
        booking_reference: bookingRef || undefined,
        booking_source: bookingSource || undefined,
        notes: notes || undefined,
        traveler_ids: selectedTravelers,
      };
      const res = await fetch(
        isEditing
          ? `/api/trips/${tripId}/accommodations/${accommodation!.accommodation_option_id}`
          : `/api/trips/${tripId}/accommodations`,
        { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      reset();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const label = 'block text-xs text-white/50 mb-1.5';
  const field = 'w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-400 transition-colors';
  const sorted = [...travelers].sort((a, b) => b.is_active - a.is_active);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">{isEditing ? 'Edit accommodation' : 'Add accommodation'}</h3>

      {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">{error}</div>}

      {/* Row 1 — type, name, location */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="w-44">
          <div className={label}>Accommodation Type</div>
          <SelectPill
            value={typeName}
            onChange={setTypeName}
            ariaLabel="Accommodation type"
            placeholderOption={{ value: '', label: 'Select' }}
            options={accommodationTypes.map(t => ({ value: t.type_name, label: t.type_name }))}
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className={label}>Name</div>
          <Input name="name" placeholder="Hilton Seoul" value={name} onChange={e => setName(e.target.value)} variant="glass" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className={label}>Location</div>
          <Input name="location" placeholder="Seoul, South Korea" value={location} onChange={e => setLocation(e.target.value)} variant="glass" />
        </div>
      </div>

      {/* Row 2 — address (full width) */}
      <div className="mb-4">
        <div className={label}>Address</div>
        <Input name="address" placeholder="123 Main St, Gangnam-gu" value={address} onChange={e => setAddress(e.target.value)} variant="glass" />
      </div>

      {/* Row 3 — check-in, check-out, rooms, nights */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <div className={label}>Check-in</div>
          <div className="flex gap-2">
            <input type="date" className={cn(field, 'w-40')} value={ciDate} onChange={e => setCiDate(e.target.value)} />
            <input type="time" className={cn(field, 'w-32')} value={ciTime} onChange={e => setCiTime(e.target.value)} />
          </div>
        </div>
        <div>
          <div className={label}>Check-out</div>
          <div className="flex gap-2">
            <input type="date" className={cn(field, 'w-40')} value={coDate} onChange={e => setCoDate(e.target.value)} />
            <input type="time" className={cn(field, 'w-32')} value={coTime} onChange={e => setCoTime(e.target.value)} />
          </div>
        </div>
        <div className="w-24">
          <div className={label}>Rooms</div>
          <input type="number" min="1" className={field} value={numRooms} onChange={e => setNumRooms(parseInt(e.target.value) || 1)} />
        </div>
        {nights && <div className="text-sm text-primary-300 font-medium pb-2">{nights} night{nights > 1 ? 's' : ''}</div>}
      </div>

      {/* Row 4 — price/night, total, currency, ref, source */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="w-32">
          <div className={label}>Price/night</div>
          <input type="number" step="0.01" placeholder="0.00" className={field} value={pricePerNight} onChange={e => setPricePerNight(e.target.value)} />
        </div>
        <div className="w-32">
          <div className={label}>Total</div>
          <input type="number" step="0.01" placeholder="0.00" className={field} value={totalPrice} onChange={e => setTotalPrice(e.target.value)} />
        </div>
        <div>
          <div className={label}>Currency</div>
          <CurrencyCombobox value={currency} currencies={currencies} onSelect={setCurrency} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <Input name="ref" label="Booking reference" placeholder="CONF123456" value={bookingRef} onChange={e => setBookingRef(e.target.value)} variant="glass" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <Input name="source" label="Booking source" placeholder="Booking.com" value={bookingSource} onChange={e => setBookingSource(e.target.value)} variant="glass" />
        </div>
      </div>

      {/* Travellers (in-form) */}
      {sorted.length > 0 && (
        <div className="mb-4">
          <div className={label}>Travellers</div>
          <div className="flex flex-wrap gap-3">
            {sorted.map(t => {
              const on = selectedTravelers.includes(t.traveler_id);
              return (
                <button key={t.traveler_id} type="button" onClick={() => toggleTraveler(t.traveler_id)}
                  className={cn('flex items-center gap-2', t.is_active === 0 && 'opacity-60')}>
                  <span className={cn('w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                    on ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/30 text-transparent')}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <span className="text-sm text-white/80">{t.traveler_name}</span>
                  {t.is_active === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/30">inactive</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 4 — note */}
      <div className="mb-4">
        <div className={label}>Note</div>
        <NoteField value={notes} onChange={setNotes} placeholder="Parking · WiFi · Check-in instructions" />
      </div>

      <div className="flex justify-end gap-2">
        <CircleIconButton type="button" variant="default" size="small" onClick={handleClear} title="Clear"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
        <CircleIconButton type="button" variant="primary" size="small" onClick={handleSubmit} isLoading={submitting} title={isEditing ? 'Update' : 'Save'}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
      </div>
    </div>
  );
}