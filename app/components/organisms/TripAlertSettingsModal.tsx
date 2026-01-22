'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import type { AlertType, TripAlertSettingWithDetails } from '@/app/lib/types/alert';

interface TripAlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  tripName: string;
}

export default function TripAlertSettingsModal({
  isOpen,
  onClose,
  tripId,
  tripName,
}: TripAlertSettingsModalProps) {
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [settings, setSettings] = useState<TripAlertSettingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/alert-settings`);
      if (response.ok) {
        const data = await response.json();
        setAlertTypes(data.alertTypes);
        setSettings(data.settings);

        // Initialize local settings from existing settings
        const initial: Record<string, number> = {};
        data.settings.forEach((s: TripAlertSettingWithDetails) => {
          initial[s.alert_code] = s.alert_days;
        });
        setLocalSettings(initial);
      }
    } catch (error) {
      console.error('Error fetching alert settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, tripId]);

  const handleDaysChange = (alertCode: string, days: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [alertCode]: days,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all settings
      for (const alertType of alertTypes) {
        const days = localSettings[alertType.alert_code];
        if (days !== undefined && days >= 0) {
          await fetch(`/api/trips/${tripId}/alert-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alert_code: alertType.alert_code,
              alert_days: days,
            }),
          });
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-gray-900/95 backdrop-blur-xl',
          'border border-white/20 rounded-2xl',
          'shadow-2xl'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Alert Settings</h2>
            <p className="text-sm text-white/60">{tripName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alertTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50 mb-2">No alert types defined</p>
              <p className="text-white/40 text-sm">
                Create alert types in Preferences first
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-white/60">
                Set how many days before the trip to receive alerts for unpacked items.
              </p>

              {alertTypes.map(alertType => (
                <div
                  key={alertType.alert_code}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <span className="text-xl">{alertType.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{alertType.alert_code}</p>
                    <p className="text-white/50 text-xs truncate">{alertType.alert_description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={localSettings[alertType.alert_code] ?? 0}
                      onChange={e => handleDaysChange(alertType.alert_code, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm text-center focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-white/50 text-sm">days</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {alertTypes.length > 0 && (
          <div className="border-t border-white/10 p-4 flex justify-end gap-2">
            <CircleIconButton
              variant="default"
              onClick={onClose}
              title="Cancel"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
            <CircleIconButton
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              title="Save settings"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}