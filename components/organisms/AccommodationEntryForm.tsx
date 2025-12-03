'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import CircleIconButton from '@/components/ui/CircleIconButton';
import type { AccommodationOption } from '@/app/lib/types/accommodation';

interface Traveler {
  traveler_id: number;
  traveler_name: string;
  is_active: number;
}

interface Currency {
  currency_code: string;
  currency_name: string;
}

interface AccommodationType {
  type_name: string;
}

interface AccommodationEntryFormProps {
  tripId: number;
  accommodation?: AccommodationOption | null;
  travelers: Traveler[];
  currencies: Currency[];
  accommodationTypes: AccommodationType[];
  onSuccess: () => void;
  onClear: () => void;
}

export default function AccommodationEntryForm({
  tripId,
  accommodation,
  travelers,
  currencies,
  accommodationTypes,
  onSuccess,
  onClear,
}: AccommodationEntryFormProps) {
  const [typeName, setTypeName] = useState<string>('');
  const [accommodationName, setAccommodationName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const [numRooms, setNumRooms] = useState<number>(1);
  const [pricePerNight, setPricePerNight] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');
  const [bookingReference, setBookingReference] = useState<string>('');
  const [bookingSource, setBookingSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTravelers, setSelectedTravelers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = accommodation && accommodation.accommodation_option_id > 0;

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return null;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : null;
  };

  const nights = calculateNights();

  // Load accommodation data when editing
  useEffect(() => {
    if (accommodation) {
      setTypeName(accommodation.type_name || '');
      setAccommodationName(accommodation.accommodation_name || '');
      setAddress(accommodation.address || '');
      setLocation(accommodation.location || '');
      setCheckInDate(accommodation.check_in_date || '');
      setCheckInTime(accommodation.check_in_time || '');
      setCheckOutDate(accommodation.check_out_date || '');
      setCheckOutTime(accommodation.check_out_time || '');
      setNumRooms(accommodation.num_rooms || 1);
      setPricePerNight(accommodation.price_per_night?.toString() || '');
      setTotalPrice(accommodation.total_price?.toString() || '');
      setCurrencyCode(accommodation.currency_code || '');
      setBookingReference(accommodation.booking_reference || '');
      setBookingSource(accommodation.booking_source || '');
      setNotes(accommodation.notes || '');
      setSelectedTravelers(accommodation.travelers?.map(t => t.traveler_id) || []);
    } else {
      resetForm();
    }
  }, [accommodation]);

  // Auto-calculate total price when price per night or dates change
  useEffect(() => {
    if (pricePerNight && checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diff = checkOut.getTime() - checkIn.getTime();
      const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (nights > 0) {
        const calculatedTotal = parseFloat(pricePerNight) * nights;
        setTotalPrice(calculatedTotal.toFixed(2));
      }
    }
  }, [pricePerNight, checkInDate, checkOutDate]);

  const resetForm = () => {
    setTypeName('');
    setAccommodationName('');
    setAddress('');
    setLocation('');
    setCheckInDate('');
    setCheckInTime('');
    setCheckOutDate('');
    setCheckOutTime('');
    setNumRooms(1);
    setPricePerNight('');
    setTotalPrice('');
    setCurrencyCode('');
    setBookingReference('');
    setBookingSource('');
    setNotes('');
    setSelectedTravelers([]);
    setError(null);
  };

  const handleClear = () => {
    resetForm();
    onClear();
  };

  const toggleTraveler = (travelerId: number) => {
    setSelectedTravelers(prev =>
      prev.includes(travelerId)
        ? prev.filter(id => id !== travelerId)
        : [...prev, travelerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        type_name: typeName || undefined,
        accommodation_name: accommodationName || undefined,
        address: address || undefined,
        location: location || undefined,
        check_in_date: checkInDate || undefined,
        check_in_time: checkInTime || undefined,
        check_out_date: checkOutDate || undefined,
        check_out_time: checkOutTime || undefined,
        num_rooms: numRooms,
        price_per_night: pricePerNight ? parseFloat(pricePerNight) : undefined,
        total_price: totalPrice ? parseFloat(totalPrice) : undefined,
        currency_code: currencyCode || undefined,
        booking_reference: bookingReference || undefined,
        booking_source: bookingSource || undefined,
        notes: notes || undefined,
        traveler_ids: selectedTravelers,
      };

      let response;
      if (isEditing) {
        response = await fetch(`/api/trips/${tripId}/accommodations/${accommodation.accommodation_option_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/trips/${tripId}/accommodations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save accommodation');
      }

      resetForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save accommodation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTravelers = travelers.filter(t => t.is_active === 1);

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {isEditing ? 'Edit Accommodation' : 'Add Accommodation'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Type & Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Type</label>
            <select
              value={typeName}
              onChange={e => setTypeName(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            >
              <option value="" className="bg-gray-800">Select</option>
              {accommodationTypes.map(t => (
                <option key={t.type_name} value={t.type_name} className="bg-gray-800">
                  {t.type_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Name</label>
            <input
              type="text"
              value={accommodationName}
              onChange={e => setAccommodationName(e.target.value)}
              placeholder="Hilton Seoul"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Location & Address */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Seoul, South Korea"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="123 Main Street, Gangnam-gu"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Check-in Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Check-in Date</label>
            <input
              type="date"
              value={checkInDate}
              onChange={e => setCheckInDate(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Check-in Time</label>
            <input
              type="time"
              value={checkInTime}
              onChange={e => setCheckInTime(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Check-out Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Check-out Date</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={e => setCheckOutDate(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Check-out Time</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={e => setCheckOutTime(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Nights Display */}
        {nights && (
          <div className="text-sm text-purple-300 font-medium">
            {nights} night{nights > 1 ? 's' : ''}
          </div>
        )}

        {/* Rooms */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Number of Rooms</label>
          <input
            type="number"
            value={numRooms}
            onChange={e => setNumRooms(parseInt(e.target.value) || 1)}
            min="1"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Price/Night</label>
            <input
              type="number"
              value={pricePerNight}
              onChange={e => setPricePerNight(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Total Price</label>
            <input
              type="number"
              value={totalPrice}
              onChange={e => setTotalPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Currency</label>
            <select
              value={currencyCode}
              onChange={e => setCurrencyCode(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
            >
              <option value="" className="bg-gray-800">Select</option>
              {currencies.map(c => (
                <option key={c.currency_code} value={c.currency_code} className="bg-gray-800">
                  {c.currency_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Booking Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Booking Reference</label>
            <input
              type="text"
              value={bookingReference}
              onChange={e => setBookingReference(e.target.value)}
              placeholder="CONF123456"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Booking Source</label>
            <input
              type="text"
              value={bookingSource}
              onChange={e => setBookingSource(e.target.value)}
              placeholder="Booking.com"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Travelers */}
        {activeTravelers.length > 0 && (
          <div>
            <label className="block text-sm text-white/70 mb-2">Travelers</label>
            <div className="space-y-2">
              {activeTravelers.map(t => (
                <label
                  key={t.traveler_id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTravelers.includes(t.traveler_id)}
                    onChange={() => toggleTraveler(t.traveler_id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400"
                  />
                  <span className="text-sm text-white/80">{t.traveler_name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional details..."
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <CircleIconButton
            type="button"
            variant="default"
            onClick={handleClear}
            title="Clear form"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
          <CircleIconButton
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            title={isEditing ? 'Update accommodation' : 'Save accommodation'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
        </div>
      </div>
    </form>
  );
}