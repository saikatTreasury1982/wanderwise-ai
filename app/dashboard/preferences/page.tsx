'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/app/components/ui/PageBackground';
import type { AlertType } from '@/app/lib/types/alert';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
          <p className="text-white/60 mt-1">View your account settings</p>
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
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Alert Types
            </h2>

            {alertTypes.length > 0 ? (
              <div className="space-y-3">
                {alertTypes.map(alertType => (
                  <div
                    key={alertType.alert_code}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <span className="text-xl">{alertType.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{alertType.alert_code}</p>
                      <p className="text-white/60 text-sm">{alertType.alert_description}</p>
                    </div>
                    <span className="text-xs text-white/40 uppercase">{alertType.category_code}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/50 mb-2">No alert types defined</p>
                <p className="text-white/40 text-sm">Alert types will appear here once created</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}