'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Plane, Building2, Calendar, Users, ChevronDown, ChevronRight, Play } from 'lucide-react';
import PageBackground from '@/app/components/ui/PageBackground';
import type { CostForecastReport, TravelerShare } from '@/app/lib/types/cost-forecast';
import { formatDateRange } from '@/app/lib/utils';

interface Trip {
  trip_id: number;
  trip_name: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface PageProps {
  params: Promise<{ tripId: string }>;
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-400' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-yellow-400' },
];

export default function CostForecastPage({ params }: PageProps) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [report, setReport] = useState<CostForecastReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['confirmed', 'shortlisted']);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [travelerCurrencies, setTravelerCurrencies] = useState<Record<number, string>>({});
  const [travelerConvertedAmounts, setTravelerConvertedAmounts] = useState<Record<number, { amount: number; rate: number }>>({});
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'DD Mmm YYYY'>('DD Mmm YYYY');

  useEffect(() => {
    fetchTrip();
    fetchExistingReport();
    fetchPreferences();
  }, [tripId]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setDateFormat(data.preferences?.date_format || 'DD Mmm YYYY');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchExistingReport = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/cost-forecast`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        
        // Initialize traveler currencies
        const currencies: Record<number, string> = {};
        data.traveler_shares.forEach((t: TravelerShare) => {
          currencies[t.traveler_id] = t.share_currency;
        });
        setTravelerCurrencies(currencies);
      }
    } catch (error) {
      // No existing report, that's fine
      console.log('No existing report found');
    }
  };

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectCosts = async () => {
  if (selectedStatuses.length === 0) {
    alert('Please select at least one status');
    return;
  }

  try {
    setCollecting(true);
    const res = await fetch(`/api/trips/${tripId}/cost-forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statuses: selectedStatuses }),
    });
    
    if (res.ok) {
      const data = await res.json();
      setReport(data);
      
      // Initialize traveler currencies
      const currencies: Record<number, string> = {};
      data.traveler_shares.forEach((t: TravelerShare) => {
        currencies[t.traveler_id] = t.share_currency;
      });
      setTravelerCurrencies(currencies);
      setTravelerConvertedAmounts({});
    } else {
      const errorData = await res.json();
      console.error('Error:', errorData);
      alert('Failed to collect costs: ' + (errorData.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error collecting costs:', error);
    alert('Failed to collect costs');
  } finally {
    setCollecting(false);
  }
};

  const handleRefreshRates = async () => {
    setRefreshing(true);
    await handleCollectCosts();
    setRefreshing(false);
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        // Don't allow deselecting all
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

  const handleTravelerCurrencyChange = async (travelerId: number, currency: string) => {
    setTravelerCurrencies(prev => ({ ...prev, [travelerId]: currency }));
    
    if (!report) return;
    
    const traveler = report.traveler_shares.find(t => t.traveler_id === travelerId);
    if (!traveler) return;

    if (currency === report.base_currency) {
      setTravelerConvertedAmounts(prev => {
        const updated = { ...prev };
        delete updated[travelerId];
        return updated;
      });
      return;
    }

    // Fetch conversion rate
    try {
      const res = await fetch(`/api/exchange-rates?base=${report.base_currency}&symbols=${currency}`);
      if (res.ok) {
        const data = await res.json();
        const rate = data.rates[currency];
        if (rate) {
          setTravelerConvertedAmounts(prev => ({
            ...prev,
            [travelerId]: {
              amount: traveler.share_amount * rate,
              rate,
            },
          }));
        }
      }
    } catch (error) {
      console.error('Error converting currency:', error);
    }
  };

  const toggleModuleExpand = (module: string) => {
    setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatHeaderDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'flights':
        return <Plane className="w-5 h-5" />;
      case 'accommodations':
        return <Building2 className="w-5 h-5" />;
      case 'itinerary':
        return <Calendar className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'flights':
        return 'Flights';
      case 'accommodations':
        return 'Accommodations';
      case 'itinerary':
        return 'Itinerary';
      default:
        return module;
    }
  };

  if (loading) {
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
    <div className="min-h-screen relative p-6 pb-24">
      <PageBackground />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/trip/${tripId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Hub
          </button>

          <h1 className="text-3xl font-bold text-white mb-3">Cost Forecast</h1>
          <p className="text-white/70 text-lg mb-3">{trip?.trip_name}</p>
          
          <div className="flex flex-wrap items-center gap-3">
            {(trip?.destination_city || trip?.destination_country) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/90">{[trip?.destination_city, trip?.destination_country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            
            {trip?.start_date && trip?.end_date && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-white/90">{formatDateRange(trip.start_date, trip.end_date, dateFormat)}</span>
                </div>
                
                {(() => {
                  const start = new Date(trip.start_date);
                  const end = new Date(trip.end_date);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const nights = days - 1;
                  return (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-400/30">
                      <span className="text-sm font-medium text-purple-200">{days}D / {nights}N</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Status Filter & Actions */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">Include:</span>
              <div className="flex items-center gap-2">
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusToggle(status.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      selectedStatuses.includes(status.value)
                        ? 'bg-purple-500/30 border border-purple-400/50'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span className={selectedStatuses.includes(status.value) ? 'text-white' : 'text-white/70'}>
                      {status.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Collect Costs Button */}
              <div className="relative group">
                <button
                  onClick={handleCollectCosts}
                  disabled={collecting}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  <Play className={`w-5 h-5 ${collecting ? 'animate-pulse' : ''}`} />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Collect Costs
                </div>
              </div>

              {/* Refresh Rates Button */}
              {report && (
                <div className="relative group">
                  <button
                    onClick={handleRefreshRates}
                    disabled={refreshing}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Refresh Exchange Rates
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* No Report Yet */}
        {!report && !collecting && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready to Collect Costs</h3>
            <p className="text-white/70 mb-4">
              Select the statuses to include and click the play button to generate your cost forecast.
            </p>
          </div>
        )}

        {/* Loading State */}
        {collecting && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/70">Collecting costs from all modules...</p>
          </div>
        )}

        {report && !collecting && (
          <>
            {/* Total Cost Card */}
            <div className="bg-gradient-to-r from-purple-500/30 to-blue-500/30 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-6">
              <div className="text-purple-200 text-sm mb-1">Total Estimated Cost</div>
              <div className="text-4xl font-bold text-white">
                {formatCurrency(report.total_cost, report.base_currency)}
              </div>
              <div className="text-white/50 text-sm mt-2">
                Base currency: {report.base_currency} (Primary traveler)
              </div>
            </div>

            {/* Module Breakdown */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Breakdown by Module</h3>
              </div>
              <div className="divide-y divide-white/10">
                {report.module_breakdown.map(module => (
                  <div key={module.module}>
                    <button
                      onClick={() => toggleModuleExpand(module.module)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedModules[module.module] ? (
                          <ChevronDown className="w-4 h-4 text-purple-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-purple-300" />
                        )}
                        <div className="text-purple-300">{getModuleIcon(module.module)}</div>
                        <span className="text-white font-medium">{getModuleLabel(module.module)}</span>
                        <span className="text-white/50 text-sm">({module.items_count} items)</span>
                      </div>
                      <span className="text-white font-semibold">
                        {formatCurrency(module.total, module.currency_code)}
                      </span>
                    </button>
                    
                    {expandedModules[module.module] && module.items.length > 0 && (
                      <div className="bg-white/5 px-6 py-2">
                        {module.items.map(item => (
                          <div key={`${item.module}-${item.id}`} className="flex items-center justify-between py-2 text-sm">
                            <span className="text-white/70">{item.description}</span>
                            <span className="text-white/90">
                              {item.currency_code !== report.base_currency ? (
                                <span className="text-purple-300">
                                  {formatCurrency(item.amount, item.currency_code)} → {formatCurrency(item.converted_amount || item.amount, report.base_currency)}
                                </span>
                              ) : (
                                formatCurrency(item.amount, item.currency_code)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Traveler Breakdown */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Cost Share by Traveler</h3>
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <Users className="w-4 h-4" />
                    <span>Equal split among {report.cost_sharers_count} cost sharers</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {report.traveler_shares.map(traveler => (
                  <div key={traveler.traveler_id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-white font-medium">
                        {traveler.traveler_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {traveler.traveler_name}
                          {traveler.is_primary === 1 && (
                            <span className="ml-2 text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-white/50 text-sm">
                          Default: {traveler.traveler_currency}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          {formatCurrency(traveler.share_amount, report.base_currency)}
                        </div>
                        {travelerConvertedAmounts[traveler.traveler_id] && (
                          <div className="text-purple-300 text-sm">
                            ≈ {formatCurrency(
                              travelerConvertedAmounts[traveler.traveler_id].amount,
                              travelerCurrencies[traveler.traveler_id]
                            )}
                          </div>
                        )}
                      </div>
                      <select
                        value={travelerCurrencies[traveler.traveler_id] || report.base_currency}
                        onChange={(e) => handleTravelerCurrencyChange(traveler.traveler_id, e.target.value)}
                        className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      >
                        <option value={report.base_currency} className="bg-gray-800">{report.base_currency}</option>
                        <option value="USD" className="bg-gray-800">USD</option>
                        <option value="EUR" className="bg-gray-800">EUR</option>
                        <option value="GBP" className="bg-gray-800">GBP</option>
                        <option value="AUD" className="bg-gray-800">AUD</option>
                        <option value="KRW" className="bg-gray-800">KRW</option>
                        <option value="JPY" className="bg-gray-800">JPY</option>
                        <option value="INR" className="bg-gray-800">INR</option>
                        <option value="SGD" className="bg-gray-800">SGD</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FX Translations */}
            {report.fx_items.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Foreign Currency Items</h3>
                  <p className="text-white/50 text-sm">Items converted to {report.base_currency}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-white/50 text-sm border-b border-white/10">
                        <th className="px-6 py-3 font-medium">Item</th>
                        <th className="px-6 py-3 font-medium text-right">Original</th>
                        <th className="px-6 py-3 font-medium text-right">Rate</th>
                        <th className="px-6 py-3 font-medium text-right">Converted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {report.fx_items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-6 py-3 text-white">{item.description}</td>
                          <td className="px-6 py-3 text-right text-white/70">
                            {formatCurrency(item.original_amount, item.original_currency)}
                          </td>
                          <td className="px-6 py-3 text-right text-purple-300 text-sm">
                            {item.exchange_rate.toFixed(6)}
                          </td>
                          <td className="px-6 py-3 text-right text-white font-medium">
                            {formatCurrency(item.converted_amount, item.converted_currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}