import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@shared/frontend';
import api from '@frontend/services/api';

interface StockAdjustmentModalProps {
    productId: string;
    productName: string;
    onClose: () => void;
}

export default function StockAdjustmentModal({ productId, productName, onClose }: StockAdjustmentModalProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: {
            warehouse_id: '',
            type: 'add',
            quantity: 1,
            reason: ''
        }
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['inventory', 'warehouses'],
        queryFn: async () => {
            const response = await api.get('/inventory/warehouses');
            return response.data;
        }
    });

    const mutation = useMutation({
        mutationFn: (data: any) => api.post(`/inventory/products/${productId}/adjust-stock`, data), // Adjust endpoint needed
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'products', productId] });
            onClose();
        }
    });

    const onSubmit = (data: any) => {
        mutation.mutate({
            ...data,
            quantity: parseInt(data.quantity)
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <p className="text-sm text-gray-500 mb-4">Adjusting stock for: <strong>{productName}</strong></p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Warehouse</label>
                <Select {...register('warehouse_id', { required: 'Warehouse is required' })}>
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </Select>
                {errors.warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.warehouse_id.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Action</label>
                    <Select {...register('type')}>
                        <option value="add">Add Stock</option>
                        <option value="remove">Remove Stock</option>
                        <option value="set">Set Quantity</option>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <Input
                        type="number"
                        min="1"
                        {...register('quantity', { required: true, min: 1 })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Reason / Note</label>
                <Textarea
                    {...register('reason')}
                    placeholder="e.g. Received new shipment, Damaged goods..."
                />
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Confirm Adjustment'}
                </Button>
            </div>
        </form>
    );
}
