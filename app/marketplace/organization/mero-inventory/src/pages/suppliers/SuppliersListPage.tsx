import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';
import { Button } from '@shared/frontend/components/ui/Button';
import { Input } from '@shared/frontend/components/ui/Input';
import api from '@frontend/services/api';
import toast from '@shared/frontend/hooks/useToast';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';
import { Link } from 'react-router-dom';

interface Supplier {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
    taxId?: string;
}

export default function SuppliersListPage() {
    const { theme } = useTheme();
    const { organizationId, buildHref } = useAppContext();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['suppliers', organizationId],
        queryFn: async () => {
            const response = await api.get('/inventory/suppliers');
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/inventory/suppliers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Supplier deleted successfully');
            setSupplierToDelete(null);
        },
        onError: () => {
            toast.error('Failed to delete supplier');
        },
    });

    const filteredSuppliers = suppliers.filter((s: Supplier) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                        Suppliers
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                        Manage your suppliers and vendor information.
                    </p>
                </div>
                <Link to={buildHref('/suppliers/new')}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search suppliers..."
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
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Name/Contact</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Contact Info</th>
                                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Tax ID</th>
                                <th className="text-right p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map((supplier: Supplier) => (
                                <tr key={supplier.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }} className="hover:bg-opacity-50 transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <div className="font-medium" style={{ color: theme.colors.text }}>{supplier.name}</div>
                                            {supplier.contactPerson && (
                                                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                                    Contact: {supplier.contactPerson}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            {supplier.email && (
                                                <div className="flex items-center text-sm" style={{ color: theme.colors.textSecondary }}>
                                                    <Mail className="h-3 w-3 mr-2" />
                                                    {supplier.email}
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center text-sm" style={{ color: theme.colors.textSecondary }}>
                                                    <Phone className="h-3 w-3 mr-2" />
                                                    {supplier.phone}
                                                </div>
                                            )}
                                            {supplier.address && (
                                                <div className="flex items-center text-sm" style={{ color: theme.colors.textSecondary }}>
                                                    <MapPin className="h-3 w-3 mr-2" />
                                                    <span className="truncate max-w-[200px]">{supplier.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4" style={{ color: theme.colors.textSecondary }}>{supplier.taxId || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={buildHref(`/suppliers/${supplier.id}/edit`)}>
                                                <button
                                                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    style={{ color: theme.colors.textSecondary }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setSupplierToDelete(supplier.id)}
                                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                style={{ color: theme.colors.error }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center" style={{ color: theme.colors.textSecondary }}>
                                        No suppliers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ConfirmDialog
                isOpen={!!supplierToDelete}
                onClose={() => setSupplierToDelete(null)}
                onConfirm={() => supplierToDelete && deleteMutation.mutate(supplierToDelete)}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier? This action cannot be undone."
                variant="danger"
                theme={theme}
            />
        </div>
    );
}
