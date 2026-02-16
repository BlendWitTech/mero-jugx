import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { leadsApi, Lead } from '../../api/leads';
import { Card, Button, Input } from '@shared';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, UserPlus } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function LeadsListPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchLeads();
    }, [page, searchDebounce]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const data = await leadsApi.getLeads();
            setLeads(data);
            setTotal(data.length); // API currently returns all leads, pagination might be needed later
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch leads');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead?')) {
            return;
        }

        try {
            await leadsApi.deleteLead(id);
            toast.success('Lead deleted successfully');
            fetchLeads();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete lead');
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                        <UserPlus className="h-8 w-8" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
                            Leads
                        </h1>
                        <p className="opacity-70" style={{ color: theme.colors.textSecondary }}>
                            Manage your potential customers
                        </p>
                    </div>
                </div>
                <Link to={buildHref('/leads/new')}>
                    <Button variant="primary" className="shadow-lg shadow-primary/20 scale-105 active:scale-95 transition-transform px-6">
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Lead
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
                            placeholder="Search leads..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-12 bg-transparent border-none focus:ring-2 focus:ring-primary/20 text-lg transition-all"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchLeads}
                        className="h-12 px-6 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </Card>

            {/* Leads Table */}
            <Card style={{ backgroundColor: theme.colors.surface }}>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                                style={{ borderColor: theme.colors.primary }}
                            ></div>
                            <p style={{ color: theme.colors.textSecondary }}>Loading leads...</p>
                        </div>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg mb-2" style={{ color: theme.colors.text }}>
                            No leads found
                        </p>
                        <Link to={buildHref('/leads/new')}>
                            <Button variant="primary">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Lead
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Name</th>
                                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Status</th>
                                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Company</th>
                                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Source</th>
                                    <th className="text-right p-4 font-semibold" style={{ color: theme.colors.text }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                                        className="hover:bg-opacity-50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="font-medium" style={{ color: theme.colors.text }}>
                                                {lead.first_name} {lead.last_name}
                                            </div>
                                            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                                {lead.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                            {lead.company || '-'}
                                        </td>
                                        <td className="p-4" style={{ color: theme.colors.textSecondary }}>
                                            {lead.source || '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(buildHref(`/leads/${lead.id}/edit`))}
                                                    className="p-2 rounded transition-colors hover:bg-gray-100"
                                                >
                                                    <Edit className="h-4 w-4" style={{ color: theme.colors.textSecondary }} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    className="p-2 rounded transition-colors hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" style={{ color: theme.colors.error }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
