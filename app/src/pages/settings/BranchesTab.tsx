import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from '@shared/hooks/useToast';
import { Building2, Plus, Users, Globe, Trash2, Shield, Search, MoreVertical, LayoutGrid, List as ListIcon, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, Card, Badge, Loading, Input } from '@shared';
import { formatLimit } from '../../utils/formatLimit';
import CreateBranchDialog from '../../components/organizations/CreateBranchDialog';

export default function BranchesTab({
    organization,
    stats,
    onSwitchOrganization,
    isSwitching
}: {
    organization: any,
    stats: any,
    onSwitchOrganization?: (id: string) => void,
    isSwitching?: boolean
}) {
    const { theme, isDark } = useTheme();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: branches, isLoading } = useQuery({
        queryKey: ['organization-branches'],
        queryFn: async () => {
            const response = await api.get('/organizations/me/branches');
            return response.data;
        },
    });

    const deleteBranchMutation = useMutation({
        mutationFn: async (branchId: string) => {
            await api.delete(`/organizations/branches/${branchId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-branches'] });
            queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
            toast.success('Branch deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete branch');
        },
    });

    const filteredBranches = branches?.filter((b: any) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className="p-6 rounded-xl border flex flex-col justify-between"
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Branch Usage</span>
                        <Building2 className="h-5 w-5" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold" style={{ color: theme.colors.text }}>{branches?.length || 0}</span>
                            <span className="text-sm" style={{ color: theme.colors.textSecondary }}>/ {formatLimit(organization.branch_limit)}</span>
                        </div>
                        <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
                            <div
                                className="h-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(((branches?.length || 0) / (organization.branch_limit || 1)) * 100, 100)}%`,
                                    backgroundColor: (branches?.length || 0) >= (organization.branch_limit || 1) ? '#ed4245' : theme.colors.primary
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    className="col-span-1 md:col-span-2 p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6"
                    style={{ backgroundColor: `${theme.colors.primary}08`, borderColor: `${theme.colors.primary}20` }}
                >
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>Expand Your Presence</h3>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Manage multiple branch locations, outlets, or regional offices from a central dashboard.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        className="whitespace-nowrap h-12 px-6 rounded-xl shadow-lg"
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={(branches?.length || 0) >= (organization.branch_limit || 1)}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Branch
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.colors.textSecondary }} />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 p-1 rounded-lg" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                        style={{
                            backgroundColor: viewMode === 'grid' ? theme.colors.background : 'transparent',
                            color: viewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary
                        }}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                        style={{
                            backgroundColor: viewMode === 'list' ? theme.colors.background : 'transparent',
                            color: viewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary
                        }}
                    >
                        <ListIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Branch List */}
            {filteredBranches.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.colors.surface }}>
                        <Building2 className="h-8 w-8" style={{ color: theme.colors.textSecondary }} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>No branches found</h3>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {searchQuery ? 'No branches match your search criteria.' : "You haven't added any branches yet."}
                        </p>
                    </div>
                    {!searchQuery && (
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                            Create your first branch
                        </Button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBranches.map((branch: any) => (
                        <Card key={branch.id} className="group overflow-hidden border-2 transition-all hover:scale-[1.02]">
                            <div className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                                            <Building2 className="h-5 w-5" style={{ color: theme.colors.primary }} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold truncate max-w-[150px]" style={{ color: theme.colors.text }}>{branch.name}</h4>
                                            <div className="flex items-center gap-1.5 text-xs" style={{ color: theme.colors.textSecondary }}>
                                                <Globe className="h-3 w-3" />
                                                <span>{branch.city || 'Location unset'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={branch.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                                        {branch.status}
                                    </Badge>
                                </div>

                                <div className="space-y-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                                    <div className="flex items-center justify-between">
                                        <span>Currency</span>
                                        <span className="font-medium" style={{ color: theme.colors.text }}>{branch.currency}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Apps</span>
                                        <span className="font-medium" style={{ color: theme.colors.text }}>{branch.active_apps_count || 0} active</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-2" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info('Branch details coming soon')}>
                                        Settings
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        disabled={isSwitching}
                                        onClick={() => onSwitchOrganization?.(branch.id)}
                                    >
                                        {isSwitching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Switch
                                    </Button>
                                    <button className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors" style={{ color: theme.colors.textSecondary }}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: theme.colors.background }}>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Branch Info</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Location</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Currency</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: theme.colors.textSecondary }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                            {filteredBranches.map((branch: any) => (
                                <tr key={branch.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: theme.colors.surface }}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}10` }}>
                                                <Building2 className="h-4 w-4" style={{ color: theme.colors.primary }} />
                                            </div>
                                            <div>
                                                <div className="font-semibold" style={{ color: theme.colors.text }}>{branch.name}</div>
                                                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>{branch.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{branch.city || '-'}, {branch.country || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{branch.currency}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={branch.status === 'active' ? 'success' : 'secondary'} size="sm">
                                            {branch.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Switch to Branch"
                                                disabled={isSwitching}
                                                onClick={() => onSwitchOrganization?.(branch.id)}
                                            >
                                                {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="outline" size="sm" title="Branch Settings">
                                                <SettingsIcon className="h-4 w-4" />
                                            </Button>
                                            <button className="p-2 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors" style={{ color: theme.colors.textSecondary }}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Modals */}
            {/* <CreateBranchDialog 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        organization={organization}
      /> */}
        </div>
    );
}
