import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import api from '@frontend/services/api';
import { Card, CardContent, Button, Badge } from '@shared';
import { ShieldAlert, ArrowLeft, Mail, CheckCircle, Clock } from 'lucide-react';

interface AccessDeniedPageProps {
    appSlug?: string;
    appName?: string;
}

export default function AccessDeniedPage({ appSlug: propAppSlug, appName: propAppName }: AccessDeniedPageProps) {
    const { slug, appSlug: paramAppSlug } = useParams<{ slug: string; appSlug: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { organization } = useAuthStore();

    const appSlug = propAppSlug || paramAppSlug;

    // Fetch app details
    const { data: app, isLoading: loadingApp } = useQuery({
        queryKey: ['app-details', appSlug],
        queryFn: async () => {
            const response = await api.get(`/apps/${appSlug}`);
            return response.data;
        },
        enabled: !!appSlug && !propAppName,
    });

    // Check for pending invitations
    const { data: invitations = [] } = useQuery({
        queryKey: ['app-invitations', organization?.id, appSlug],
        queryFn: async () => {
            const response = await api.get('/apps/invitations');
            return response.data.filter((inv: any) => inv.app.slug === appSlug && inv.status === 'pending');
        },
        enabled: !!organization?.id && !!appSlug,
    });

    const appDisplayName = propAppName || app?.name || 'this application';
    const hasPendingInvitation = invitations.length > 0;

    const handleRequestAccess = () => {
        // Navigate to app invitations page or show request access dialog
        navigate(`/org/${slug}/apps/invitations`);
    };

    const handleGoBack = () => {
        navigate(`/org/${slug}/apps`);
    };

    if (loadingApp && !propAppName) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
            <Card className="max-w-2xl w-full" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardContent className="p-8 md:p-12">
                    <div className="text-center space-y-6">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${theme.colors.danger}15` }}
                            >
                                <ShieldAlert className="h-10 w-10" style={{ color: theme.colors.danger }} />
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                                Access Denied
                            </h1>
                            <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
                                You don't have access to {appDisplayName}
                            </p>
                        </div>

                        {/* App Info */}
                        {app && (
                            <div className="flex items-center justify-center gap-4 py-4">
                                {app.icon_url ? (
                                    <img
                                        src={app.icon_url}
                                        alt={app.name}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    >
                                        {app.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-left">
                                    <h3 className="font-semibold text-lg" style={{ color: theme.colors.text }}>
                                        {app.name}
                                    </h3>
                                    {app.description && (
                                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                            {app.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pending Invitation Status */}
                        {hasPendingInvitation && (
                            <div
                                className="p-4 rounded-lg border"
                                style={{
                                    backgroundColor: `${theme.colors.warning}10`,
                                    borderColor: theme.colors.warning,
                                }}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="h-5 w-5" style={{ color: theme.colors.warning }} />
                                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                                        Pending Invitation
                                    </span>
                                </div>
                                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                    You have a pending invitation to access this app. Check your invitations to accept it.
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-3">
                            <p style={{ color: theme.colors.textSecondary }}>
                                {hasPendingInvitation
                                    ? 'Accept your pending invitation to gain access to this application.'
                                    : 'To access this application, you need to be invited by an administrator or organization owner.'}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                                <Mail className="h-4 w-4" />
                                <span>Contact your organization administrator to request access</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={handleGoBack}
                                className="flex items-center gap-2"
                                theme={theme}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Apps
                            </Button>
                            <Button
                                onClick={handleRequestAccess}
                                className="flex items-center gap-2"
                                theme={theme}
                            >
                                {hasPendingInvitation ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        View Invitations
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4" />
                                        Request Access
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
