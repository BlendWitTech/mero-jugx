import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { dealsApi, Deal } from '../../api/deals';
import { Card, Button } from '@shared';
import { Plus, Briefcase, MoreHorizontal } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

// Simple Kanban Board Implementation
const STAGES = ['OPEN', 'WON', 'LOST'];

export default function DealsListPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const data = await dealsApi.getDeals();
            setDeals(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch deals');
        } finally {
            setLoading(false);
        }
    };

    const getDealsByStage = (stage: string) => {
        return deals.filter((deal) => deal.status === stage || (stage === 'OPEN' && deal.status !== 'WON' && deal.status !== 'LOST'));
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                        <Briefcase className="h-8 w-8" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
                            Deals Pipeline
                        </h1>
                        <p className="opacity-70" style={{ color: theme.colors.textSecondary }}>
                            Visualize and manage your sales process
                        </p>
                    </div>
                </div>
                <Link to={buildHref('/deals/new')}>
                    <Button variant="primary" className="shadow-lg shadow-primary/20 scale-105 active:scale-95 transition-transform px-6">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Deal
                    </Button>
                </Link>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 h-full min-w-[800px]">
                    {STAGES.map((stage) => (
                        <div key={stage} className="flex-1 flex flex-col min-w-[300px]">
                            <div className="flex items-center justify-between mb-4 p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.surface}80` }}>
                                <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>
                                    {stage}
                                </h3>
                                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800" style={{ color: theme.colors.textSecondary }}>
                                    {getDealsByStage(stage).length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-4 p-2 rounded-xl" style={{ backgroundColor: `${theme.colors.surface}40` }}>
                                {loading ? (
                                    <div className="text-center p-4">Loading...</div>
                                ) : (
                                    getDealsByStage(stage).map((deal) => (
                                        <Card
                                            key={deal.id}
                                            className="p-4 cursor-pointer hover:shadow-md transition-shadow group"
                                            style={{ backgroundColor: theme.colors.surface }}
                                            onClick={() => navigate(buildHref(`/deals/${deal.id}/edit`))}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold" style={{ color: theme.colors.text }}>
                                                    {deal.title}
                                                </h4>
                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                                                {deal.value.toLocaleString()} {deal.currency}
                                            </p>

                                            {deal.lead && (
                                                <div className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 inline-block mb-2">
                                                    {deal.lead.first_name} {deal.lead.last_name}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                                                <span style={{ color: theme.colors.textSecondary }}>
                                                    Prob: {deal.probability}%
                                                </span>
                                                <span className="font-medium" style={{ color: theme.colors.primary }}>
                                                    {deal.stage}
                                                </span>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
