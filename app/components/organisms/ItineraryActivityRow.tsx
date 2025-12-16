'use client';

import { useState, useEffect } from 'react';
import { Clock, Edit2, Trash2, Check, X } from 'lucide-react';
import type { ItineraryActivity } from '@/app/lib/types/itinerary';
import { Link as LinkIcon } from 'lucide-react';
import ActivityLinksModal from '@/app/components/organisms/ActivityLinksModal';

interface ItineraryActivityRowProps {
  tripId: number;
  dayId: number;
  categoryId: number;
  activity: ItineraryActivity;
  disableCost: boolean;
  onUpdate: (activity: ItineraryActivity) => void;
  onDelete: (activityId: number) => void;
}

export default function ItineraryActivityRow({
  tripId,
  dayId,
  categoryId,
  activity,
  disableCost,
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
    }
  };

  const handleSave = async () => {
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
    }
  };

  const handleDelete = async () => {
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
            className="px-3 py-1.5 text-sm text-purple-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editName.trim()}
            className="px-3 py-1.5 text-sm bg-purple-500/30 text-white rounded-lg hover:bg-purple-500/40 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 flex items-center gap-3 group hover:bg-white/5 ${activity.is_completed ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          activity.is_completed
            ? 'bg-green-500/30 border-green-400'
            : 'border-purple-400 hover:border-purple-300'
        }`}
      >
        {activity.is_completed && <Check className="w-3 h-3 text-green-300" />}
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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