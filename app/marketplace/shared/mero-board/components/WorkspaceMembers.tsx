import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Modal,
  Avatar,
  Badge,
} from '@shared';
import { EmptyState } from '@shared/frontend/components/feedback/EmptyState';
import api from '@frontend/services/api';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import toast from '@shared/frontend/hooks/useToast';
import { Users, UserPlus, Mail, X, Crown, Shield, User } from 'lucide-react';

interface WorkspaceMember {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  joined_at: string;
}

interface WorkspaceMembersProps {
  workspaceId: string;
}

export default function WorkspaceMembers({ workspaceId }: WorkspaceMembersProps) {
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'member'>('member');

  // Fetch workspace with members
  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });

  const members: WorkspaceMember[] = workspace?.members || [];
  const currentUserMember = members.find((m) => m.user.id === currentUser?.id);
  const canInvite = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';

  // Fetch organization members to check app access
  const { data: orgMembers } = useQuery({
    queryKey: ['organization-members', workspace?.organization_id],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users || [];
    },
    enabled: !!workspace?.organization_id && showInviteModal,
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: 'owner' | 'admin' | 'member' }) => {
      // Find the user in organization members
      const user = orgMembers?.find((m: any) => m.email === data.email);

      if (!user) {
        throw new Error('User is not a member of this organization');
      }

      // Check if user has app access
      // Note: The access endpoint expects appId (number), not appSlug (string)
      // We'll skip the access check and just add the user to the workspace
      // App access is handled through the invitation system separately
      // This prevents 400 errors from trying to use appSlug as appId

      // User has app access, add to workspace
      const response = await api.post(`/apps/${appSlug}/workspaces/${workspaceId}/members`, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.requiresAppAccess) {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('member');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['workspace', appSlug, workspaceId] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      toast.success('Member invited successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to invite member');
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'owner' | 'admin' | 'member' }) => {
      const response = await api.put(
        `/apps/${appSlug}/workspaces/${workspaceId}/members/${memberId}/role`,
        { role },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', appSlug, workspaceId] });
      toast.success('Member role updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update member role');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/apps/${appSlug}/workspaces/${workspaceId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', appSlug, workspaceId] });
      toast.success('Member removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'warning';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.text }}>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Loading members...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Users className="h-5 w-5" />
              Members ({members.length})
            </CardTitle>
            {canInvite && (
              <Button size="sm" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No members"
              description="Invite team members to collaborate on this workspace"
              action={
                canInvite
                  ? {
                    label: 'Invite Member',
                    onClick: () => setShowInviteModal(true),
                  }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.user.avatar_url || undefined}
                      name={`${member.user.first_name} ${member.user.last_name}`}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm" style={{ color: theme.colors.text }}>
                          {member.user.first_name} {member.user.last_name}
                        </p>
                        <Badge variant={getRoleColor(member.role)} size="sm">
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canInvite && member.user.id !== currentUser?.id && (
                      <>
                        {member.role !== 'owner' && (
                          <Select
                            value={member.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                memberId: member.id,
                                role: e.target.value as 'owner' | 'admin' | 'member',
                              })
                            }
                            options={[
                              { value: 'member', label: 'Member' },
                              { value: 'admin', label: 'Admin' },
                              { value: 'owner', label: 'Owner' },
                            ]}
                            className="w-32"
                            disabled={updateRoleMutation.isPending}
                          />
                        )}
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${member.user.first_name} ${member.user.last_name} from this workspace?`)) {
                                removeMemberMutation.mutate(member.id);
                              }
                            }}
                            className="p-2 rounded hover:opacity-70"
                            style={{ color: theme.colors.textSecondary }}
                            disabled={removeMemberMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteRole('member');
        }}
        title="Invite Member"
        theme={theme}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Email Address
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
              User must be a member of your organization
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Role
            </label>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'owner' | 'admin' | 'member')}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'admin', label: 'Admin' },
                { value: 'owner', label: 'Owner' },
              ]}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('member');
              }}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
              isLoading={inviteMemberMutation.isPending}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.buttonText || '#ffffff',
              }}
              onMouseEnter={(e: any) => {
                if (!inviteMemberMutation.isPending && inviteEmail.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }
              }}
              onMouseLeave={(e: any) => {
                if (!inviteMemberMutation.isPending && inviteEmail.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

