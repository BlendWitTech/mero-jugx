import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from '@shared/hooks/useToast';
import { Building2, Mail, Phone, MapPin, Globe, Clock, Banknote, Shield, Check, X, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Checkbox
} from '@shared';

const branchSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    currency: z.string().min(1, 'Currency is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    language: z.string().min(1, 'Language is required'),
    app_ids: z.array(z.number()).default([]),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface CreateBranchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    organization: any;
}

export default function CreateBranchDialog({ isOpen, onClose, organization }: CreateBranchDialogProps) {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);

    const { data: orgApps, isLoading: isLoadingApps } = useQuery({
        queryKey: ['my-organization-apps'],
        queryFn: async () => {
            const response = await api.get('/organizations/me/apps');
            // Filter for active apps only
            return response.data.filter((app: any) => app.status === 'active');
        },
        enabled: isOpen,
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            currency: organization?.currency || 'USD',
            timezone: organization?.timezone || 'Asia/Kathmandu',
            language: organization?.language || 'en',
            app_ids: [],
        },
    });

    const selectedAppIds = watch('app_ids');

    const createBranchMutation = useMutation({
        mutationFn: async (data: BranchFormData) => {
            const payload = {
                ...data,
                email: data.email || undefined,
            };
            const response = await api.post('/organizations/branches', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-branches'] });
            queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
            toast.success('Branch created successfully');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create branch');
        },
    });

    const handleClose = () => {
        reset();
        setStep(1);
        onClose();
    };

    const toggleApp = (appId: number) => {
        if (selectedAppIds.includes(appId)) {
            setValue('app_ids', selectedAppIds.filter(id => id !== appId));
        } else {
            setValue('app_ids', [...selectedAppIds, appId]);
        }
    };

    const onSubmit = (data: BranchFormData) => {
        createBranchMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" style={{ color: theme.colors.primary }} />
                        Create New Branch
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex gap-2 mb-6">
                    <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: step >= 1 ? theme.colors.primary : theme.colors.border }} />
                    <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: step >= 2 ? theme.colors.primary : theme.colors.border }} />
                    <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: step >= 3 ? theme.colors.primary : theme.colors.border }} />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary" style={{ color: theme.colors.textSecondary }}>
                                Basic Information
                            </h3>
                            <Input
                                label="Branch Name *"
                                {...register('name')}
                                error={errors.name?.message}
                                placeholder="Central Mall Outlet"
                                fullWidth
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Branch Email (Optional)"
                                    {...register('email')}
                                    error={errors.email?.message}
                                    placeholder="central@acme.com"
                                    fullWidth
                                />
                                <Input
                                    label="Branch Phone"
                                    {...register('phone')}
                                    error={errors.phone?.message}
                                    placeholder="+977 1XXXXXX"
                                    fullWidth
                                />
                            </div>
                            <Input
                                label="Address"
                                {...register('address')}
                                error={errors.address?.message}
                                placeholder="Street Address"
                                fullWidth
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="City"
                                    {...register('city')}
                                    error={errors.city?.message}
                                    placeholder="Kathmandu"
                                    fullWidth
                                />
                                <Input
                                    label="State/Province"
                                    {...register('state')}
                                    error={errors.state?.message}
                                    placeholder="Bagmati"
                                    fullWidth
                                />
                                <Input
                                    label="Country"
                                    {...register('country')}
                                    error={errors.country?.message}
                                    placeholder="Nepal"
                                    fullWidth
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="primary" onClick={() => setStep(2)}>
                                    Next: Regional Settings
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary" style={{ color: theme.colors.textSecondary }}>
                                Regional Overrides
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Currency *</label>
                                    <select
                                        {...register('currency')}
                                        className="w-full h-10 px-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
                                    >
                                        <option value="USD">USD - Dollar</option>
                                        <option value="NPR">NPR - Rupee</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="INR">INR - Rupee (India)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Language *</label>
                                    <select
                                        {...register('language')}
                                        className="w-full h-10 px-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
                                    >
                                        <option value="en">English</option>
                                        <option value="ne">Nepali</option>
                                        <option value="hi">Hindi</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Timezone *</label>
                                <select
                                    {...register('timezone')}
                                    className="w-full h-10 px-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all"
                                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
                                >
                                    <option value="Asia/Kathmandu">(GMT+05:45) Kathmandu</option>
                                    <option value="UTC">(GMT+00:00) UTC</option>
                                    <option value="America/New_York">(GMT-05:00) New York</option>
                                    <option value="Asia/Kolkata">(GMT+05:30) Mumbai, Kolkata</option>
                                </select>
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button type="button" variant="primary" onClick={() => setStep(3)}>Next: App Access</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-1" style={{ color: theme.colors.textSecondary }}>
                                    App Access Control
                                </h3>
                                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                    Select which applications this branch is allowed to access.
                                </p>
                            </div>

                            {isLoadingApps ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.colors.primary }} />
                                </div>
                            ) : orgApps?.length === 0 ? (
                                <div className="p-8 text-center rounded-xl border flex flex-col items-center gap-2" style={{ borderColor: theme.colors.border }}>
                                    <Shield className="h-8 w-8 opacity-20" />
                                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No active apps available in your organization.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {orgApps?.map((orgApp: any) => (
                                        <div
                                            key={orgApp.app.id}
                                            onClick={() => toggleApp(orgApp.app.id)}
                                            className="p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between"
                                            style={{
                                                borderColor: selectedAppIds.includes(orgApp.app.id) ? theme.colors.primary : theme.colors.border,
                                                backgroundColor: selectedAppIds.includes(orgApp.app.id) ? `${theme.colors.primary}05` : 'transparent'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
                                                    <img src={orgApp.app.icon_url || '/app-placeholder.png'} alt={orgApp.app.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>{orgApp.app.name}</span>
                                            </div>
                                            {selectedAppIds.includes(orgApp.app.id) && (
                                                <div className="p-1 rounded-full" style={{ backgroundColor: theme.colors.primary }}>
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button type="submit" variant="primary" isLoading={createBranchMutation.isPending}>
                                    Create Branch
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
