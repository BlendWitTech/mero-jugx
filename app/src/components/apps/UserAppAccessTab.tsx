import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button, Badge, Loading } from '@shared';
import { Select } from '@shared/frontend/components/ui/Select';
import { UserPlus, UserMinus, Shield, ShieldAlert, Mail } from 'lucide-react';
import { InviteUserDialog } from './InviteUserDialog';
import toast from '@shared/hooks/useToast';

interface UserAppAccessTabProps {
    appId: number;
    appName: string;
}

export const UserAppAccessTab: React.FC<UserAppAccessTabProps> = ({ appId, appName }) => {
    const { organization } = useAuthStore();
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Fetch users with access to this app
    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['app-access-users', appId],
        queryFn: async () => {
            if (!organization?.id) return [];
            const response = await api.get(`/organizations/${organization.id}/apps/${appId}/access`);
            return response.data || [];
        },
        enabled: !!organization?.id && !!appId,
    });

    // Fetch roles for this app
    const { data: roles = [] } = useQuery({
        queryKey: ['roles-by-app', appId],
        queryFn: async () => {
            const response = await api.get(`/roles/app/${appId}`);
            return response.data || [];
        },
        enabled: !!appId,
    });

    const revokeMutation = useMutation({
        mutationFn: async (userId: string) => {
            return await api.post(`/organizations/${organization?.id}/apps/${appId}/access/revoke`, {
                user_id: userId,
                app_id: appId,
            });
        },
        onSuccess: () => {
            toast.success('Access revoked successfully');
            queryClient.invalidateQueries({ queryKey: ['app-access-users', appId] });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
            return await api.put(`/organizations/${organization?.id}/apps/${appId}/access/${userId}/role`, {
                role_id: roleId,
            });
        },
        onSuccess: () => {
            toast.success('User role updated successfully');
            queryClient.invalidateQueries({ queryKey: ['app-access-users', appId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update user role');
        },
    });

    const handleRevoke = (userId: string) => {
        if (window.confirm(`Are you sure you want to revoke access for this user from ${appName}?`)) {
            revokeMutation.mutate(userId);
        }
    };

    const handleRoleChange = (userId: string, roleId: string) => {
        updateRoleMutation.mutate({ userId, roleId: parseInt(roleId, 10) });
    };

    if (isLoading) {
        return (
            <Card className="p-8 flex flex-col items-center justify-center space-y-4" style={{ backgroundColor: theme.colors.surface }}>
                <Loading size="lg" />
                <p style={{ color: theme.colors.textSecondary }}>Loading app users...</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-8 text-center" style={{ backgroundColor: theme.colors.surface }}>
                <p className="text-red-500">Failed to load users for this app.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>{appName} Users</h3>
                    <p className="text-sm opacity-70" style={{ color: theme.colors.textSecondary }}>
                        Manage who has access to this application and their roles.
                    </p>
                </div>
                <Button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Invite User
                </Button>
            </div>

            <Card className="overflow-hidden border-none shadow-xl shadow-black/5" style={{ backgroundColor: theme.colors.surface, borderRadius: '24px' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>User</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Role</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Access Granted</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: theme.colors.textSecondary }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center opacity-50" style={{ color: theme.colors.textSecondary }}>
                                        No users have been granted access to this app yet.
                                    </td>
                                </tr>
                            ) : (
                                users.map((access: any) => (
                                    <tr key={access.user_id} className="hover:bg-black/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                                                    <span className="font-bold" style={{ color: theme.colors.primary }}>
                                                        {access.user?.first_name?.[0]}{access.user?.last_name?.[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: theme.colors.text }}>
                                                        {access.user?.first_name} {access.user?.last_name}
                                                    </p>
                                                    <p className="text-xs opacity-70 flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                                                        <Mail className="h-3 w-3" />
                                                        {access.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select
                                                options={roles.map((role: any) => ({
                                                    value: role.id.toString(),
                                                    label: role.name,
                                                }))}
                                                value={access.role_id?.toString() || ''}
                                                onChange={(e) => handleRoleChange(access.user_id, e.target.value)}
                                                disabled={updateRoleMutation.isPending}
                                                leftIcon={<Shield className="h-3 w-3" />}
                                                theme={theme}
                                                className="min-w-[160px]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm opacity-70" style={{ color: theme.colors.textSecondary }}>
                                            {access.created_at ? new Date(access.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevoke(access.user_id)}
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                                title="Revoke Access"
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <InviteUserDialog
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
                appId={appId}
                appName={appName}
            />
        </div>
    );
};
