import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Textarea } from '@shared/frontend';
import { useTheme } from '@frontend/contexts/ThemeContext';

interface ProductFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    onCancel: () => void;
}

export default function ProductForm({ initialData, onSubmit, isLoading, onCancel }: ProductFormProps) {
    const { theme } = useTheme();
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            sku: '',
            name: '',
            category: '',
            unit: 'pcs',
            cost_price: 0,
            selling_price: 0,
            min_stock_level: 0,
            description: '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Product Name"
                    {...register('name', { required: 'Name is required' })}
                    error={errors.name?.message as string}
                    placeholder="e.g. Wireless Mouse"
                />

                <Input
                    label="SKU"
                    {...register('sku', { required: 'SKU is required' })}
                    error={errors.sku?.message as string}
                    placeholder="e.g. WM-001"
                />

                <Input
                    label="Category"
                    {...register('category')}
                    placeholder="e.g. Electronics"
                />

                <Select
                    label="Unit"
                    {...register('unit', { required: 'Unit is required' })}
                    error={errors.unit?.message as string}
                    options={[
                        { value: 'pcs', label: 'Pieces (pcs)' },
                        { value: 'kg', label: 'Kilogram (kg)' },
                        { value: 'box', label: 'Box' },
                        { value: 'liter', label: 'Liter' },
                        { value: 'meter', label: 'Meter' },
                    ]}
                />

                <Input
                    label="Cost Price"
                    type="number"
                    step="0.01"
                    {...register('cost_price', { valueAsNumber: true, min: 0 })}
                    error={errors.cost_price?.message as string}
                />

                <Input
                    label="Selling Price"
                    type="number"
                    step="0.01"
                    {...register('selling_price', { valueAsNumber: true, min: 0 })}
                    error={errors.selling_price?.message as string}
                />

                <Input
                    label="Min Stock Level"
                    type="number"
                    {...register('min_stock_level', { valueAsNumber: true, min: 0 })}
                />
            </div>

            <Textarea
                label="Description"
                {...register('description')}
                rows={3}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'Update Product' : 'Create Product'}
                </Button>
            </div>
        </form>
    );
}
