import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { CreditCard, Download, FileText, Calendar, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import toast from '@shared/hooks/useToast';
import { formatCurrency, isNepalRegion } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import { format } from 'date-fns';
// Import shared components
import { Button } from '@shared';

export default function BillingPage() {
  const { isAuthenticated, accessToken, organization } = useAuthStore();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isNepal] = useState(() => isNepalRegion());
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Fetch subscription details
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const response = await api.get('/billing/subscription');
      return response.data;
    },
    enabled: !!isAuthenticated && !!accessToken,
  });

  // Fetch billing history
  const { data: billingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['billing', 'history'],
    queryFn: async () => {
      const response = await api.get('/billing/history', {
        params: { page: 1, limit: 50 },
      });
      return response.data;
    },
    enabled: !!isAuthenticated && !!accessToken,
  });

  // Fetch invoice for selected payment
  const { data: invoiceData, isLoading: invoiceLoading } = useQuery({
    queryKey: ['billing', 'invoice', selectedPaymentId],
    queryFn: async () => {
      if (!selectedPaymentId) return null;
      const response = await api.get(`/billing/invoice/${selectedPaymentId}`);
      return response.data;
    },
    enabled: !!selectedPaymentId && !!isAuthenticated && !!accessToken,
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/billing/subscription/cancel');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription auto-renewal cancelled');
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/billing/subscription/resume');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription auto-renewal resumed');
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to resume subscription');
    },
  });

  // Export invoice
  const handleExportInvoice = async (paymentId: string) => {
    try {
      const response = await api.get(`/billing/invoice/${paymentId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${paymentId}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice exported successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to export invoice');
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusColorStyle = (status: string, theme: any) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return {
          backgroundColor: `${theme.colors.success || '#10b981'}20`,
          color: theme.colors.success || '#10b981',
          border: `1px solid ${theme.colors.success || '#10b981'}40`
        };
      case 'pending':
      case 'processing':
        return {
          backgroundColor: `${theme.colors.warning || '#f59e0b'}20`,
          color: theme.colors.warning || '#f59e0b',
          border: `1px solid ${theme.colors.warning || '#f59e0b'}40`
        };
      case 'failed':
      case 'cancelled':
        return {
          backgroundColor: `${theme.colors.error || '#ef4444'}20`,
          color: theme.colors.error || '#ef4444',
          border: `1px solid ${theme.colors.error || '#ef4444'}40`
        };
      default:
        return {
          backgroundColor: `${theme.colors.border}40`,
          color: theme.colors.textSecondary,
          border: `1px solid ${theme.colors.border}`
        };
    }
  };

  if (subscriptionLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: theme.colors.background }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl shadow-xl p-6 md:p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: theme.colors.text }}>
                <CreditCard className="w-8 h-8" style={{ color: theme.colors.primary }} />
                Billing & Subscription
              </h1>
              <p style={{ color: theme.colors.textSecondary }}>
                Manage your subscription, view payment history, and download invoices
              </p>
            </div>
          </div>

          {/* Current Subscription */}
          {subscriptionData && (
            <div className="rounded-xl p-6" style={{
              background: `linear-gradient(to right, ${theme.colors.primary}15, ${theme.colors.secondary}15)`,
              border: `1px solid ${theme.colors.border}`
            }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>
                    Current Package
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      {subscriptionData.current_package?.name || 'N/A'}
                    </span>
                    <span className="text-lg" style={{ color: theme.colors.textSecondary }}>
                      {formatCurrency(
                        subscriptionData.current_package?.price || 0,
                        isNepal ? 'NPR' : 'USD'
                      )}
                    </span>
                  </div>
                </div>
                {subscriptionData.auto_renew ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2" style={{
                    backgroundColor: `${theme.colors.success || '#10b981'}20`,
                    color: theme.colors.success || '#10b981',
                    border: `1px solid ${theme.colors.success || '#10b981'}40`
                  }}>
                    <CheckCircle2 className="w-4 h-4" />
                    Auto-renewal enabled
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2" style={{
                    backgroundColor: `${theme.colors.warning || '#f59e0b'}20`,
                    color: theme.colors.warning || '#f59e0b',
                    border: `1px solid ${theme.colors.warning || '#f59e0b'}40`
                  }}>
                    <AlertCircle className="w-4 h-4" />
                    Auto-renewal disabled
                  </span>
                )}
              </div>

              {subscriptionData.package_expires_at && (
                <div className="mb-4">
                  <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                    Package expires on
                  </p>
                  <p className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                    {formatDate(subscriptionData.package_expires_at)}
                  </p>
                </div>
              )}

              {subscriptionData.latest_payment && (
                <div className="mb-4">
                  <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                    Last payment
                  </p>
                  <p className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                    {formatCurrency(
                      subscriptionData.latest_payment.amount,
                      isNepal ? 'NPR' : 'USD'
                    )}{' '}
                    on {formatDate(subscriptionData.latest_payment.date)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                {subscriptionData.auto_renew ? (
                  <Button
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                    variant="danger"
                    isLoading={cancelSubscriptionMutation.isPending}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Cancel Auto-renewal
                  </Button>
                ) : (
                  <Button
                    onClick={() => resumeSubscriptionMutation.mutate()}
                    disabled={resumeSubscriptionMutation.isPending}
                    variant="primary"
                    isLoading={resumeSubscriptionMutation.isPending}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e: any) => {
                      if (!resumeSubscriptionMutation.isPending) {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }
                    }}
                    onMouseLeave={(e: any) => {
                      if (!resumeSubscriptionMutation.isPending) {
                        e.currentTarget.style.backgroundColor = theme.colors.primary;
                      }
                    }}
                  >
                    Resume Auto-renewal
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="rounded-2xl shadow-xl p-6 md:p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: theme.colors.text }}>
            <FileText className="w-6 h-6" style={{ color: theme.colors.primary }} />
            Payment History
          </h2>

          {billingHistory?.payments && billingHistory.payments.length > 0 ? (
            <div className="space-y-4">
              {billingHistory.payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{ border: `1px solid ${theme.colors.border}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold" style={{ color: theme.colors.text }}>
                            {formatCurrency(payment.amount, payment.currency || (isNepal ? 'NPR' : 'USD'))}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={getStatusColorStyle(payment.status, theme)}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: theme.colors.textSecondary }}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(payment.created_at)}
                          </span>
                          {payment.package_name && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {payment.package_name}
                            </span>
                          )}
                        </div>
                        {payment.transaction_id && (
                          <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary, opacity: 0.7 }}>
                            Transaction: {payment.transaction_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedPaymentId(payment.id)}
                        variant="primary"
                        size="sm"
                        leftIcon={<FileText className="w-4 h-4" />}
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: '#ffffff',
                        }}
                        onMouseEnter={(e: any) => {
                          e.currentTarget.style.backgroundColor = theme.colors.secondary;
                        }}
                        onMouseLeave={(e: any) => {
                          e.currentTarget.style.backgroundColor = theme.colors.primary;
                        }}
                      >
                        View Invoice
                      </Button>
                      <Button
                        onClick={() => handleExportInvoice(payment.id)}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download className="w-4 h-4" />}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                          backgroundColor: theme.colors.surface,
                        }}
                        onMouseEnter={(e: any) => {
                          e.currentTarget.style.backgroundColor = theme.colors.background;
                        }}
                        onMouseLeave={(e: any) => {
                          e.currentTarget.style.backgroundColor = theme.colors.surface;
                        }}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary, opacity: 0.5 }} />
              <p style={{ color: theme.colors.textSecondary }}>No payment history found</p>
            </div>
          )}
        </div>

        {/* Invoice Details Modal */}
        {selectedPaymentId && invoiceData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Invoice Details
                  </h3>
                  <Button
                    onClick={() => setSelectedPaymentId(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <XCircle className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Invoice Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Invoice Number</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {invoiceData.invoice_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatDate(invoiceData.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Due Date</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatDate(invoiceData.due_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoiceData.status)}`}
                        >
                          {invoiceData.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Items
                    </h4>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Description
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceData.items?.map((item: any, index: number) => (
                            <tr
                              key={index}
                              className="border-t border-slate-200 dark:border-slate-700"
                            >
                              <td className="px-4 py-3 text-slate-900 dark:text-white">
                                {item.description}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                {formatCurrency(item.unit_price, isNepal ? 'NPR' : 'USD')}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(item.total, isNepal ? 'NPR' : 'USD')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900">
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white"
                            >
                              Subtotal
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(invoiceData.subtotal, isNepal ? 'NPR' : 'USD')}
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white"
                            >
                              Tax
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(invoiceData.tax, isNepal ? 'NPR' : 'USD')}
                            </td>
                          </tr>
                          <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right text-lg font-bold text-slate-900 dark:text-white"
                            >
                              Total
                            </td>
                            <td className="px-4 py-3 text-right text-lg font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(invoiceData.total, isNepal ? 'NPR' : 'USD')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleExportInvoice(selectedPaymentId)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Invoice
                    </button>
                    <button
                      onClick={() => setSelectedPaymentId(null)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

