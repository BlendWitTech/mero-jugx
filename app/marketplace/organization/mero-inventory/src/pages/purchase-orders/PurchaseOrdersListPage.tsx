import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { useAppContext } from '../../contexts/AppContext';
import { Link } from 'react-router-dom';

interface PurchaseOrder {
    id: string;
    number: string;
    supplier: { name: string };
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    expectedDate: string;
    totalAmount: number;
}

export default function PurchaseOrdersListPage() {
    const { theme } = useTheme();
    const { organizationId, buildHref } = useAppContext();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: purchaseOrders = [], isLoading } = useQuery({
        queryKey: ['purchase-orders', organizationId],
        queryFn: async () => {
            const response = await api.get('/inventory/purchase-orders');
            return response.data;
        },
    });

    const filteredPOs = purchaseOrders.filter((po: PurchaseOrder) =>
        po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'received': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'ordered': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                        Purchase Orders
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                        Manage purchases and incoming stock.
                    </p>
                </div>
                <Link to={buildHref('/purchase-orders/new')}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Purchase Order
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search POs (Number, Supplier)..."
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
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>PO Number</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Supplier</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Status</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Expected Date</th>
                                <th className="text-right p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Amount</th>
                                <th className="text-right p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPOs.map((po: PurchaseOrder) => (
                                <tr key={po.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }} className="hover:bg-opacity-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium flex items-center gap-2" style={{ color: theme.colors.text }}>
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            {po.number}
                                        </div>
                                    </td>
                                    <td className="p-4" style={{ color: theme.colors.text }}>{po.supplier?.name || 'Unknown'}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)} capitalize`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-4 text-right" style={{ color: theme.colors.text }}>
                                        {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(po.totalAmount)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={buildHref(`/purchase-orders/${po.id}`)}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPOs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center" style={{ color: theme.colors.textSecondary }}>
                                        No purchase orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
