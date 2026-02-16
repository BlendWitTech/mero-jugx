import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import { Label } from '@shared/frontend/components/ui/Label';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { useAppContext } from '../../contexts/AppContext';

interface PurchaseOrderForm {
    number: string;
    supplierId: string;
    expectedDate: string;
    notes: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
}

export default function PurchaseOrderFormPage() {
    const { theme } = useTheme();
    const { organizationId, buildHref } = useAppContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const queryClient = useQueryClient();

    const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<PurchaseOrderForm>({
        defaultValues: {
            items: [{ productId: '', quantity: 1, unitPrice: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Fetch Suppliers
    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers', organizationId],
        queryFn: async () => (await api.get('/inventory/suppliers')).data,
    });

    // Fetch Products
    const { data: products = [] } = useQuery({
        queryKey: ['products', organizationId],
        queryFn: async () => (await api.get('/inventory/products')).data,
    });

    // Fetch PO if editing
    const { data: po, isLoading } = useQuery({
        queryKey: ['purchase-order', id],
        queryFn: async () => {
            const response = await api.get(`/inventory/purchase-orders/${id}`);
            return response.data;
        },
        enabled: isEditing,
    });

    useEffect(() => {
        if (po) {
            // Transform PO data to form format if needed
            setValue('number', po.number);
            setValue('supplierId', po.supplierId);
            setValue('expectedDate', po.expectedDate ? po.expectedDate.split('T')[0] : '');
            setValue('notes', po.notes);
            setValue('items', po.items.map((i: any) => ({
                productId: i.productId,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice)
            })));
        }
    }, [po, setValue]);

    const mutation = useMutation({
        mutationFn: async (data: PurchaseOrderForm) => {
            if (isEditing) {
                await api.patch(`/inventory/purchase-orders/${id}`, data);
            } else {
                await api.post('/inventory/purchase-orders', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success(`Purchase Order ${isEditing ? 'updated' : 'created'} successfully`);
            navigate(buildHref('/purchase-orders'));
        },
        onError: () => {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} purchase order`);
        },
    });

    const onSubmit = (data: PurchaseOrderForm) => {
        mutation.mutate(data);
    };

    const items = watch('items');
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);

    if (isEditing && isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    // Disable editing if PO is not draft (simple check, backend enforces too)
    const isReadOnly = isEditing && po?.status !== 'draft';

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                            {isEditing ? `Edit PO #${po?.number}` : 'New Purchase Order'}
                        </h1>
                        <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                            {isEditing ? 'Update purchase order details' : 'Create a new purchase order'}
                        </p>
                    </div>
                </div>
                {isReadOnly && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        {po?.status.toUpperCase()} - Read Only
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="number">PO Number *</Label>
                            <Input
                                id="number"
                                {...register('number', { required: 'PO Number is required' })}
                                disabled={isReadOnly}
                                className={errors.number ? 'border-red-500' : ''}
                            />
                            {errors.number && <span className="text-xs text-red-500">{errors.number.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplierId">Supplier *</Label>
                            <select
                                id="supplierId"
                                {...register('supplierId', { required: 'Supplier is required' })}
                                disabled={isReadOnly}
                                className={`w-full p-2 rounded-md border ${theme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                style={{ color: theme.colors.text }}
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {errors.supplierId && <span className="text-xs text-red-500">{errors.supplierId.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedDate">Expected Date</Label>
                            <Input
                                id="expectedDate"
                                type="date"
                                {...register('expectedDate')}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                {...register('notes')}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium" style={{ color: theme.colors.text }}>Items</h3>
                            {!isReadOnly && (
                                <Button type="button" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                        <th className="text-left p-2 w-[40%]" style={{ color: theme.colors.textSecondary }}>Product</th>
                                        <th className="text-right p-2 w-[15%]" style={{ color: theme.colors.textSecondary }}>Quantity</th>
                                        <th className="text-right p-2 w-[20%]" style={{ color: theme.colors.textSecondary }}>Unit Price</th>
                                        <th className="text-right p-2 w-[20%]" style={{ color: theme.colors.textSecondary }}>Total</th>
                                        <th className="w-[5%]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, index) => (
                                        <tr key={field.id}>
                                            <td className="p-2">
                                                <select
                                                    {...register(`items.${index}.productId` as const, { required: true })}
                                                    disabled={isReadOnly}
                                                    className={`w-full p-2 rounded-md border ${theme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                                    style={{ color: theme.colors.text }}
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true, min: 1 })}
                                                    disabled={isReadOnly}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                                                    disabled={isReadOnly}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="p-2 text-right" style={{ color: theme.colors.text }}>
                                                {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(
                                                    (items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)
                                                )}
                                            </td>
                                            <td className="p-2 text-right">
                                                {!isReadOnly && items.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                                        <td colSpan={3} className="p-4 text-right" style={{ color: theme.colors.text }}>Total Amount:</td>
                                        <td className="p-4 text-right" style={{ color: theme.colors.text }}>
                                            {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(totalAmount)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    {!isReadOnly && (
                        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting || mutation.isPending ? 'Saving...' : 'Save Purchase Order'}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
