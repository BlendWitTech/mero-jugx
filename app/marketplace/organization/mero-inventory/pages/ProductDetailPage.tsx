import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@shared/frontend';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import StockAdjustmentModal from '../components/StockAdjustmentModal';

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const { data: product, isLoading } = useQuery({
        queryKey: ['inventory', 'products', id],
        queryFn: async () => {
            const response = await api.get(`/inventory/products/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = React.useState(false);

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!product) return <div className="p-6">Product not found</div>;

    const totalStock = product.stocks?.reduce((acc: number, stock: any) => acc + stock.quantity, 0) || 0;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => navigate('/inventory/products')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Products
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(true)}>
                        <Package className="h-4 w-4 mr-2" />
                        Adjust Stock
                    </Button>
                    <Button onClick={() => console.log('Edit clicked')}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Product
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                                <p className="text-lg font-medium">{product.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">SKU</h3>
                                <p>{product.sku}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                                <Badge variant="secondary">{product.category || 'Uncategorized'}</Badge>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Unit</h3>
                                <p>{product.unit}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Description</h3>
                            <p className="text-gray-700">{product.description || 'No description provided.'}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Total Stock</span>
                                <span className="text-xl font-bold">{totalStock} {product.unit}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Min Stock Level</span>
                                <span>{product.min_stock_level} {product.unit}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Reorder Level</span>
                                <span>{product.reorder_level} {product.unit}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Cost Price</span>
                                <span className="font-mono">{product.cost_price}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Selling Price</span>
                                <span className="font-mono font-bold text-green-600">{product.selling_price}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Stock by Warehouse</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {product.stocks && product.stocks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Warehouse</th>
                                            <th className="px-6 py-3">Location</th>
                                            <th className="px-6 py-3 text-right">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.stocks.map((stock: any) => (
                                            <tr key={stock.id} className="bg-white border-b">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {stock.warehouse?.name || 'Unknown Warehouse'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {stock.warehouse?.location || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono">
                                                    {stock.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No stock records found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
                        <StockAdjustmentModal
                            productId={id!}
                            productName={product.name}
                            onClose={() => setIsAdjustmentModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
