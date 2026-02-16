import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, Trash2, Edit } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';

interface Warehouse {
    id: string;
    name: string;
    location: string;
    description?: string;
}

export default function WarehousesListPage() {
    const { theme } = useTheme();
    const { organizationId } = useAppContext();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Placeholder for modal logic
    const [warehouseToDelete, setWarehouseToDelete] = useState<string | null>(null);

    const { data: warehouses = [], isLoading } = useQuery({
        queryKey: ['warehouses', organizationId],
        queryFn: async () => {
            const response = await api.get('/inventory/warehouses');
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/inventory/warehouses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            toast.success('Warehouse deleted successfully');
            setWarehouseToDelete(null);
        },
        onError: () => {
            toast.error('Failed to delete warehouse');
        },
    });

    const filteredWarehouses = warehouses.filter((w: Warehouse) =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                        Warehouses
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                        Manage your storage locations.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search warehouses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.map((warehouse: Warehouse) => (
                    <Card key={warehouse.id} className="p-6 transition-all hover:shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setWarehouseToDelete(warehouse.id)}
                                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    style={{ color: theme.colors.error }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>{warehouse.name}</h3>
                        <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>{warehouse.location}</p>
                        {warehouse.description && (
                            <p className="text-sm line-clamp-2" style={{ color: theme.colors.textSecondary }}>
                                {warehouse.description}
                            </p>
                        )}
                    </Card>
                ))}
            </div>

            <ConfirmDialog
                isOpen={!!warehouseToDelete}
                onClose={() => setWarehouseToDelete(null)}
                onConfirm={() => warehouseToDelete && deleteMutation.mutate(warehouseToDelete)}
                title="Delete Warehouse"
                message="Are you sure you want to delete this warehouse? This action cannot be undone."
                variant="danger"
                theme={theme}
            />
        </div>
    );
}
