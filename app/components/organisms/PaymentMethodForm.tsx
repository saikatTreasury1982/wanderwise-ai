'use client';

import { useState, useEffect } from 'react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import TogglePill from '@/app/components/ui/TogglePill';

interface PaymentMethod {
    payment_method_id: number;
    payment_type: string;
    issuer: string;
    payment_network: string;
    payment_channel: string;
    payment_method_key: string;
    is_active: number;
}

interface Props {
    editing: PaymentMethod | null;   // null = add mode; a method = edit mode
    onSaved: () => void;             // parent refetches
    onCancel: () => void;
}

const emptyForm = {
    payment_type: 'Credit Card',
    issuer: '',
    payment_network: '',
    payment_channel: 'Card',
    payment_method_key: '',
    is_active: 1,
};

export default function PaymentMethodForm({ editing, onSaved, onCancel }: Props) {
    const [form, setForm] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editing) {
            setForm({
                payment_type: editing.payment_type,
                issuer: editing.issuer,
                payment_network: editing.payment_network,
                payment_channel: editing.payment_channel,
                payment_method_key: editing.payment_method_key,
                is_active: editing.is_active,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editing]);

    const handleSave = async () => {
        if (!form.payment_method_key.trim()) return;
        setIsSaving(true);
        try {
            const url = editing
                ? `/api/user/payment-methods/${editing.payment_method_id}`
                : '/api/user/payment-methods';
            const method = editing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save payment method');
            }
        } catch (error) {
            console.error('Error saving payment method:', error);
            alert('Failed to save payment method');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mb-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-white/60 mb-1">Payment Type</label>
                    <select
                        value={form.payment_type}
                        onChange={e => setForm({ ...form, payment_type: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
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
                        value={form.payment_channel}
                        onChange={e => setForm({ ...form, payment_channel: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
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
                        value={form.issuer}
                        onChange={e => setForm({ ...form, issuer: e.target.value })}
                        placeholder="e.g., Visa, Chase"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary-400"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/60 mb-1">Payment Network</label>
                    <input
                        type="text"
                        value={form.payment_network}
                        onChange={e => setForm({ ...form, payment_network: e.target.value })}
                        placeholder="e.g., Visa Card ending 1234"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary-400"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs text-white/60 mb-1">Payment Method Key</label>
                <input
                    type="text"
                    value={form.payment_method_key}
                    onChange={e => setForm({ ...form, payment_method_key: e.target.value })}
                    placeholder="e.g., visa_1234, paypal_account"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary-400"
                />
            </div>
            <div>
                <label className="block text-xs text-white/60 mb-1">Status</label>
                <TogglePill
                    value={form.is_active === 1 ? 'active' : 'inactive'}
                    onChange={(v) => setForm({ ...form, is_active: v === 'active' ? 1 : 0 })}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                    ]}
                    activeColors={{
                        active: 'bg-green-500/30 border-green-400 text-green-200',
                        inactive: 'bg-red-500/30 border-red-400 text-red-200',
                    }}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <CircleIconButton
                    variant="default"
                    size="small"
                    onClick={onCancel}
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
                    size="small"
                    onClick={handleSave}
                    isLoading={isSaving}
                    disabled={!form.payment_method_key.trim()}
                    title={editing ? 'Save changes' : 'Add payment method'}
                    className="w-9 h-9 sm:w-10 sm:h-10"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    }
                />
            </div>
        </div>
    );
}