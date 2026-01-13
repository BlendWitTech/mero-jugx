import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card, Button, Input, Label, toast, Textarea } from '@shared';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { paymentModesApi, PaymentMode } from '../../../api/payment-modes';

export default function PaymentModesSettings() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [modes, setModes] = useState<PaymentMode[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newMode, setNewMode] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchModes();
    }, []);

    const fetchModes = async () => {
        try {
            setLoading(true);
            const data = await paymentModesApi.getPaymentModes();
            setModes(data);
        } catch (error: any) {
            toast.error('Failed to fetch payment modes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newMode.name) {
            toast.error('Name is required');
            return;
        }

        try {
            await paymentModesApi.createPaymentMode(newMode);
            toast.success('Payment mode created successfully');
            setIsAdding(false);
            setNewMode({ name: '', description: '' });
            fetchModes();
        } catch (error: any) {
            toast.error('Failed to create payment mode');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment mode?')) return;
        try {
            await paymentModesApi.deletePaymentMode(id);
            toast.success('Deleted');
            fetchModes();
        } catch (error: any) {
            toast.error('Failed to delete');
        }
    };

    const toggleDefault = async (mode: PaymentMode) => {
        try {
            await paymentModesApi.updatePaymentMode(mode.id, { isDefault: !mode.isDefault });
            fetchModes();
        } catch (error: any) {
            toast.error('Failed to update');
        }
    };

    const toggleEnabled = async (mode: PaymentMode) => {
        try {
            await paymentModesApi.updatePaymentMode(mode.id, { enabled: !mode.enabled });
            fetchModes();
        } catch (error: any) {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return <div className="p-12 text-center opacity-50">Loading...</div>;
    }

    return (
        <Card className="p-8 space-y-8 border-none shadow-xl shadow-black/5" style={{ backgroundColor: theme.colors.surface, borderRadius: '24px' }}>
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Payment Modes</h3>
                {!isAdding && (
                    <Button variant="primary" onClick={() => setIsAdding(true)} className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mode
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Method Name</Label>
                            <Input
                                placeholder="Bank Transfer, Cash, PayPal, etc."
                                value={newMode.name}
                                onChange={e => setNewMode({ ...newMode, name: e.target.value })}
                                className="bg-surface rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                                placeholder="Details about this payment method..."
                                value={newMode.description}
                                onChange={e => setNewMode({ ...newMode, description: e.target.value })}
                                className="bg-surface rounded-xl"
                                rows={2}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreate}>Save</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {modes.length === 0 ? (
                    <p className="text-center py-8 opacity-50">No payment modes configured.</p>
                ) : (
                    modes.map((mode) => (
                        <div
                            key={mode.id}
                            className="flex items-center justify-between p-5 rounded-2xl border-2 transition-all group"
                            style={{
                                borderColor: mode.isDefault ? theme.colors.primary : theme.colors.border,
                                backgroundColor: mode.enabled ? 'transparent' : `${theme.colors.border}50`
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <button onClick={() => toggleDefault(mode)} className="transition-transform active:scale-90">
                                    {mode.isDefault ? (
                                        <CheckCircle2 className="h-6 w-6 text-primary" style={{ color: theme.colors.primary }} />
                                    ) : (
                                        <Circle className="h-6 w-6 opacity-20 hover:opacity-100 transition-opacity" />
                                    )}
                                </button>
                                <div>
                                    <div className="font-bold text-lg" style={{ color: theme.colors.text }}>
                                        {mode.name} {mode.isDefault && <span className="ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>Default</span>}
                                    </div>
                                    {mode.description && <div className="text-sm opacity-50">{mode.description}</div>}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm opacity-50">{mode.enabled ? 'Enabled' : 'Disabled'}</span>
                                    <button
                                        onClick={() => toggleEnabled(mode)}
                                        className="relative w-10 h-5 rounded-full transition-colors duration-200"
                                        style={{ backgroundColor: mode.enabled ? theme.colors.primary : theme.colors.border }}
                                    >
                                        <div
                                            className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200"
                                            style={{ transform: mode.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                                        />
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleDelete(mode.id)}
                                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
