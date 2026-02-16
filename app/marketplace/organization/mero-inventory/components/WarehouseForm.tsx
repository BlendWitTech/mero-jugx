import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Checkbox } from '@shared/frontend';

interface WarehouseFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    onCancel: () => void;
}

export default function WarehouseForm({ initialData, onSubmit, isLoading, onCancel }: WarehouseFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            name: '',
            location: '',
            contact_number: '',
            type: 'main',
            is_active: true
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Warehouse Name</label>
                <Input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="e.g. Main Warehouse"
                    error={errors.name?.message as string}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                    {...register('location')}
                    placeholder="e.g. Kathmandu, New Road"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <Input
                    {...register('contact_number')}
                    placeholder="e.g. +977-9800000000"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select {...register('type')}>
                    <option value="main">Main</option>
                    <option value="storefront">Storefront</option>
                    <option value="storage">Storage</option>
                    <option value="transit">Transit</option>
                </Select>
            </div>

            <div className="flex items-center">
                <Checkbox
                    id="is_active"
                    {...register('is_active')}
                />
                <label htmlFor="is_active" className="ml-2 text-sm">Active</label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (initialData ? 'Update Warehouse' : 'Create Warehouse')}
                </Button>
            </div>
        </form>
    );
}
