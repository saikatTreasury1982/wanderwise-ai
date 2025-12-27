'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/lib/utils';
import type { PackingItem } from '@/app/lib/types/packing';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface AlertType {
  alert_code: string;
  alert_description: string;
  category_code: string;
}

interface PackingItemRowProps {
  item: PackingItem;
  tripId: number;
  categoryId: number;
  onToggle: (itemId: number) => void;
  onUpdate: (itemId: number, name: string) => void;
  onUpdatePriority: (itemId: number, priority: string) => void;
  onDelete: (itemId: number) => void;
}

const categoryIcons: Record<string, { icon: string; color: string }> = {
  critical: { icon: '🔴', color: 'text-red-400' },
  important: { icon: '🟡', color: 'text-yellow-400' },
  normal: { icon: '⚪', color: 'text-white/40' },
};

export default function PackingItemRow({
  item,
  tripId,
  categoryId,
  onToggle,
  onUpdate,
  onUpdatePriority,
  onDelete,
}: PackingItemRowProps) {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.item_name);
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const priorityButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.item_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch alert types
  useEffect(() => {
    const fetchAlertTypes = async () => {
      try {
        const response = await fetch('/api/alert-types');
        if (response.ok) {
          const data = await response.json();
          // Your API returns array directly, not wrapped in { alertTypes }
          setAlertTypes(data || []);
        }
      } catch (error) {
        console.error('Error fetching alert types:', error);
      }
    };

    fetchAlertTypes();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPriorityMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        priorityButtonRef.current &&
        !priorityButtonRef.current.contains(event.target as Node)
      ) {
        setShowPriorityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPriorityMenu]);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showPriorityMenu) {
        setShowPriorityMenu(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showPriorityMenu]);

  const handlePriorityClick = () => {
    if (!showPriorityMenu && priorityButtonRef.current) {
      const rect = priorityButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setShowPriorityMenu(!showPriorityMenu);
  };

  const handleSave = () => {
    if (editName.trim() && editName !== item.item_name) {
      onUpdate(item.item_id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.item_name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.item_id);
  };

  // Get current alert type details
  const currentAlertType = alertTypes.find(at => at.alert_code === item.priority);
  const currentCategory = currentAlertType?.category_code || 'normal';
  const currentIcon = categoryIcons[currentCategory] || categoryIcons.normal;

  const priorityMenu = showPriorityMenu && mounted ? createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-gray-800 border border-white/20 rounded-lg shadow-xl max-h-64 overflow-y-auto"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      {alertTypes.map(alertType => {
        const categoryIcon = categoryIcons[alertType.category_code] || categoryIcons.normal;
        return (
          <button
            key={alertType.alert_code}
            onClick={() => {
              onUpdatePriority(item.item_id, alertType.alert_code);
              setShowPriorityMenu(false);
            }}
            className={cn(
              'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap',
              item.priority === alertType.alert_code && 'bg-white/5'
            )}
          >
            <span>{categoryIcon.icon}</span>
            <span className="text-white/90">
              <span className="text-purple-300 font-medium">{alertType.alert_code}</span>
              <span className="text-white/50"> - </span>
              <span>{alertType.alert_description}</span>
            </span>
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg',
        'hover:bg-white/5 transition-colors'
      )}
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
        onClick={() => onToggle(item.item_id)}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          item.is_packed
            ? 'bg-green-500 border-green-500'
            : 'border-white/30 hover:border-white/50'
        )}
      >
        {item.is_packed === 1 && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Item Name */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-purple-400"
        />
      ) : (
        <span
          className={cn(
            'flex-1 text-sm transition-colors',
            item.is_packed ? 'text-white/50' : 'text-white/90'
          )}
        >
          {item.item_name}
        </span>
      )}

      {/* Action Buttons */}
      {!isEditing && (
        <div className="flex items-center gap-2">
          {/* Priority Button */}
          <button
            ref={priorityButtonRef}
            onClick={handlePriorityClick}
            className="p-1 text-white/70 hover:text-white transition-colors"
            title="Set priority"
          >
            <span className="text-sm">{currentIcon.icon}</span>
          </button>
          
          <button
            onClick={handleEdit}
            className="p-1 text-white/70 hover:text-white transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-white/70 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Priority Menu Portal */}
      {priorityMenu}
    </div>
  );
}