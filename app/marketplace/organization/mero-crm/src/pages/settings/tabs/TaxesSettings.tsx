import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card, Button, Input, Label, toast } from '@shared';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { taxesApi, Tax } from '../../../api/taxes';

export default function TaxesSettings() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newTax, setNewTax] = useState({ taxName: '', taxValue: '' });

    useEffect(() => {
        fetchTaxes();
    }, []);

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const data = await taxesApi.getTaxes();
            setTaxes(data);
        } catch (error: any) {
            toast.error('Failed to fetch taxes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTax.taxName || !newTax.taxValue) {
            toast.error('Tax name and value are required');
            return;
        }

        try {
            await taxesApi.createTax({
                taxName: newTax.taxName,
                taxValue: parseFloat(newTax.taxValue),
            });
            toast.success('Tax created successfully');
            setIsAdding(false);
            setNewTax({ taxName: '', taxValue: '' });
            fetchTaxes();
        } catch (error: any) {
            toast.error('Failed to create tax');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tax?')) return;
        try {
            await taxesApi.deleteTax(id);
            toast.success('Tax deleted');
            fetchTaxes();
        } catch (error: any) {
            toast.error('Failed to delete tax');
        }
    };

    const toggleDefault = async (tax: Tax) => {
        try {
            await taxesApi.updateTax(tax.id, { isDefault: !tax.isDefault });
            fetchTaxes();
        } catch (error: any) {
            toast.error('Failed to update default state');
        }
    };

    const toggleEnabled = async (tax: Tax) => {
        try {
            await taxesApi.updateTax(tax.id, { enabled: !tax.enabled });
            fetchTaxes();
        } catch (error: any) {
            toast.error('Failed to update enabled state');
        }
    };

    if (loading) {
        return <div className="p-12 text-center opacity-50">Loading taxes...</div>;
    }

    return (
        <Card className="p-8 space-y-8 border-none shadow-xl shadow-black/5" style={{ backgroundColor: theme.colors.surface, borderRadius: '24px' }}>
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Manage Taxes</h3>
                {!isAdding && (
                    <Button variant="primary" onClick={() => setIsAdding(true)} className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Tax
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tax Name</Label>
                            <Input
                                placeholder="VAT, GST, etc."
                                value={newTax.taxName}
                                onChange={e => setNewTax({ ...newTax, taxName: e.target.value })}
                                className="bg-surface rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tax Value (%)</Label>
                            <Input
                                type="number"
                                placeholder="13"
                                value={newTax.taxValue}
                                onChange={e => setNewTax({ ...newTax, taxValue: e.target.value })}
                                className="bg-surface rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreate}>Create Tax</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {taxes.length === 0 ? (
                    <p className="text-center py-8 opacity-50">No taxes configured yet.</p>
                ) : (
                    taxes.map((tax) => (
                        <div
                            key={tax.id}
                            className="flex items-center justify-between p-5 rounded-2xl border-2 transition-all group lg:p-6"
                            style={{
                                borderColor: tax.isDefault ? theme.colors.primary : theme.colors.border,
                                backgroundColor: tax.enabled ? 'transparent' : `${theme.colors.border}50`
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <button onClick={() => toggleDefault(tax)} className="transition-transform active:scale-90">
                                    {tax.isDefault ? (
                                        <CheckCircle2 className="h-6 w-6 text-primary" style={{ color: theme.colors.primary }} />
                                    ) : (
                                        <Circle className="h-6 w-6 opacity-20 hover:opacity-100 transition-opacity" />
                                    )}
                                </button>
                                <div>
                                    <div className="font-bold text-lg" style={{ color: theme.colors.text }}>
                                        {tax.taxName} {tax.isDefault && <span className="ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>Default</span>}
                                    </div>
                                    <div className="text-sm opacity-50">{tax.taxValue}%</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm opacity-50">{tax.enabled ? 'Enabled' : 'Disabled'}</span>
                                    <button
                                        onClick={() => toggleEnabled(tax)}
                                        className="relative w-10 h-5 rounded-full transition-colors duration-200"
                                        style={{ backgroundColor: tax.enabled ? theme.colors.primary : theme.colors.border }}
                                    >
                                        <div
                                            className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200"
                                            style={{ transform: tax.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                                        />
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleDelete(tax.id)}
                                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 lg:p-3"
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
