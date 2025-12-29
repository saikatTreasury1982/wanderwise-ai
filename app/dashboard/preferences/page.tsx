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

interface PaymentMethod {
  payment_method_id: number;
  user_id: string;
  payment_type: string;
  issuer: string;
  payment_network: string;
  payment_channel: string;
  payment_method_key: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [alertCategories, setAlertCategories] = useState<AlertCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Alert form states
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [editingAlertCode, setEditingAlertCode] = useState<string | null>(null);
  const [alertFormData, setAlertFormData] = useState({
    alert_code: '',
    alert_description: '',
    category_code: 'normal',
  });
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // Payment method form states
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_type: 'Credit Card',
    issuer: '',
    payment_network: '',
    payment_channel: 'Card',
    payment_method_key: '',
    is_active: 1,
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

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

      // Fetch payment methods
      const paymentResponse = await fetch('/api/user/payment-methods');
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentMethods(paymentData.payment_methods);
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

  // Alert functions
  const resetAlertForm = () => {
    setAlertFormData({ alert_code: '', alert_description: '', category_code: 'normal' });
    setIsAddingAlert(false);
    setEditingAlertCode(null);
  };

  const handleAddAlert = async () => {
    if (!alertFormData.alert_code.trim() || !alertFormData.alert_description.trim()) return;

    setIsSavingAlert(true);
    try {
      const response = await fetch('/api/alert-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertFormData),
      });

      if (response.ok) {
        await fetchData();
        resetAlertForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create alert type');
      }
    } catch (error) {
      console.error('Error creating alert type:', error);
      alert('Failed to create alert type');
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleUpdateAlert = async () => {
    if (!editingAlertCode || !alertFormData.alert_description.trim()) return;

    setIsSavingAlert(true);
    try {
      const response = await fetch(`/api/alert-types/${editingAlertCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_description: alertFormData.alert_description,
          category_code: alertFormData.category_code,
        }),
      });

      if (response.ok) {
        await fetchData();
        resetAlertForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update alert type');
      }
    } catch (error) {
      console.error('Error updating alert type:', error);
      alert('Failed to update alert type');
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleDeleteAlert = async (alertCode: string) => {
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

  const startEditingAlert = (alertType: AlertType) => {
    setEditingAlertCode(alertType.alert_code);
    setAlertFormData({
      alert_code: alertType.alert_code,
      alert_description: alertType.alert_description,
      category_code: alertType.category_code,
    });
    setIsAddingAlert(false);
  };

  // Payment method functions
  const resetPaymentForm = () => {
    setPaymentFormData({
      payment_type: 'Credit Card',
      issuer: '',
      payment_network: '',
      payment_channel: 'Card',
      payment_method_key: '',
      is_active: 1,
    });
    setIsAddingPayment(false);
    setEditingPaymentId(null);
  };

  const handleAddPayment = async () => {
    if (!paymentFormData.payment_method_key.trim()) return;

    setIsSavingPayment(true);
    try {
      const response = await fetch('/api/user/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentFormData),
      });

      if (response.ok) {
        await fetchData();
        resetPaymentForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create payment method');
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      alert('Failed to create payment method');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPaymentId) return;

    setIsSavingPayment(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${editingPaymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentFormData),
      });

      if (response.ok) {
        await fetchData();
        resetPaymentForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Failed to update payment method');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDeletePayment = async (methodId: number) => {
    if (!confirm('Delete this payment method?')) return;

    try {
      const response = await fetch(`/api/user/payment-methods/${methodId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method');
    }
  };

  const startEditingPayment = (method: PaymentMethod) => {
    setEditingPaymentId(method.payment_method_id);
    setPaymentFormData({
      payment_type: method.payment_type,
      issuer: method.issuer,
      payment_network: method.payment_network,
      payment_channel: method.payment_channel,
      payment_method_key: method.payment_method_key,
      is_active: method.is_active,
    });
    setIsAddingPayment(false);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'card':
        return '💳';
      case 'on_account':
        return '🏦';
      case 'cash':
        return '💵';
      default:
        return '💰';
    }
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
    <div className="min-h-screen relative p-4 sm:p-6">
      <PageBackground />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">Preferences</h1>
          <p className="text-white/60 mt-1 text-sm sm:text-base">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* User Preferences Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              General Settings
            </h2>

            {preferences ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70 text-sm sm:text-base">Date Format</span>
                  <span className="text-white font-medium text-sm sm:text-base">{preferences.date_format}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70 text-sm sm:text-base">Time Format</span>
                  <span className="text-white font-medium text-sm sm:text-base">{preferences.time_format}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70 text-sm sm:text-base">Decimal Places</span>
                  <span className="text-white font-medium text-sm sm:text-base">{preferences.decimal_places}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70 text-sm sm:text-base">Theme</span>
                  <span className="text-white font-medium capitalize text-sm sm:text-base">{preferences.theme}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70 text-sm sm:text-base">First Day of Week</span>
                  <span className="text-white font-medium capitalize text-sm sm:text-base">{preferences.first_day_of_week}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70 text-sm sm:text-base">Measurement System</span>
                  <span className="text-white font-medium capitalize text-sm sm:text-base">{preferences.measurement_system}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70 text-sm sm:text-base">Notifications</span>
                  <span className={`font-medium text-sm sm:text-base ${preferences.notifications_enabled ? 'text-green-400' : 'text-red-400'}`}>
                    {preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-white/50 text-center py-4 text-sm">No preferences found</p>
            )}
          </div>

          {/* Alert Types Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alert Types
              </h2>
              {!isAddingAlert && !editingAlertCode && (
                <CircleIconButton
                  variant="primary"
                  onClick={() => setIsAddingAlert(true)}
                  title="Add alert type"
                  className="w-10 h-10 sm:w-12 sm:h-12"
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                />
              )}
            </div>

            {/* Alert Add/Edit Form */}
            {(isAddingAlert || editingAlertCode) && (
              <div className="mb-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                {isAddingAlert && (
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Alert Code</label>
                    <input
                      type="text"
                      value={alertFormData.alert_code}
                      onChange={e => setAlertFormData({ ...alertFormData, alert_code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="e.g., essentials"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Description</label>
                  <input
                    type="text"
                    value={alertFormData.alert_description}
                    onChange={e => setAlertFormData({ ...alertFormData, alert_description: e.target.value })}
                    placeholder="e.g., Must-have items"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Category</label>
                  <select
                    value={alertFormData.category_code}
                    onChange={e => setAlertFormData({ ...alertFormData, category_code: e.target.value })}
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
                    onClick={resetAlertForm}
                    title="Cancel"
                    className="w-9 h-9 sm:w-10 sm:h-10"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                  <CircleIconButton
                    variant="primary"
                    onClick={editingAlertCode ? handleUpdateAlert : handleAddAlert}
                    isLoading={isSavingAlert}
                    disabled={!alertFormData.alert_description.trim() || (isAddingAlert && !alertFormData.alert_code.trim())}
                    title={editingAlertCode ? 'Save changes' : 'Add alert type'}
                    className="w-9 h-9 sm:w-10 sm:h-10"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  />
                </div>
              </div>
            )}

            {/* Alert Types List */}
            {alertTypes.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {alertTypes.map(alertType => (
                  <div
                    key={alertType.alert_code}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-lg sm:text-xl">{alertType.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm sm:text-base">{alertType.alert_code}</p>
                      <p className="text-white/60 text-xs sm:text-sm truncate">{alertType.alert_description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingAlert(alertType)}
                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alertType.alert_code)}
                        className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAddingAlert && (
              <div className="text-center py-8">
                <p className="text-white/50 mb-2 text-sm">No alert types defined</p>
                <p className="text-white/40 text-xs sm:text-sm">Click + to create your first alert type</p>
              </div>
            )}
          </div>

          {/* Payment Methods Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Methods
              </h2>
              {!isAddingPayment && !editingPaymentId && (
                <CircleIconButton
                  variant="primary"
                  onClick={() => setIsAddingPayment(true)}
                  title="Add payment method"
                  className="w-10 h-10 sm:w-12 sm:h-12"
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                />
              )}
            </div>

            {/* Payment Method Add/Edit Form */}
            {(isAddingPayment || editingPaymentId) && (
              <div className="mb-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Payment Type</label>
                    <select
                      value={paymentFormData.payment_type}
                      onChange={e => setPaymentFormData({ ...paymentFormData, payment_type: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                    >
                      <option value="Credit Card" className="bg-gray-800">Credit Card</option>
                      <option value="Debit Card" className="bg-gray-800">Debit Card</option>
                      <option value="PayPal" className="bg-gray-800">PayPal</option>
                      <option value="Bank Transfer" className="bg-gray-800">Bank Transfer</option>
                      <option value="Cash" className="bg-gray-800">Cash</option>
                      <option value="UPI" className="bg-gray-800">UPI</option>
                      <option value="Other" className="bg-gray-800">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Payment Channel</label>
                    <select
                      value={paymentFormData.payment_channel}
                      onChange={e => setPaymentFormData({ ...paymentFormData, payment_channel: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                    >
                      <option value="Card" className="bg-gray-800">Card</option>
                      <option value="On_Account" className="bg-gray-800">On Account</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Issuer</label>
                    <input
                      type="text"
                      value={paymentFormData.issuer}
                      onChange={e => setPaymentFormData({ ...paymentFormData, issuer: e.target.value })}
                      placeholder="e.g., Visa, Chase"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Payment Network</label>
                    <input
                      type="text"
                      value={paymentFormData.payment_network}
                      onChange={e => setPaymentFormData({ ...paymentFormData, payment_network: e.target.value })}
                      placeholder="e.g., Visa Card ending 1234"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Payment Method Key</label>
                  <input
                    type="text"
                    value={paymentFormData.payment_method_key}
                    onChange={e => setPaymentFormData({ ...paymentFormData, payment_method_key: e.target.value })}
                    placeholder="e.g., visa_1234, paypal_account"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.is_active === 1}
                      onChange={e => setPaymentFormData({ ...paymentFormData, is_active: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400"
                    />
                    <span className="text-white text-sm">Active</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <CircleIconButton
                    variant="default"
                    onClick={resetPaymentForm}
                    title="Cancel"
                    className="w-9 h-9 sm:w-10 sm:h-10"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                  <CircleIconButton
                    variant="primary"
                    onClick={editingPaymentId ? handleUpdatePayment : handleAddPayment}
                    isLoading={isSavingPayment}
                    disabled={!paymentFormData.payment_method_key.trim()}
                    title={editingPaymentId ? 'Save changes' : 'Add payment method'}
                    className="w-9 h-9 sm:w-10 sm:h-10"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  />
                </div>
              </div>
            )}

            {/* Payment Methods List */}
            {paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paymentMethods.map(method => (
                  <div
                    key={method.payment_method_id}
                    className={`flex flex-col gap-2 p-3 bg-white/5 rounded-lg border transition-colors ${
                      method.is_active ? 'border-white/10 hover:bg-white/10' : 'border-red-400/30 bg-red-500/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xl flex-shrink-0">{getChannelIcon(method.payment_channel)}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditingPayment(method)}
                          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePayment(method.payment_method_id)}
                          className="p-1 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {method.payment_method_key}
                        {!method.is_active && <span className="ml-1 text-xs text-red-400">(Inactive)</span>}
                      </p>
                      <p className="text-white/60 text-xs truncate">
                        {method.issuer ? `${method.issuer} • ${method.payment_type}` : method.payment_type}
                      </p>
                      {method.payment_network && (
                        <p className="text-white/50 text-xs truncate">{method.payment_network}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAddingPayment && (
              <div className="text-center py-8">
                <p className="text-white/50 mb-2 text-sm">No payment methods defined</p>
                <p className="text-white/40 text-xs sm:text-sm">Click + to add your first payment method</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}