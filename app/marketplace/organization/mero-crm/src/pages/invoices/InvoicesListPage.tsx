import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { invoicesApi, Invoice } from '../../api/invoices';
import { Card, Button, Input, Badge } from '@shared';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Filter } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function InvoicesListPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchInvoices();
    }, [page, searchDebounce, statusFilter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await invoicesApi.getInvoices(
                page,
                limit,
                searchDebounce || undefined,
                statusFilter || undefined
            );
            setInvoices(response.data);
            setTotal(response.total);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) {
            return;
        }

        try {
            await invoicesApi.deleteInvoice(id);
            toast.success('Invoice deleted successfully');
            fetchInvoices();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete invoice');
        }
    };

    const getStatusBadge = (status: Invoice['status']) => {
        const statusConfig = {
            draft: { variant: 'secondary' as const, label: 'Draft' },
            sent: { variant: 'info' as const, label: 'Sent' },
            paid: { variant: 'success' as const, label: 'Paid' },
            overdue: { variant: 'danger' as const, label: 'Overdue' },
            cancelled: { variant: 'secondary' as const, label: 'Cancelled' },
        };
        const config = statusConfig[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                        Invoices
                    </h1>
                    <p style={{ color: theme.colors.textSecondary }}>Manage your invoices and billing</p>
                </div>
                <Link to={buildHref('/invoices/new')}>
                    <Button variant="primary">
                        <Plus className="h-4 w-4 mr-2" />
                        New Invoice
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <Card className="p-4" style={{ backgroundColor: theme.colors.surface }}>
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                            style={{ color: theme.colors.textSecondary }}
                        />
                        <Input
                            type="text"
                            placeholder="Search invoices by number or client..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded border"
                            style={{
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border,
                                color: theme.colors.text,
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <Button variant="secondary" onClick={fetchInvoices}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Invoices Table */}
            <Card style={{ backgroundColor: theme.colors.surface }}>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                                style={{ borderColor: theme.colors.primary }}
                            ></div>
                            <p style={{ color: theme.colors.textSecondary }}>Loading invoices...</p>
                        </div>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg mb-2" style={{ color: theme.colors.text }}>
                            No invoices found
                        </p>
                        <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                            {search || statusFilter
                                ? 'Try adjusting your filters'
                                : 'Get started by creating your first invoice'}
                        </p>
                        {!search && !statusFilter && (
                            <Link to={buildHref('/invoices/new')}>
                                <Button variant="primary">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Invoice
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
                                            Invoice #
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Client
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Issue Date
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Due Date
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Total
                                        </th>
                                        <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Status
                                        </th>
                                        <th className="text-right p-4 font-semibold" style={{ color: theme.colors.text }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr
                                            key={invoice.id}
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
                                                    {invoice.invoiceNumber}
                                                </div>
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {invoice.client?.name || '-'}
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {new Date(invoice.issueDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium" style={{ color: theme.colors.text }}>
                                                    ${invoice.total.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-4">{getStatusBadge(invoice.status)}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(buildHref(`/invoices/${invoice.id}`))}
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
                                                        onClick={() => navigate(buildHref(`/invoices/${invoice.id}/edit`))}
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
                                                        onClick={() => handleDelete(invoice.id)}
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
                            <div
                                className="flex items-center justify-between p-4"
                                style={{ borderTop: `1px solid ${theme.colors.border}` }}
                            >
                                <p style={{ color: theme.colors.textSecondary }}>
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
                                    invoices
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>
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
