import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { quotesApi, Quote } from '../../api/quotes';
import { Card, Button, Input, Badge } from '@shared';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function QuotesListPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const [quotes, setQuotes] = useState<Quote[]>([]);
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
        fetchQuotes();
    }, [page, searchDebounce, statusFilter]);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const response = await quotesApi.getQuotes(page, limit);
            // Search and status filter logic would ideally be backend-side, 
            // but if the API doesn't support them yet, we can filter locally for now 
            // or update the API to support them. 
            // My backend implementation for getQuotes didn't include filters in the service, 
            // let's assume it only supports basic pagination for now.
            setQuotes(response.data);
            setTotal(response.total);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch quotes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quote?')) return;
        try {
            await quotesApi.deleteQuote(id);
            toast.success('Quote deleted successfully');
            fetchQuotes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete quote');
        }
    };

    const getStatusBadge = (status: Quote['status']) => {
        const statusConfig: Record<string, { variant: any, label: string }> = {
            draft: { variant: 'secondary', label: 'Draft' },
            pending: { variant: 'warning', label: 'Pending' },
            sent: { variant: 'info', label: 'Sent' },
            accepted: { variant: 'success', label: 'Accepted' },
            declined: { variant: 'danger', label: 'Declined' },
            cancelled: { variant: 'secondary', label: 'Cancelled' },
            'on hold': { variant: 'warning', label: 'On Hold' },
        };
        const config = statusConfig[status] || { variant: 'secondary', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                        <FileSpreadsheet className="h-8 w-8" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
                            Quotes
                        </h1>
                        <p className="opacity-70" style={{ color: theme.colors.textSecondary }}>
                            Manage your proforma invoices and professional quotes
                        </p>
                    </div>
                </div>
                <Link to={buildHref('/quotes/new')}>
                    <Button variant="primary" className="shadow-lg shadow-primary/20 scale-105 active:scale-95 transition-transform px-6 h-12">
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Quote
                    </Button>
                </Link>
            </div>

            {/* Search and Filters Placeholder */}
            <Card className="p-5 border-none shadow-sm backdrop-blur-sm" style={{ backgroundColor: `${theme.colors.surface}90`, borderRadius: '16px' }}>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors group-focus-within:text-primary" style={{ color: theme.colors.textSecondary }} />
                        <Input
                            type="text"
                            placeholder="Search quotes by number or client..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-12 bg-transparent border-none focus:ring-2 focus:ring-primary/20 text-lg transition-all rounded-xl"
                        />
                    </div>
                    <Button variant="secondary" onClick={fetchQuotes} className="h-12 px-6 rounded-xl transition-colors">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </Card>

            {/* Quotes Table */}
            <Card style={{ backgroundColor: theme.colors.surface, borderRadius: '24px' }} className="overflow-hidden border-none shadow-xl shadow-black/5">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
                            <p style={{ color: theme.colors.textSecondary }}>Loading quotes...</p>
                        </div>
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="p-6 rounded-full bg-black/5 w-fit mx-auto mb-6">
                            <FileSpreadsheet className="h-12 w-12 opacity-20" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>No quotes found</h3>
                        <p className="mb-8 opacity-50 max-w-sm mx-auto">Create professional quotes and proforma invoices for your clients.</p>
                        <Link to={buildHref('/quotes/new')}>
                            <Button variant="primary" className="rounded-xl px-8">
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Quote
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}`, backgroundColor: `${theme.colors.text}05` }}>
                                        <th className="text-left p-6 font-bold uppercase tracking-wider text-xs opacity-60">Quote #</th>
                                        <th className="text-left p-6 font-bold uppercase tracking-wider text-xs opacity-60">Client</th>
                                        <th className="text-left p-6 font-bold uppercase tracking-wider text-xs opacity-60">Date</th>
                                        <th className="text-left p-6 font-bold uppercase tracking-wider text-xs opacity-60">Expiry</th>
                                        <th className="text-left p-6 font-bold uppercase tracking-wider text-xs opacity-60">Total</th>
                                        <th className="text-left p-6 font-bold uppercase tracking-wider text-xs opacity-60">Status</th>
                                        <th className="text-right p-6 font-bold uppercase tracking-wider text-xs opacity-60">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map((quote) => (
                                        <tr
                                            key={quote.id}
                                            style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                                            className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="p-6">
                                                <div className="font-bold" style={{ color: theme.colors.text }}>
                                                    #{quote.number}/{quote.year}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-medium" style={{ color: theme.colors.text }}>{quote.client?.name || 'Unknown'}</div>
                                                <div className="text-xs opacity-50">{quote.client?.email}</div>
                                            </td>
                                            <td className="p-6 opacity-70" style={{ color: theme.colors.text }}>
                                                {new Date(quote.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-6 opacity-70" style={{ color: theme.colors.text }}>
                                                {new Date(quote.expiredDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-6">
                                                <div className="font-bold text-lg" style={{ color: theme.colors.text }}>
                                                    {quote.currency || '$'}{quote.total.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-6">{getStatusBadge(quote.status)}</td>
                                            <td className="p-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => navigate(buildHref(`/quotes/${quote.id}`))}
                                                        className="p-2.5 rounded-xl hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                                        style={{ color: theme.colors.textSecondary, backgroundColor: `${theme.colors.text}10` }}
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(buildHref(`/quotes/${quote.id}/edit`))}
                                                        className="p-2.5 rounded-xl hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                                        style={{ color: theme.colors.textSecondary, backgroundColor: `${theme.colors.text}10` }}
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(quote.id)}
                                                        className="p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                        style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}
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
                            <div className="flex items-center justify-between p-6 bg-black/5 dark:bg-white/5">
                                <p className="text-sm opacity-50">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} quotes
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 1} className="rounded-xl">Previous</Button>
                                    <span className="text-sm font-bold">Page {page} of {totalPages}</span>
                                    <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="rounded-xl">Next</Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}
