import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, Table, Badge } from '@shared/frontend';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, Warehouse } from 'lucide-react';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';
import WarehouseForm from '../components/WarehouseForm';

export default function WarehousesPage() {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: warehouses = [], isLoading } = useQuery({
        queryKey: ['inventory', 'warehouses'],
        queryFn: async () => {
            const response = await api.get('/inventory/warehouses');
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/inventory/warehouses', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
            setIsModalOpen(false);
            toast.success('Warehouse created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create warehouse');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.patch(`/inventory/warehouses/${editingWarehouse.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
            setIsModalOpen(false);
            setEditingWarehouse(null);
            toast.success('Warehouse updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update warehouse');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/inventory/warehouses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
            setDeleteId(null);
            toast.success('Warehouse deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete warehouse');
        }
    });

    const handleSubmit = (data: any) => {
        if (editingWarehouse) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (warehouse: any) => {
        setEditingWarehouse(warehouse);
        setIsModalOpen(true);
    };

    const filteredWarehouses = warehouses.filter((w: any) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.location && w.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <Warehouse className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Warehouses</h1>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Manage your storage locations
                        </p>
                    </div>
                </div>
                <Button onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                </Button>
            </div>

            <div className="flex gap-2 items-center bg-transparent">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search warehouses..."
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
                            <th className="p-3 text-left font-medium text-sm">Name</th>
                            <th className="p-3 text-left font-medium text-sm">Location</th>
                            <th className="p-3 text-left font-medium text-sm">Contact</th>
                            <th className="p-3 text-left font-medium text-sm">Type</th>
                            <th className="p-3 text-center font-medium text-sm">Status</th>
                            <th className="p-3 text-right font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredWarehouses.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No warehouses found</td></tr>
                        ) : (
                            filteredWarehouses.map((warehouse: any) => (
                                <tr key={warehouse.id} className="border-t" style={{ borderColor: theme.colors.border }}>
                                    <td className="p-3 font-medium">{warehouse.name}</td>
                                    <td className="p-3 text-sm">
                                        {warehouse.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-gray-500" />
                                                {warehouse.location}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm">
                                        {warehouse.contact_number && (
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-gray-500" />
                                                {warehouse.contact_number}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm capitalize">{warehouse.type}</td>
                                    <td className="p-3 text-center">
                                        <Badge variant={warehouse.is_active ? "success" : "secondary"}>
                                            {warehouse.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(warehouse)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(warehouse.id)}>
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
                title={editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            >
                <WarehouseForm
                    initialData={editingWarehouse}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete Warehouse"
                message="Are you sure you want to delete this warehouse? It cannot be deleted if it contains stock."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
