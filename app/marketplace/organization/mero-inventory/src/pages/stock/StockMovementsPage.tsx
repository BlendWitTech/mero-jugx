import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, History, ArrowRight } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Input } from '@shared/frontend/components/ui/Input';
import api from '@frontend/services/api';
import { useAppContext } from '../../contexts/AppContext';
import { format } from 'date-fns';

interface StockMovement {
    id: string;
    product: { name: string; sku: string };
    warehouse: { name: string };
    type: string;
    quantity: number;
    referenceType: string;
    notes?: string;
    createdAt: string;
    createdBy: { first_name: string; last_name: string };
}

export default function StockMovementsPage() {
    const { theme } = useTheme();
    const { organizationId } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: movements = [], isLoading } = useQuery({
        queryKey: ['stock-movements', organizationId],
        queryFn: async () => {
            const response = await api.get('/inventory/stock-movements');
            return response.data;
        },
    });

    const filteredMovements = movements.filter((m: StockMovement) =>
        m.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'IN': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'OUT': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            case 'ADJUSTMENT': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                        Stock Movements
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                        History of all stock changes.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search movements..."
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
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Date</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Product</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Warehouse</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Type</th>
                                <th className="text-right p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Quantity</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Reference</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovements.map((movement: StockMovement) => (
                                <tr key={movement.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }} className="hover:bg-opacity-50 transition-colors">
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                        {format(new Date(movement.createdAt), 'MMM d, yyyy HH:mm')}
                                    </td>
                                    <td className="p-4">
                                        <div style={{ color: theme.colors.text }}>{movement.product?.name}</div>
                                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>{movement.product?.sku}</div>
                                    </td>
                                    <td className="p-4" style={{ color: theme.colors.text }}>{movement.warehouse?.name}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getMovementColor(movement.type)}`}>
                                            {movement.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-medium" style={{ color: theme.colors.text }}>
                                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                    </td>
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                        {movement.referenceType}
                                    </td>
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                        {movement.createdBy?.first_name} {movement.createdBy?.last_name}
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
