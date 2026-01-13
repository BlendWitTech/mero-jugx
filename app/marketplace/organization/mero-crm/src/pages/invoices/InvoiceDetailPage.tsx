import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { invoicesApi, Invoice } from '../../api/invoices';
import { Card, Button, Badge } from '@shared';
import { ArrowLeft, Edit, Trash2, FileText, Calendar, DollarSign } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function InvoiceDetailPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchInvoice();
        }
    }, [id]);

    const fetchInvoice = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await invoicesApi.getInvoice(id);
            setInvoice(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch invoice');
            navigate(buildHref('/invoices'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Are you sure you want to delete this invoice?')) {
            return;
        }

        try {
            await invoicesApi.deleteInvoice(id);
            toast.success('Invoice deleted successfully');
            navigate(buildHref('/invoices'));
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: theme.colors.primary }}
                    ></div>
                    <p style={{ color: theme.colors.textSecondary }}>Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return null;
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(buildHref('/invoices'))}
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
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                                Invoice {invoice.invoiceNumber}
                            </h1>
                            {getStatusBadge(invoice.status)}
                        </div>
                        <p style={{ color: theme.colors.textSecondary }}>Invoice Details</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => navigate(buildHref(`/invoices/${id}/edit`))}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Info */}
                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Client Information
                        </h2>
                        {invoice.client && (
                            <div className="space-y-2">
                                <p className="text-lg font-medium" style={{ color: theme.colors.text }}>
                                    {invoice.client.name}
                                </p>
                                <p style={{ color: theme.colors.textSecondary }}>{invoice.client.email}</p>
                                {invoice.client.company && (
                                    <p style={{ color: theme.colors.textSecondary }}>{invoice.client.company}</p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Invoice Items */}
                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Invoice Items
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
                                        <th className="text-left p-3 font-semibold" style={{ color: theme.colors.text }}>
                                            Description
                                        </th>
                                        <th className="text-right p-3 font-semibold" style={{ color: theme.colors.text }}>
                                            Quantity
                                        </th>
                                        <th className="text-right p-3 font-semibold" style={{ color: theme.colors.text }}>
                                            Unit Price
                                        </th>
                                        <th className="text-right p-3 font-semibold" style={{ color: theme.colors.text }}>
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                            <td className="p-3" style={{ color: theme.colors.text }}>
                                                {item.description}
                                            </td>
                                            <td className="p-3 text-right" style={{ color: theme.colors.textSecondary }}>
                                                {item.quantity}
                                            </td>
                                            <td className="p-3 text-right" style={{ color: theme.colors.textSecondary }}>
                                                ${item.unitPrice.toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right font-medium" style={{ color: theme.colors.text }}>
                                                ${item.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-6 space-y-2 max-w-sm ml-auto">
                            <div className="flex justify-between">
                                <span style={{ color: theme.colors.textSecondary }}>Subtotal:</span>
                                <span className="font-medium" style={{ color: theme.colors.text }}>
                                    ${invoice.subtotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: theme.colors.textSecondary }}>
                                    Tax ({invoice.taxRate}%):
                                </span>
                                <span className="font-medium" style={{ color: theme.colors.text }}>
                                    ${invoice.taxAmount.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: theme.colors.textSecondary }}>Discount:</span>
                                <span className="font-medium" style={{ color: theme.colors.text }}>
                                    -${invoice.discount.toFixed(2)}
                                </span>
                            </div>
                            <div
                                className="flex justify-between pt-2 text-lg"
                                style={{ borderTop: `2px solid ${theme.colors.border}` }}
                            >
                                <span className="font-semibold" style={{ color: theme.colors.text }}>
                                    Total:
                                </span>
                                <span className="font-bold" style={{ color: theme.colors.primary }}>
                                    ${invoice.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {invoice.notes && (
                        <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                                Notes
                            </h2>
                            <p className="whitespace-pre-wrap" style={{ color: theme.colors.textSecondary }}>
                                {invoice.notes}
                            </p>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Invoice Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Invoice Number
                                    </p>
                                    <p className="font-medium" style={{ color: theme.colors.text }}>
                                        {invoice.invoiceNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Issue Date
                                    </p>
                                    <p style={{ color: theme.colors.text }}>
                                        {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Due Date
                                    </p>
                                    <p style={{ color: theme.colors.text }}>
                                        {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Total Amount
                                    </p>
                                    <p className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                                        ${invoice.total.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Metadata
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Created By
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {invoice.createdBy
                                        ? `${invoice.createdBy.firstName} ${invoice.createdBy.lastName}`
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Created At
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Last Updated
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {new Date(invoice.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
