import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { clientsApi, Client } from '../../api/clients';
import { Card, Button, Input } from '@shared';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Users as UsersIcon } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function ClientsListPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const [clients, setClients] = useState<Client[]>([]);
    // ... rest of state ...
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchClients();
    }, [page, searchDebounce]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientsApi.getClients(page, limit, searchDebounce || undefined);
            setClients(response.data);
            setTotal(response.total);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) {
            return;
        }

        try {
            await clientsApi.deleteClient(id);
            toast.success('Client deleted successfully');
            fetchClients();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete client');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                        <UsersIcon className="h-8 w-8" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
                            Clients
                        </h1>
                        <p className="opacity-70" style={{ color: theme.colors.textSecondary }}>
                            Manage and organize your client relationships
                        </p>
                    </div>
                </div>
                <Link to={buildHref('/clients/new')}>
                    <Button variant="primary" className="shadow-lg shadow-primary/20 scale-105 active:scale-95 transition-transform px-6">
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Client
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <Card className="p-5 border-none shadow-sm backdrop-blur-sm" style={{ backgroundColor: `${theme.colors.surface}90`, borderRadius: '16px' }}>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Search
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors group-focus-within:text-primary"
                            style={{ color: theme.colors.textSecondary }}
                        />
                        <Input
                            type="text"
                            placeholder="Search by name, email, or company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-12 bg-transparent border-none focus:ring-2 focus:ring-primary/20 text-lg transition-all"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchClients}
                        className="h-12 px-6 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </Card>

            {/* Clients Table */}
            <Card style={{ backgroundColor: theme.colors.surface }}>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                                style={{ borderColor: theme.colors.primary }}
                            ></div>
                            <p style={{ color: theme.colors.textSecondary }}>Loading clients...</p>
                        </div>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg mb-2" style={{ color: theme.colors.text }}>
                            No clients found
                        </p>
                        <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                            {search ? 'Try adjusting your search' : 'Get started by creating your first client'}
                        </p>
                        {!search && (
                            <Link to={buildHref('/clients/new')}>
                                <Button variant="primary">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Client
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Name
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Email
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Phone
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Company
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Assigned To
                                        </th>
                                        <th className="text-right p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => (
                                        <tr
                                            key={client.id}
                                            style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                                            className="hover:bg-opacity-50 transition-colors"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = theme.colors.border;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <td className="p-4">
                                                <div className="font-medium" style={{ color: theme.colors.text }}>
                                                    {client.name}
                                                </div>
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {client.email}
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {client.phone || '-'}
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {client.company || '-'}
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {client.assignedTo
                                                    ? `${client.assignedTo.firstName} ${client.assignedTo.lastName}`
                                                    : '-'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(buildHref(`/clients/${client.id}`))}
                                                        className="p-2 rounded transition-colors"
                                                        style={{ color: theme.colors.textSecondary }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = theme.colors.border;
                                                            e.currentTarget.style.color = theme.colors.text;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = theme.colors.textSecondary;
                                                        }}
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(buildHref(`/clients/${client.id}/edit`))}
                                                        className="p-2 rounded transition-colors"
                                                        style={{ color: theme.colors.textSecondary }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = theme.colors.border;
                                                            e.currentTarget.style.color = theme.colors.text;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = theme.colors.textSecondary;
                                                        }}
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="p-2 rounded transition-colors"
                                                        style={{ color: theme.colors.textSecondary }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#fee2e2';
                                                            e.currentTarget.style.color = '#dc2626';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = theme.colors.textSecondary;
                                                        }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                                <p style={{ color: theme.colors.textSecondary }}>
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} clients
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span style={{ color: theme.colors.text }}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}
