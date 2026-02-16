import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Table, Badge } from '@shared/frontend';
import { Plus, Search, Filter, ShoppingCart, Eye } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from '@shared/frontend/hooks/useToast';

export default function SalesOrdersPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: salesOrders = [], isLoading } = useQuery({
        queryKey: ['inventory', 'sales-orders'],
        queryFn: async () => {
            const response = await api.get('/inventory/sales-orders');
            return response.data;
        },
    });

    const filteredOrders = salesOrders.filter((order: any) =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'secondary';
            case 'CONFIRMED': return 'primary';
            case 'SHIPPED': return 'warning';
            case 'DELIVERED': return 'success';
            case 'CANCELLED': return 'danger';
            default: return 'outline';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Sales Orders</h1>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Manage customer orders and shipments
                        </p>
                    </div>
                </div>
                {/* For creation, we might navigate if it's complex, or open a modal. 
                    Let's placeholder for now or navigate to 'new' if strictly following plan. 
                    Actually plan didn't specify a separate create page, but let's assume one is needed or we use a modal.
                    I'll use a modal later if needed, but for now just the list view logic.
                */}
                <Button onClick={() => navigate('new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                </Button>
            </div>

            <div className="flex gap-2 items-center bg-transparent">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search orders..."
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
                            <th className="p-3 text-left font-medium text-sm">Order #</th>
                            <th className="p-3 text-left font-medium text-sm">Customer</th>
                            <th className="p-3 text-left font-medium text-sm">Date</th>
                            <th className="p-3 text-right font-medium text-sm">Total</th>
                            <th className="p-3 text-center font-medium text-sm">Status</th>
                            <th className="p-3 text-right font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No orders found</td></tr>
                        ) : (
                            filteredOrders.map((order: any) => (
                                <tr key={order.id} className="border-t" style={{ borderColor: theme.colors.border }}>
                                    <td className="p-3 font-medium">{order.order_number}</td>
                                    <td className="p-3 text-sm">{order.customer_name || 'N/A'}</td>
                                    <td className="p-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-right text-sm font-semibold">{order.total_amount}</td>
                                    <td className="p-3 text-center">
                                        <Badge variant={getStatusColor(order.status) as any}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button size="sm" variant="ghost" onClick={() => navigate(`${order.id}`)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
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
