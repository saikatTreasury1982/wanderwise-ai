'use client';

import { useState, useEffect } from 'react';
import { cn, formatDateRange } from '@/app/lib/utils';
import type { TripNote, TripNoteType } from '@/app/lib/types/trip-note';

interface Trip {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
}

interface TripStatus {
  status_code: number;
  status_name: string;
}

interface TripSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY';
  statuses: TripStatus[];
}

const noteTypeIcons: Record<string, string> = {
  'Key Destinations': '📍',
  'Must-See Attractions': '⭐',
  'Trip Highlights': '✨',
  'Weather Notes': '🌤️',
  'Travel Tips': '💡',
  'Packing Reminders': '🧳',
};

export default function TripSummaryModal({
  isOpen,
  onClose,
  trip,
  dateFormat,
  statuses,
}: TripSummaryModalProps) {
  const [notes, setNotes] = useState<TripNote[]>([]);
  const [noteTypes, setNoteTypes] = useState<TripNoteType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      fetchData();
    }
  }, [isOpen, trip]);

  const fetchData = async () => {
    if (!trip) return;
    setIsLoading(true);
    try {
      const [notesRes, typesRes] = await Promise.all([
        fetch(`/api/trips/${trip.trip_id}/notes`),
        fetch('/api/trip-note-types'),
      ]);

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setNoteTypes(typesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !trip) return null;

  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ');

  const statusLabel = statuses.find(s => s.status_code === trip.status_code)?.status_name || 'Unknown';

  // Group notes by type
  const notesByType = noteTypes.reduce((acc, type) => {
    acc[type.type_name] = notes.filter(n => n.type_name === type.type_name);
    return acc;
  }, {} as Record<string, TripNote[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg md:max-w-5xl',
          'bg-gradient-to-br from-Black-900/40 via-indigo-900/30 to-black-900/40 backdrop-blur-xl',
          'border border-white/20 rounded-2xl',
          'shadow-2xl'
        )}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Trip Summary</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-[30%_68%] gap-4">
            {/* Column 1: Trip Details + Description */}
            <div className="space-y-4">
              {/* Trip Details */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">{trip.trip_name}</h3>
                {destination && (
                  <p className="text-white/70 text-sm mb-1">{destination}</p>
                )}
                <p className="text-white/60 text-sm mb-2">
                  {formatDateRange(trip.start_date, trip.end_date, dateFormat)}
                </p>
                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                  {statusLabel}
                </span>
              </div>

              {/* Description */}
              {trip.trip_description && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">Description</h4>
                  <p className="text-white/80 text-sm">{trip.trip_description}</p>
                </div>
              )}
            </div>

            {/* Column 2: Notes */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                  <p className="text-white/50 text-sm">No notes added yet</p>
                </div>
              ) : (
                noteTypes.map(type => {
                  const typeNotes = notesByType[type.type_name] || [];
                  if (typeNotes.length === 0) return null;

                  return (
                    <div key={type.type_name} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <span>{noteTypeIcons[type.type_name] || '📝'}</span>
                        {type.type_name}
                      </h4>
                      <div className="space-y-2">
                        {typeNotes.map(note => (
                          <div key={note.note_id} className="text-white/80 text-sm">
                            {note.content.split('\n').map((line, idx) => (
                              line.trim() && (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-400 mt-1">•</span>
                                  <span>{line.trim()}</span>
                                </div>
                              )
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}