'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Plus, Trash2 } from 'lucide-react';

interface ActivityLink {
  link_id: number;
  link_url: string;
  link_description: string | null;
}

interface ActivityLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  dayId: number;
  categoryId: number;
  activityId: number;
  activityName: string;
}

export default function ActivityLinksModal({
  isOpen,
  onClose,
  tripId,
  dayId,
  categoryId,
  activityId,
  activityName,
}: ActivityLinksModalProps) {
  const [links, setLinks] = useState<ActivityLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLinks();
    }
  }, [isOpen, activityId]);

  const fetchLinks = async () => {
    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activityId}/links`
      );
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  };

  const handleAdd = async () => {
    if (!newUrl.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activityId}/links`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            link_url: newUrl,
            link_description: newDescription || null,
          }),
        }
      );

      if (res.ok) {
        setNewUrl('');
        setNewDescription('');
        fetchLinks();
      }
    } catch (err) {
      console.error('Error adding link:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (linkId: number) => {
    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activityId}/links/${linkId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        fetchLinks();
      }
    } catch (err) {
      console.error('Error deleting link:', err);
    }
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-lg font-semibold text-white">Website Links</h2>
                    <p className="text-sm text-white/60 truncate">{activityName}</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {/* Existing Links */}
                    {links.length > 0 ? (
                        <div className="space-y-2">
                            {links.map((link) => (
                                <div
                                    key={link.link_id}
                                    className="flex items-start gap-2 p-3 bg-white/5 border border-white/10 rounded-lg group hover:bg-white/10 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        {link.link_description && (
                                            <div className="text-sm font-medium text-white mb-0.5 truncate">
                                                {link.link_description}
                                            </div>
                                        )}
                                        <a
                                            href={link.link_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-purple-300 hover:text-purple-200 truncate block"
                                        >
                                            {link.link_url}
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(link.link_id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-white/70 hover:text-red-300 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-white/50 py-4">No links added yet</p>
                    )}

                    {/* Add New Link */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                        <input
                            type="text"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-purple-400"
                        />
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-purple-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newUrl.trim() || isLoading}
                                className="px-4 py-2 bg-purple-500/30 text-white rounded-lg hover:bg-purple-500/40 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>
                    </div>
                </div>    
            </div>
        </div>
    );
}