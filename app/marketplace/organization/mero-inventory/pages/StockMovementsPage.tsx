import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Table, Badge } from '@shared/frontend';
import { Search, Filter, ArrowLeftRight } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';

export default function StockMovementsPage() {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: movements = [], isLoading } = useQuery({
        queryKey: ['inventory', 'stock-movements'],
        queryFn: async () => {
            const response = await api.get('/inventory/stock-movements');
            return response.data;
        },
    });

    const filteredMovements = movements.filter((movement: any) =>
        movement.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movement.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'IN': return 'success';
            case 'OUT': return 'danger';
            case 'TRANSFER': return 'warning';
            case 'ADJUSTMENT': return 'info';
            default: return 'secondary';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <ArrowLeftRight className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Stock Movements</h1>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Track inventory history and adjustments
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 items-center bg-transparent">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search movements..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-auto rounded-md border" style={{ borderColor: theme.colors.border }}>
                <Table>
                    <thead style={{ backgroundColor: theme.colors.secondaryBackground }}>
                        <tr>
                            <th className="p-3 text-left font-medium text-sm">Date</th>
                            <th className="p-3 text-left font-medium text-sm">Product</th>
                            <th className="p-3 text-left font-medium text-sm">Reference</th>
                            <th className="p-3 text-center font-medium text-sm">Type</th>
                            <th className="p-3 text-right font-medium text-sm">Quantity</th>
                            <th className="p-3 text-left font-medium text-sm">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredMovements.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No movements found</td></tr>
                        ) : (
                            filteredMovements.map((movement: any) => (
                                <tr key={movement.id} className="border-t" style={{ borderColor: theme.colors.border }}>
                                    <td className="p-3 text-sm">{new Date(movement.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium">{movement.product?.name || 'Unknown Product'}</td>
                                    <td className="p-3 text-sm">{movement.reference_number || '-'}</td>
                                    <td className="p-3 text-center">
                                        <Badge variant={getTypeColor(movement.type) as any}>
                                            {movement.type}
                                        </Badge>
                                    </td>
                                    <td className={`p-3 text-right font-medium ${movement.type === 'OUT' ? 'text-red-500' : 'text-green-500'}`}>
                                        {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}
                                    </td>
                                    <td className="p-3 text-sm text-gray-500">{movement.reason || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}
