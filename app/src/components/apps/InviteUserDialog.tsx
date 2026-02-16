import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import toast from '@shared/hooks/useToast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@shared/frontend/components/ui/Dialog';
import { Select } from '@shared/frontend/components/ui/Select';
import { Button } from '@shared/frontend/components/ui/Button';
import { Label } from '@shared/frontend/components/ui/Label';
import { Textarea } from '@shared/frontend/components/ui/Textarea';
import { Input } from '@shared/frontend/components/ui/Input';
import { Mail, Shield, User as UserIcon, Users } from 'lucide-react';

interface InviteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appId: number;
    appName: string;
}

type InviteMode = 'member' | 'email';

export const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
    open,
    onOpenChange,
    appId,
    appName,
}) => {
    const { organization } = useAuthStore();
    const { theme } = useTheme();
    const queryClient = useQueryClient();

    const [inviteMode, setInviteMode] = useState<InviteMode>('member');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setInviteMode('member');
            setSelectedUserId('');
            setEmail('');
            setSelectedRoleId('');
            setMessage('');
        }
    }, [open]);

    // Fetch active organization members
    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ['organization-members-active'],
        queryFn: async () => {
            const response = await api.get('/users', { params: { status: 'active', limit: 100 } });
            return response.data.users || [];
        },
        enabled: open && inviteMode === 'member',
    });

    // Fetch roles for this app
    const { data: roles = [], isLoading: loadingRoles } = useQuery({
        queryKey: ['roles-by-app', appId],
        queryFn: async () => {
            const response = await api.get(`/roles/app/${appId}`);
            return response.data || [];
        },
        enabled: open && !!appId,
    });

    const inviteMutation = useMutation({
        mutationFn: async () => {
            const payload: any = {
                app_id: appId,
                role_id: selectedRoleId ? parseInt(selectedRoleId, 10) : undefined,
                message: message || undefined,
            };

            if (inviteMode === 'member') {
                payload.user_id = selectedUserId;
            } else {
                payload.email = email;
            }

            return await api.post('/apps/invitations', payload);
        },
        onSuccess: () => {
            const recipient = inviteMode === 'member' ? 'the user' : email;
            toast.success(`Invitation sent successfully to ${recipient} for ${appName}`);
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ['app-invitations'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (inviteMode === 'member' && !selectedUserId) {
            toast.error('Please select a user to invite');
            return;
        }

        if (inviteMode === 'email') {
            if (!email) {
                toast.error('Please enter an email address');
                return;
            }
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                toast.error('Please enter a valid email address');
                return;
            }
        }

        inviteMutation.mutate();
    };

    const memberOptions = members.map((member: any) => ({
        value: member.id,
        label: `${member.first_name} ${member.last_name} (${member.email})`,
    }));

    const roleOptions = roles.map((role: any) => ({
        value: role.id.toString(),
        label: role.name,
    }));

    return (
        <Dialog open={open} onOpenChange={inviteMutation.isPending ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" onClose={() => onOpenChange(false)}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Invite User to {appName}
                    </DialogTitle>
                    <DialogDescription>
                        Invite an organization member or external user to collaborate in {appName}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        {/* Invite Mode Toggle */}
                        <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: theme.colors.border }}>
                            <button
                                type="button"
                                onClick={() => setInviteMode('member')}
                                disabled={inviteMutation.isPending}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${inviteMode === 'member'
                                        ? 'bg-white shadow-sm font-medium'
                                        : 'hover:bg-white/50'
                                    }`}
                                style={{
                                    color: inviteMode === 'member' ? theme.colors.text : theme.colors.textSecondary,
                                }}
                            >
                                <Users className="h-4 w-4" />
                                Select Member
                            </button>
                            <button
                                type="button"
                                onClick={() => setInviteMode('email')}
                                disabled={inviteMutation.isPending}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${inviteMode === 'email'
                                        ? 'bg-white shadow-sm font-medium'
                                        : 'hover:bg-white/50'
                                    }`}
                                style={{
                                    color: inviteMode === 'email' ? theme.colors.text : theme.colors.textSecondary,
                                }}
                            >
                                <Mail className="h-4 w-4" />
                                Enter Email
                            </button>
                        </div>

                        {/* Member Selection or Email Input */}
                        {inviteMode === 'member' ? (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="user">Select Member</Label>
                                <Select
                                    id="user"
                                    options={memberOptions}
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    placeholder="Choose a member to invite..."
                                    disabled={loadingMembers || inviteMutation.isPending}
                                    leftIcon={<UserIcon className="h-4 w-4" />}
                                    fullWidth
                                    theme={theme}
                                />
                                <p className="text-xs opacity-70" style={{ color: theme.colors.textSecondary }}>
                                    Select from active organization members
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    disabled={inviteMutation.isPending}
                                    leftIcon={<Mail className="h-4 w-4" />}
                                    theme={theme}
                                />
                                <p className="text-xs opacity-70" style={{ color: theme.colors.textSecondary }}>
                                    Invite external users who aren't in your organization yet
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="role">App Role (Optional)</Label>
                            <Select
                                id="role"
                                options={roleOptions}
                                value={selectedRoleId}
                                onChange={(e) => setSelectedRoleId(e.target.value)}
                                placeholder="Assign a role for this app..."
                                disabled={loadingRoles || inviteMutation.isPending}
                                leftIcon={<Shield className="h-4 w-4" />}
                                fullWidth
                                theme={theme}
                            />
                            <p className="text-xs text-muted-foreground opacity-70">
                                Determines the permissions the user will have within {appName}.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="message">Invitation Message (Optional)</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add a personal note to the invitation..."
                                disabled={inviteMutation.isPending}
                                rows={3}
                                theme={theme}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={inviteMutation.isPending}
                            theme={theme}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                inviteMutation.isPending ||
                                (inviteMode === 'member' && !selectedUserId) ||
                                (inviteMode === 'email' && !email)
                            }
                            loading={inviteMutation.isPending}
                            theme={theme}
                        >
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
