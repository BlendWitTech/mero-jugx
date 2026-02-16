import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Table } from '@shared/frontend';
import { ArrowLeft, Truck, CheckCircle, Package } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';

export default function SalesOrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ['inventory', 'sales-orders', id],
        queryFn: async () => {
            const response = await api.get(`/inventory/sales-orders/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => api.patch(`/inventory/sales-orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'sales-orders', id] });
            toast.success('Order status updated');
        },
    });

    const createShipmentMutation = useMutation({
        mutationFn: () => api.post('/inventory/shipments', { salesOrderId: id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'sales-orders', id] });
            toast.success('Shipment created successfully');
            // Maybe navigate to shipments or show link?
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create shipment');
        }
    });

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!order) return <div className="p-6">Order not found</div>;

    return (
        <div className="p-6 h-full flex flex-col space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('..')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Order #{order.order_number}
                        <Badge variant="outline">{order.status}</Badge>
                    </h1>
                    <p className="text-gray-500">Created on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {order.status === 'DRAFT' && (
                        <Button onClick={() => updateStatusMutation.mutate('CONFIRMED')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Order
                        </Button>
                    )}
                    {order.status === 'CONFIRMED' && (
                        <Button onClick={() => createShipmentMutation.mutate()}>
                            <Truck className="h-4 w-4 mr-2" />
                            Create Shipment
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <thead>
                                <tr>
                                    <th className="text-left py-2">Product</th>
                                    <th className="text-right py-2">Quantity</th>
                                    <th className="text-right py-2">Unit Price</th>
                                    <th className="text-right py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item: any) => (
                                    <tr key={item.id} className="border-t">
                                        <td className="py-2">
                                            <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                                            <div className="text-xs text-gray-500">{item.product?.sku}</div>
                                        </td>
                                        <td className="text-right py-2">{item.quantity}</td>
                                        <td className="text-right py-2">{item.unit_price}</td>
                                        <td className="text-right py-2 font-semibold">{(item.total_price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-gray-500 text-sm">Name:</span>
                                    <div className="font-medium">{order.customer_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-sm">Email:</span>
                                    <div className="font-medium">{order.customer_email || 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{order.total_amount}</span> {/* Simplified, usually subtotal is calculated */}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax</span>
                                    <span>{order.tax_amount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Discount</span>
                                    <span>{order.discount_amount}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{order.total_amount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
