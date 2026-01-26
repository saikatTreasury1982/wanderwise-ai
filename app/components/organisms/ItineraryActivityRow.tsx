'use client';

import { useState, useEffect } from 'react';
import { Clock, Edit2, Trash2, Check, X } from 'lucide-react';
import type { ItineraryActivity } from '@/app/lib/types/itinerary';
import { Link as LinkIcon } from 'lucide-react';
import ActivityLinksModal from '@/app/components/organisms/ActivityLinksModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface ItineraryActivityRowProps {
  tripId: number;
  dayId: number;
  categoryId: number;
  activity: ItineraryActivity;
  disableCost: boolean;
  isActive: boolean;
  onUpdate: (activity: ItineraryActivity) => void;
  onDelete: (activityId: number) => void;
}

export default function ItineraryActivityRow({
  tripId,
  dayId,
  categoryId,
  activity,
  disableCost,
  isActive,
  onUpdate,
  onDelete,
}: ItineraryActivityRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activity.activity_name);
  const [editStartTime, setEditStartTime] = useState(activity.start_time || '');
  const [editEndTime, setEditEndTime] = useState(activity.end_time || '');
  const [editCost, setEditCost] = useState(activity.activity_cost?.toString() || '');
  const [editCurrency, setEditCurrency] = useState(activity.currency_code || '');
  const [editCostType, setEditCostType] = useState<'total' | 'per_head'>(activity.cost_type || 'total');
  const [editHeadcount, setEditHeadcount] = useState(activity.headcount?.toString() || '');
  const [editNotes, setEditNotes] = useState(activity.notes || '');
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [linkCount, setLinkCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.activity_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    const fetchLinkCount = async () => {
      try {
        const res = await fetch(
          `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activity.activity_id}/links`
        );
        if (res.ok) {
          const data = await res.json();
          setLinkCount(data.links?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching link count:', err);
      }
    };

    fetchLinkCount();
  }, [tripId, dayId, categoryId, activity.activity_id]);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activity.activity_id}/toggle`,
        { method: 'POST' }
      );

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch (err) {
      console.error('Error toggling activity:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activity.activity_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_name: editName,
            start_time: editStartTime || null,
            end_time: editEndTime || null,
            activity_cost: !disableCost && editCost ? parseFloat(editCost) : null,
            currency_code: !disableCost && editCost ? editCurrency || null : null,
            cost_type: !disableCost && editCost ? editCostType : 'total',
            headcount: !disableCost && editCost && editCostType === 'per_head' && editHeadcount ? parseInt(editHeadcount) : null,
            notes: editNotes || null,
          }),
        }
      );

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating activity:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activity.activity_id}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        onDelete(activity.activity_id);
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="px-4 py-3 space-y-2 bg-white/5">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Activity name"
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-purple-300" />
            <input
              type="time"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
            />
            <span className="text-purple-300">-</span>
            <input
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
            />
          </div>
          {!disableCost && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                placeholder="Cost"
                className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              />
              <input
                type="text"
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={3}
                className="w-14 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm uppercase"
              />
              <select
                value={editCostType}
                onChange={(e) => setEditCostType(e.target.value as 'total' | 'per_head')}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                <option value="total" className="bg-gray-800 text-white">Total</option>
                <option value="per_head" className="bg-gray-800 text-white">Per Head</option>
              </select>
              {editCostType === 'per_head' && (
                <input
                  type="number"
                  value={editHeadcount}
                  onChange={(e) => setEditHeadcount(e.target.value)}
                  placeholder="×"
                  className="w-12 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  min="1"
                />
              )}
            </div>
          )}
        </div>
        <input
          type="text"
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="p-1.5 rounded hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={!editName.trim() || isSaving}
            className="p-1.5 rounded hover:bg-white/10 text-purple-300 hover:text-white transition-colors disabled:opacity-50"
            title={isSaving ? 'Saving...' : 'Save'}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-4 py-3 flex items-center gap-3 group hover:bg-white/5 ${activity.is_completed ? 'opacity-60' : ''} ${!isActive ? 'opacity-40' : ''}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-purple-300" />
      </button>

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className="flex-shrink-0"
        title={isToggling ? 'Processing...' : (activity.is_completed ? 'Mark incomplete' : 'Mark complete')}
      >
        {isToggling ? (
          <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
        ) : activity.is_completed ? (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white/30 hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
          </svg>
        )}
      </button>

      {/* Activity Name */}
      <div className={`flex-1 ${activity.is_completed ? 'text-purple-400' : 'text-white'}`}>
        {activity.activity_name}
        {activity.notes && (
          <span className="ml-2 text-xs text-purple-400">({activity.notes})</span>
        )}
      </div>

      {/* Time Range */}
      {activity.start_time && (
        <div className="flex items-center gap-1 text-sm text-purple-300">
          <Clock className="w-3 h-3" />
          <span>
            {activity.start_time}
            {activity.end_time && `-${activity.end_time}`}
          </span>
          {activity.duration_minutes && (
            <span className="text-purple-400">({formatDuration(activity.duration_minutes)})</span>
          )}
        </div>
      )}

      {/* Cost */}
      {!disableCost && activity.activity_cost !== null && activity.currency_code && (
        <div className="text-sm text-purple-200">
          {activity.cost_type === 'per_head' && activity.headcount ? (
            <>
              {activity.currency_code} {activity.activity_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {activity.headcount} = {activity.currency_code} {(activity.activity_cost * activity.headcount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </>
          ) : (
            <>
              {activity.currency_code} {activity.activity_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowLinksModal(true)}
          className="p-1 rounded hover:bg-white/10 text-purple-300 hover:text-white relative"
          title="Manage links"
        >
          <LinkIcon className="w-3 h-3" />
          {linkCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 text-white text-[8px] rounded-full flex items-center justify-center">
              {linkCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded hover:bg-white/10 text-purple-300 hover:text-white"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-red-500/20 text-purple-300 hover:text-red-300"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <ActivityLinksModal
        isOpen={showLinksModal}
        onClose={() => {
          setShowLinksModal(false);
          // Refresh link count
          const fetchLinkCount = async () => {
            try {
              const res = await fetch(
                `/api/trips/${tripId}/itinerary/${dayId}/categories/${categoryId}/activities/${activity.activity_id}/links`
              );
              if (res.ok) {
                const data = await res.json();
                setLinkCount(data.links?.length || 0);
              }
            } catch (err) {
              console.error('Error fetching link count:', err);
            }
          };
          fetchLinkCount();
        }}
        tripId={tripId}
        dayId={dayId}
        categoryId={categoryId}
        activityId={activity.activity_id}
        activityName={activity.activity_name}
      />
    </div>
  );
}