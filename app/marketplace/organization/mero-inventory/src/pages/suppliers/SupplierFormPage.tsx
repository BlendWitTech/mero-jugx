import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import { Label } from '@shared/frontend/components/ui/Label';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { useAppContext } from '../../contexts/AppContext';

interface SupplierForm {
    name: string;
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
    taxId: string;
}

export default function SupplierFormPage() {
    const { theme } = useTheme();
    const { organizationId, buildHref } = useAppContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierForm>();

    const { data: supplier, isLoading } = useQuery({
        queryKey: ['supplier', id],
        queryFn: async () => {
            const response = await api.get(`/inventory/suppliers/${id}`);
            return response.data;
        },
        enabled: isEditing,
    });

    useEffect(() => {
        if (supplier) {
            reset(supplier);
        }
    }, [supplier, reset]);

    const mutation = useMutation({
        mutationFn: async (data: SupplierForm) => {
            if (isEditing) {
                await api.patch(`/inventory/suppliers/${id}`, data);
            } else {
                await api.post('/inventory/suppliers', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(`Supplier ${isEditing ? 'updated' : 'created'} successfully`);
            navigate(buildHref('/suppliers'));
        },
        onError: () => {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} supplier`);
        },
    });

    const onSubmit = (data: SupplierForm) => {
        mutation.mutate(data);
    };

    if (isEditing && isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-[1000px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                            {isEditing ? 'Edit Supplier' : 'New Supplier'}
                        </h1>
                        <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                            {isEditing ? 'Update supplier details' : 'Add a new supplier to your list'}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Supplier Name *</Label>
                            <Input
                                id="name"
                                {...register('name', { required: 'Name is required' })}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input
                                id="contactPerson"
                                {...register('contactPerson')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email', {
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                {...register('phone')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="taxId">Tax ID (PAN/VAT)</Label>
                            <Input
                                id="taxId"
                                {...register('taxId')}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                {...register('address')}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting || mutation.isPending ? 'Saving...' : 'Save Supplier'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
