'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import type { PackingAlert } from '@/app/lib/types/packing';

export default function PackingAlertWidget() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PackingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/packing/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (error) {
        console.error('Error fetching packing alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (isLoading || alerts.length === 0 || isDismissed) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.trip_id}
          className={cn(
            'bg-gradient-to-r from-red-500/20 to-orange-500/20',
            'backdrop-blur-xl border border-red-400/30 rounded-xl p-4'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚠️</span>
                <h3 className="text-white font-semibold">
                  Packing Alert: {alert.trip_name}
                </h3>
                <span className="text-sm text-white/60">
                  ({alert.days_until} {alert.days_until === 1 ? 'day' : 'days'} away)
                </span>
              </div>

              {/* Critical Items */}
              {alert.critical_items.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-sm text-red-300 mb-1">
                    <span>🔴</span>
                    <span className="font-medium">
                      {alert.critical_items.length} critical {alert.critical_items.length === 1 ? 'item' : 'items'} unpacked:
                    </span>
                  </div>
                  <p className="text-white/80 text-sm pl-6">
                    {alert.critical_items.map(item => item.item_name).join(', ')}
                  </p>
                </div>
              )}

              {/* Important Items */}
              {alert.important_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-yellow-300 mb-1">
                    <span>🟡</span>
                    <span className="font-medium">
                      {alert.important_items.length} important {alert.important_items.length === 1 ? 'item' : 'items'} unpacked:
                    </span>
                  </div>
                  <p className="text-white/80 text-sm pl-6">
                    {alert.important_items.map(item => item.item_name).join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/trip/${alert.trip_id}/packing`)}
                className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
              >
                View Checklist
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}