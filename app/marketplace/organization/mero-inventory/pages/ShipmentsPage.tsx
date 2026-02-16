import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Table, Badge } from '@shared/frontend';
import { Search, Filter, Truck } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function ShipmentsPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: shipments = [], isLoading } = useQuery({
        queryKey: ['inventory', 'shipments'],
        queryFn: async () => {
            const response = await api.get('/inventory/shipments');
            return response.data;
        },
    });

    const filteredShipments = shipments.filter((shipment: any) =>
        shipment.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shipment.sales_order?.order_number && shipment.sales_order.order_number.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary';
            case 'SHIPPED': return 'primary';
            case 'DELIVERED': return 'success';
            case 'RETURNED': return 'danger';
            default: return 'outline';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Shipments</h1>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Track and manage outbound shipments
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 items-center bg-transparent">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search shipments..."
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
                            <th className="p-3 text-left font-medium text-sm">Shipment #</th>
                            <th className="p-3 text-left font-medium text-sm">Order #</th>
                            <th className="p-3 text-left font-medium text-sm">Created Date</th>
                            <th className="p-3 text-left font-medium text-sm">Shipped Date</th>
                            <th className="p-3 text-center font-medium text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredShipments.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-500">No shipments found</td></tr>
                        ) : (
                            filteredShipments.map((shipment: any) => (
                                <tr key={shipment.id} className="border-t" style={{ borderColor: theme.colors.border }}>
                                    <td className="p-3 font-medium">{shipment.shipment_number}</td>
                                    <td className="p-3 text-sm">{shipment.sales_order?.order_number || 'N/A'}</td>
                                    <td className="p-3 text-sm">{new Date(shipment.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm">
                                        {shipment.shipped_date ? new Date(shipment.shipped_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-3 text-center">
                                        <Badge variant={getStatusColor(shipment.status) as any}>
                                            {shipment.status}
                                        </Badge>
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
