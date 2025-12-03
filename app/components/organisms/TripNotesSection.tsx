'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import type { TripNote, TripNoteType } from '@/app/lib/types/trip-note';

interface TripNotesSectionProps {
  tripId: number;
}

const noteTypeIcons: Record<string, string> = {
  'Key Destinations': '📍',
  'Must-See Attractions': '⭐',
  'Trip Highlights': '✨',
  'Weather Notes': '🌤️',
  'Travel Tips': '💡',
  'Packing Reminders': '🧳',
};

export default function TripNotesSection({ tripId }: TripNotesSectionProps) {
  const [notes, setNotes] = useState<TripNote[]>([]);
  const [noteTypes, setNoteTypes] = useState<TripNoteType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [newNoteType, setNewNoteType] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [notesRes, typesRes] = await Promise.all([
        fetch(`/api/trips/${tripId}/notes`),
        fetch('/api/trip-note-types'),
      ]);

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setNoteTypes(typesData);
        if (typesData.length > 0 && !newNoteType) {
          setNewNoteType(typesData[0].type_name);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !newNoteType) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_name: newNoteType,
          content: newNoteContent.trim(),
        }),
      });

      if (response.ok) {
        await fetchData();
        setNewNoteContent('');
        setIsAdding(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (response.ok) {
        await fetchData();
        setEditingNoteId(null);
        setEditContent('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const startEditing = (note: TripNote) => {
    setEditingNoteId(note.note_id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  // Group notes by type
  const notesByType = noteTypes.reduce((acc, type) => {
    acc[type.type_name] = notes.filter(n => n.type_name === type.type_name);
    return acc;
  }, {} as Record<string, TripNote[]>);

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trip Notes</h3>
        {!isAdding && (
          <CircleIconButton
            type="button"
            variant="primary"
            onClick={() => setIsAdding(true)}
            title="Add note"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Type</label>
              <select
                value={newNoteType}
                onChange={e => setNewNoteType(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
              >
                {noteTypes.map(type => (
                  <option key={type.type_name} value={type.type_name} className="bg-gray-800">
                    {noteTypeIcons[type.type_name] || '📝'} {type.type_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
                <label className="block text-xs text-white/60 mb-1">Content (each line becomes a bullet point)</label>
                <textarea
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="Enter notes...&#10;Each line becomes a bullet point"
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 resize-none"
                />
            </div>
            <div className="flex justify-end gap-2">
              <CircleIconButton
                type="button"
                variant="default"
                onClick={() => {
                  setIsAdding(false);
                  setNewNoteContent('');
                }}
                title="Cancel"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              />
              <CircleIconButton
                type="button"
                variant="primary"
                onClick={handleAddNote}
                disabled={isSaving || !newNoteContent.trim()}
                isLoading={isSaving}
                title="Save note"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-4">No notes yet. Add your first note!</p>
      ) : (
        <div className="space-y-4">
          {noteTypes.map(type => {
            const typeNotes = notesByType[type.type_name] || [];
            if (typeNotes.length === 0) return null;

            return (
              <div key={type.type_name}>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span>{noteTypeIcons[type.type_name] || '📝'}</span>
                  {type.type_name}
                </h4>
                <div className="space-y-2">
                  {typeNotes.map(note => (
                    <div
                      key={note.note_id}
                      className={cn(
                        'group flex items-start gap-2 p-2 rounded-lg',
                        'bg-white/5 border border-white/10',
                        'hover:bg-white/10 transition-colors'
                      )}
                    >
                      {editingNoteId === note.note_id ? (
                        <div className="flex-1 space-y-2">
                            <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-purple-400 resize-none"
                            rows={3}
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Escape') {
                                cancelEditing();
                                }
                            }}
                            />
                            <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelEditing}
                                className="p-1 text-white/50 hover:text-white"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleUpdateNote(note.note_id)}
                                disabled={isSaving}
                                className="p-1 text-green-400 hover:text-green-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            </div>
                        </div>
                      ) : (
                        <>
                            <div className="flex-1 text-white/80 text-sm">
                                {note.content.split('\n').map((line, idx) => (
                                line.trim() && (
                                    <div key={idx} className="flex items-start gap-2">
                                    <span className="text-purple-400 mt-0.5">•</span>
                                    <span>{line.trim()}</span>
                                    </div>
                                )
                                ))}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity self-start">
                            <button
                              onClick={() => startEditing(note)}
                              className="p-1 text-white/50 hover:text-white"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.note_id)}
                              className="p-1 text-white/50 hover:text-red-400"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}