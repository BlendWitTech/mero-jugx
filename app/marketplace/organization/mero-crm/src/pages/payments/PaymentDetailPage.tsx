import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { paymentsApi, Payment } from '../../api/payments';
import { Card, Button, Badge } from '@shared';
import { ArrowLeft, Edit, Trash2, CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function PaymentDetailPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const { id } = useParams<{ id: string }>();
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPayment();
        }
    }, [id]);

    const fetchPayment = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await paymentsApi.getPayment(id);
            setPayment(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch payment');
            navigate(buildHref('/payments'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Are you sure you want to delete this payment?')) {
            return;
        }

        try {
            await paymentsApi.deletePayment(id);
            toast.success('Payment deleted successfully');
            navigate(buildHref('/payments'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete payment');
        }
    };

    const getStatusBadge = (status: Payment['status']) => {
        const statusConfig = {
            pending: { variant: 'secondary' as const, label: 'Pending' },
            completed: { variant: 'success' as const, label: 'Completed' },
            failed: { variant: 'danger' as const, label: 'Failed' },
            refunded: { variant: 'info' as const, label: 'Refunded' },
        };
        const config = statusConfig[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
        const labels = {
            cash: 'Cash',
            check: 'Check',
            credit_card: 'Credit Card',
            bank_transfer: 'Bank Transfer',
            other: 'Other',
        };
        return labels[method];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: theme.colors.primary }}
                    ></div>
                    <p style={{ color: theme.colors.textSecondary }}>Loading payment...</p>
                </div>
            </div>
        );
    }

    if (!payment) {
        return null;
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(buildHref('/payments'))}
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
                                Payment Details
                            </h1>
                            {getStatusBadge(payment.status)}
                        </div>
                        <p style={{ color: theme.colors.textSecondary }}>
                            Payment for Invoice {payment.invoice?.invoiceNumber}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => navigate(buildHref(`/payments/${id}/edit`))}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Payment Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Amount
                                    </p>
                                    <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                                        ${payment.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Payment Method
                                    </p>
                                    <p className="text-base" style={{ color: theme.colors.text }}>
                                        {getPaymentMethodLabel(payment.paymentMethod)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Payment Date
                                    </p>
                                    <p className="text-base" style={{ color: theme.colors.text }}>
                                        {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {payment.invoice && (
                        <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                                Related Invoice
                            </h2>
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                        Invoice Number
                                    </p>
                                    <Link
                                        to={`/invoices/${payment.invoice.id}`}
                                        className="text-lg font-medium hover:underline"
                                        style={{ color: theme.colors.primary }}
                                    >
                                        {payment.invoice.invoiceNumber}
                                    </Link>
                                    {payment.invoice.client && (
                                        <p className="mt-2" style={{ color: theme.colors.textSecondary }}>
                                            Client: {payment.invoice.client.name}
                                        </p>
                                    )}
                                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                                        Invoice Total: ${payment.invoice.total.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {payment.notes && (
                        <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                                Notes
                            </h2>
                            <p className="whitespace-pre-wrap" style={{ color: theme.colors.textSecondary }}>
                                {payment.notes}
                            </p>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
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
                                    {payment.createdBy
                                        ? `${payment.createdBy.firstName} ${payment.createdBy.lastName}`
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Created At
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {new Date(payment.createdAt).toLocaleDateString('en-US', {
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
                                    {new Date(payment.updatedAt).toLocaleDateString('en-US', {
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
