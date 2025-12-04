'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import type { AlertType, AlertCategory } from '@/app/lib/types/alert';

interface UserPreferences {
  user_id: string;
  decimal_places: number;
  date_format: string;
  time_format: string;
  theme: string;
  notifications_enabled: number;
  first_day_of_week: string;
  measurement_system: string;
  updated_at: string;
}

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [alertCategories, setAlertCategories] = useState<AlertCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    alert_code: '',
    alert_description: '',
    category_code: 'normal',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch user preferences
      const prefResponse = await fetch('/api/user/preferences');
      if (prefResponse.status === 401) {
        router.push('/login');
        return;
      }
      if (prefResponse.ok) {
        const prefData = await prefResponse.json();
        setPreferences(prefData.preferences);
      }

      // Fetch alert types
      const alertResponse = await fetch('/api/alert-types');
      if (alertResponse.ok) {
        const alertData = await alertResponse.json();
        setAlertTypes(alertData);
      }

      // Fetch alert categories
      const catResponse = await fetch('/api/alert-categories');
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setAlertCategories(catData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const resetForm = () => {
    setFormData({ alert_code: '', alert_description: '', category_code: 'normal' });
    setIsAdding(false);
    setEditingCode(null);
  };

  const handleAdd = async () => {
    if (!formData.alert_code.trim() || !formData.alert_description.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/alert-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create alert type');
      }
    } catch (error) {
      console.error('Error creating alert type:', error);
      alert('Failed to create alert type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCode || !formData.alert_description.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/alert-types/${editingCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_description: formData.alert_description,
          category_code: formData.category_code,
        }),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update alert type');
      }
    } catch (error) {
      console.error('Error updating alert type:', error);
      alert('Failed to update alert type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (alertCode: string) => {
    if (!confirm('Delete this alert type?')) return;

    try {
      const response = await fetch(`/api/alert-types/${alertCode}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete alert type');
      }
    } catch (error) {
      console.error('Error deleting alert type:', error);
      alert('Failed to delete alert type');
    }
  };

  const startEditing = (alertType: AlertType) => {
    setEditingCode(alertType.alert_code);
    setFormData({
      alert_code: alertType.alert_code,
      alert_description: alertType.alert_description,
      category_code: alertType.category_code,
    });
    setIsAdding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative p-6">
      <PageBackground />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white">Preferences</h1>
          <p className="text-white/60 mt-1">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Preferences Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              General Settings
            </h2>

            {preferences ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Date Format</span>
                  <span className="text-white font-medium">{preferences.date_format}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Time Format</span>
                  <span className="text-white font-medium">{preferences.time_format}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Decimal Places</span>
                  <span className="text-white font-medium">{preferences.decimal_places}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Theme</span>
                  <span className="text-white font-medium capitalize">{preferences.theme}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">First Day of Week</span>
                  <span className="text-white font-medium capitalize">{preferences.first_day_of_week}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Measurement System</span>
                  <span className="text-white font-medium capitalize">{preferences.measurement_system}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70">Notifications</span>
                  <span className={`font-medium ${preferences.notifications_enabled ? 'text-green-400' : 'text-red-400'}`}>
                    {preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-white/50 text-center py-4">No preferences found</p>
            )}
          </div>

          {/* Alert Types Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alert Types
              </h2>
              {!isAdding && !editingCode && (
                <CircleIconButton
                  variant="primary"
                  onClick={() => setIsAdding(true)}
                  title="Add alert type"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                />
              )}
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingCode) && (
              <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                {isAdding && (
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Alert Code</label>
                    <input
                      type="text"
                      value={formData.alert_code}
                      onChange={e => setFormData({ ...formData, alert_code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="e.g., essentials"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.alert_description}
                    onChange={e => setFormData({ ...formData, alert_description: e.target.value })}
                    placeholder="e.g., Must-have items"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Category</label>
                  <select
                    value={formData.category_code}
                    onChange={e => setFormData({ ...formData, category_code: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    {alertCategories.map(cat => (
                      <option key={cat.category_code} value={cat.category_code} className="bg-gray-800">
                        {cat.icon} {cat.category_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <CircleIconButton
                    variant="default"
                    onClick={resetForm}
                    title="Cancel"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                  <CircleIconButton
                    variant="primary"
                    onClick={editingCode ? handleUpdate : handleAdd}
                    isLoading={isSaving}
                    disabled={!formData.alert_description.trim() || (isAdding && !formData.alert_code.trim())}
                    title={editingCode ? 'Save changes' : 'Add alert type'}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  />
                </div>
              </div>
            )}

            {/* Alert Types List */}
            {alertTypes.length > 0 ? (
              <div className="space-y-3">
                {alertTypes.map(alertType => (
                  <div
                    key={alertType.alert_code}
                    className="group flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-xl">{alertType.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{alertType.alert_code}</p>
                      <p className="text-white/60 text-sm truncate">{alertType.alert_description}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => startEditing(alertType)}
                        className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(alertType.alert_code)}
                        className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-400/30 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAdding && (
              <div className="text-center py-8">
                <p className="text-white/50 mb-2">No alert types defined</p>
                <p className="text-white/40 text-sm">Click + to create your first alert type</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}