import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, Table, Badge, Card, CardContent, CardHeader, CardTitle } from '@shared/frontend';
import { Plus, Search, Edit2, Trash2, Filter, Package } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';
import ProductForm from '../components/ProductForm';

export default function ProductsPage() {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['inventory', 'products'],
        queryFn: async () => {
            const response = await api.get('/inventory/products');
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/inventory/products', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
            setIsModalOpen(false);
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create product');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.patch(`/inventory/products/${editingProduct.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
            setIsModalOpen(false);
            setEditingProduct(null);
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update product');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/inventory/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
            setDeleteId(null);
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        }
    });

    const handleSubmit = (data: any) => {
        if (editingProduct) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const filteredProducts = products.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Products</h1>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Manage your inventory items and stock levels
                        </p>
                    </div>
                </div>
                <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <div className="flex gap-2 items-center bg-transparent">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search products..."
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
                            <th className="p-3 text-left font-medium text-sm">Product</th>
                            <th className="p-3 text-left font-medium text-sm">SKU</th>
                            <th className="p-3 text-left font-medium text-sm">Category</th>
                            <th className="p-3 text-right font-medium text-sm">Cost</th>
                            <th className="p-3 text-right font-medium text-sm">Price</th>
                            <th className="p-3 text-center font-medium text-sm">Stock</th>
                            <th className="p-3 text-right font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={7} className="p-4 text-center text-gray-500">No products found</td></tr>
                        ) : (
                            filteredProducts.map((product: any) => (
                                <tr key={product.id} className="border-t" style={{ borderColor: theme.colors.border }}>
                                    <td className="p-3">
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.unit}</div>
                                    </td>
                                    <td className="p-3 text-sm">{product.sku}</td>
                                    <td className="p-3 text-sm">
                                        {product.category && <Badge variant="secondary">{product.category}</Badge>}
                                    </td>
                                    <td className="p-3 text-right text-sm">{product.cost_price}</td>
                                    <td className="p-3 text-right text-sm font-semibold">{product.selling_price}</td>
                                    <td className="p-3 text-center">
                                        {/* Stock logic to be implemented later, assuming 0 for now or fetch from stock table */}
                                        <Badge variant={product.min_stock_level > 0 ? "outline" : "danger"}>
                                            0
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(product.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                size="lg"
            >
                <ProductForm
                    initialData={editingProduct}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
