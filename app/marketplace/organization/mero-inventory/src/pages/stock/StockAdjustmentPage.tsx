import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, Search } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { useAppContext } from '../../contexts/AppContext';

interface Adjustment {
    id: string;
    adjustmentNumber: string;
    warehouse: { name: string };
    status: string;
    adjustmentDate: string;
    reason: string;
}

export default function StockAdjustmentPage() {
    const { theme } = useTheme();
    const { organizationId, buildHref } = useAppContext();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: adjustments = [], isLoading } = useQuery({
        queryKey: ['adjustments', organizationId],
        queryFn: async () => {
            const response = await api.get('/inventory/adjustments');
            return response.data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/inventory/adjustments/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adjustments'] });
            toast.success('Adjustment approved successfully');
        },
        onError: () => {
            toast.error('Failed to approve adjustment');
        },
    });

    const filteredAdjustments = adjustments.filter((a: Adjustment) =>
        a.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                        Stock Adjustments
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                        Reconcile physical stock with system stock.
                    </p>
                </div>
                {/* Link to Create Adjustment Page (to be implemented) */}
                <Button disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    New Adjustment
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search adjustments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Card style={{ backgroundColor: theme.colors.surface }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Number</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Date</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Warehouse</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Reason</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Status</th>
                                <th className="text-right p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdjustments.map((adjustment: Adjustment) => (
                                <tr key={adjustment.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }} className="hover:bg-opacity-50 transition-colors">
                                    <td className="p-4 font-medium" style={{ color: theme.colors.text }}>{adjustment.adjustmentNumber}</td>
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>{adjustment.adjustmentDate}</td>
                                    <td className="p-4" style={{ color: theme.colors.text }}>{adjustment.warehouse?.name}</td>
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>{adjustment.reason}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adjustment.status === 'APPROVED'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {adjustment.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {adjustment.status === 'DRAFT' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => approveMutation.mutate(adjustment.id)}
                                                disabled={approveMutation.isPending}
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
