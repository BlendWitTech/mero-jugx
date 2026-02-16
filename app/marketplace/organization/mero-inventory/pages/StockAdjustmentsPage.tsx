import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Table, Badge } from '@shared/frontend';
import { Search, Filter, History, Check, X } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';

export default function StockAdjustmentsPage() {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: adjustments = [], isLoading } = useQuery({
        queryKey: ['inventory', 'adjustments'],
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
            queryClient.invalidateQueries({ queryKey: ['inventory', 'adjustments'] });
            toast.success('Adjustment approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve adjustment');
        },
    });

    const filteredAdjustments = adjustments.filter((adj: any) =>
        adj.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adj.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'secondary';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            default: return 'outline';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <History className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Stock Adjustments</h1>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Manage inventory corrections and writes-offs
                        </p>
                    </div>
                </div>
                <Button onClick={() => toast.info('Create functionality coming soon')}>
                    Create Adjustment
                </Button>
            </div>

            <div className="flex gap-2 items-center bg-transparent">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search adjustments..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-md border" style={{ borderColor: theme.colors.border }}>
                <Table>
                    <thead style={{ backgroundColor: theme.colors.secondaryBackground }}>
                        <tr>
                            <th className="p-3 text-left font-medium text-sm">Reference</th>
                            <th className="p-3 text-left font-medium text-sm">Date</th>
                            <th className="p-3 text-left font-medium text-sm">Reason</th>
                            <th className="p-3 text-center font-medium text-sm">Status</th>
                            <th className="p-3 text-right font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredAdjustments.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-500">No adjustments found</td></tr>
                        ) : (
                            filteredAdjustments.map((adj: any) => (
                                <tr key={adj.id} className="border-t" style={{ borderColor: theme.colors.border }}>
                                    <td className="p-3 font-medium">{adj.reference_number}</td>
                                    <td className="p-3 text-sm">{new Date(adj.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm">{adj.reason}</td>
                                    <td className="p-3 text-center">
                                        <Badge variant={getStatusColor(adj.status) as any}>
                                            {adj.status}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right">
                                        {adj.status === 'DRAFT' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                onClick={() => approveMutation.mutate(adj.id)}
                                                disabled={approveMutation.isPending}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}
