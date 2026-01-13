import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Loading,
  EmptyState,
} from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import api from '@frontend/services/api';
import toast from '@shared/hooks/useToast';
import { Mail, Check, X, Clock, User, MessageSquare, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AppInvitation {
  id: string;
  app: {
    id: number;
    name: string;
    description: string | null;
    icon_url: string | null;
    slug: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  message: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
}

export default function AppInvitationsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { organization } = useAuthStore();
  const queryClient = useQueryClient();
  const token = searchParams.get('token');

  // Fetch app invitations
  const { data: invitations, isLoading } = useQuery<AppInvitation[]>({
    queryKey: ['app-invitations', organization?.id],
    queryFn: async () => {
      const response = await api.get('/apps/invitations');
      return response.data;
    },
    enabled: !!organization?.id,
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationIdOrToken: string) => {
      // Try by ID first (new endpoint), fallback to token
      try {
        const response = await api.post(`/apps/invitations/${invitationIdOrToken}/accept`, {});
        return response.data;
      } catch (error: any) {
        // If 404, try token-based endpoint
        if (error.response?.status === 404) {
          const response = await api.post(`/apps/invitations/accept/${invitationIdOrToken}`, {});
          return response.data;
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['app-invitations', organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-accessible-apps', organization?.id] });
      toast.success('App invitation accepted! You now have access to the app.');
      // Navigate to the app if we have the slug
      if (data?.app?.slug) {
        navigate(`/org/${slug}/app/${data.app.slug}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.put(`/apps/invitations/${invitationId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-invitations', organization?.id] });
      toast.success('Invitation declined');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    },
  });

  // Handle token-based acceptance (from notification link)
  React.useEffect(() => {
    if (token && invitations && invitations.length > 0) {
      // Find invitation with matching token
      const invitation = invitations.find((inv: any) => inv.token === token && inv.status === 'pending');
      if (invitation && !isExpired(invitation.expires_at)) {
        // Auto-accept the invitation
        acceptInvitationMutation.mutate(token);
        // Remove token from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('token');
        navigate(`/org/${slug}/apps/invitations${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { replace: true });
      } else if (invitation && isExpired(invitation.expires_at)) {
        toast.error('This invitation has expired');
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('token');
        navigate(`/org/${slug}/apps/invitations${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { replace: true });
      }
    }
  }, [token, invitations, acceptInvitationMutation, searchParams, navigate, slug]);

  const pendingInvitations = invitations?.filter((inv) => inv.status === 'pending') || [];
  const otherInvitations = invitations?.filter((inv) => inv.status !== 'pending') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'declined':
        return <Badge variant="danger">Declined</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          App Invitations
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
          Manage your app access invitations
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
            Pending Invitations ({pendingInvitations.length})
          </h2>
          {pendingInvitations.map((invitation) => (
            <Card
              key={invitation.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {invitation.app.icon_url ? (
                      <img
                        src={invitation.app.icon_url}
                        alt={invitation.app.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        {invitation.app.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <CardTitle style={{ color: theme.colors.text }}>
                        {invitation.app.name}
                      </CardTitle>
                      <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                        {invitation.app.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(invitation.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                    <User className="h-4 w-4" />
                    <span>
                      Invited by{' '}
                      <span className="font-medium" style={{ color: theme.colors.text }}>
                        {invitation.inviter.first_name} {invitation.inviter.last_name}
                      </span>
                    </span>
                  </div>

                  {invitation.message && (
                    <div className="flex items-start gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                      <MessageSquare className="h-4 w-4 mt-0.5" />
                      <span>{invitation.message}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpired(invitation.expires_at) ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <>
                          Expires in {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      Invited {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {!isExpired(invitation.expires_at) && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={() => {
                          // Use token if available, otherwise use ID
                          const identifier = (invitation as any).token || invitation.id;
                          acceptInvitationMutation.mutate(identifier);
                        }}
                        disabled={acceptInvitationMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm('Are you sure you want to decline this invitation?')) {
                            declineInvitationMutation.mutate(invitation.id);
                          }
                        }}
                        disabled={declineInvitationMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Other Invitations */}
      {otherInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
            Previous Invitations ({otherInvitations.length})
          </h2>
          <div className="grid gap-4">
            {otherInvitations.map((invitation) => (
              <Card
                key={invitation.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {invitation.app.icon_url ? (
                        <img
                          src={invitation.app.icon_url}
                          alt={invitation.app.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          {invitation.app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium" style={{ color: theme.colors.text }}>
                          {invitation.app.name}
                        </p>
                        <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {invitation.status === 'accepted' && invitation.accepted_at
                            ? `Accepted ${formatDistanceToNow(new Date(invitation.accepted_at), { addSuffix: true })}`
                            : invitation.status === 'declined' && invitation.declined_at
                              ? `Declined ${formatDistanceToNow(new Date(invitation.declined_at), { addSuffix: true })}`
                              : `Invited by ${invitation.inviter.first_name} ${invitation.inviter.last_name}`}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(invitation.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingInvitations.length === 0 && otherInvitations.length === 0 && (
        <EmptyState
          icon={<Mail className="h-12 w-12" />}
          title="No App Invitations"
          description="You don't have any app invitations at the moment."
        />
      )}
    </div>
  );
}

