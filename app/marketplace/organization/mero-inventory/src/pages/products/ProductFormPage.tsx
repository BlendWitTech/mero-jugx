import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { useAppContext } from '../../contexts/AppContext';

interface ProductFormData {
    name: string;
    sku: string;
    category?: string;
    unit: string;
    cost_price: number;
    selling_price: number;
    description?: string;
}

export default function ProductFormPage() {
    const { theme } = useTheme();
    const { buildHref } = useAppContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>();

    const { data: product } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await api.get(`/inventory/products/${id}`);
            return response.data;
        },
        enabled: isEditMode,
    });

    useEffect(() => {
        if (product) {
            reset(product);
        }
    }, [product, reset]);

    const mutation = useMutation({
        mutationFn: async (data: ProductFormData) => {
            if (isEditMode) {
                await api.patch(`/inventory/products/${id}`, data);
            } else {
                await api.post('/inventory/products', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully`);
            navigate(buildHref('/products'));
        },
        onError: () => {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} product`);
        },
    });

    const onSubmit = (data: ProductFormData) => {
        mutation.mutate({
            ...data,
            cost_price: Number(data.cost_price),
            selling_price: Number(data.selling_price),
        });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(buildHref('/products'))}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                    {isEditMode ? 'Edit Product' : 'New Product'}
                </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-6 space-y-6" style={{ backgroundColor: theme.colors.surface }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Name</label>
                            <Input
                                {...register('name', { required: 'Name is required' })}
                                error={errors.name?.message}
                                placeholder="Product Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>SKU</label>
                            <Input
                                {...register('sku', { required: 'SKU is required' })}
                                error={errors.sku?.message}
                                placeholder="Stock Keeping Unit"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Category</label>
                            <Input
                                {...register('category')}
                                placeholder="e.g. Electronics"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Unit</label>
                            <Input
                                {...register('unit', { required: 'Unit is required' })}
                                error={errors.unit?.message}
                                placeholder="e.g. pcs, kg"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Cost Price</label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('cost_price', { required: 'Cost price is required', min: 0 })}
                                error={errors.cost_price?.message}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Selling Price</label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('selling_price', { required: 'Selling price is required', min: 0 })}
                                error={errors.selling_price?.message}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="col-span-full space-y-2">
                            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Description</label>
                            <textarea
                                {...register('description')}
                                className="w-full h-32 rounded-md border p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                }}
                                placeholder="Product description..."
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate(buildHref('/products'))}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {mutation.isPending ? 'Saving...' : 'Save Product'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
