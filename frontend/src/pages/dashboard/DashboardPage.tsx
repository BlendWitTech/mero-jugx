import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { formatLimit } from '../../utils/formatLimit';
import { Users, Building2, Mail, Shield, Package, TrendingUp, Activity, CheckCircle2, AlertCircle, Settings, Clock, Star, Plus, Ticket, MessageSquare } from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import { useMutation } from '@tanstack/react-query';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { AnnouncementModal } from '../../components/AnnouncementModal';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

export default function DashboardPage() {
  const { organization, user, isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const { isOrganizationOwner, hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const { announcement, dismissAnnouncement } = useAnnouncements();
  const { theme } = useTheme();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  
  // Only show announcements on the dashboard page (not on tickets or chat admin)
  const currentPath = location.pathname.toLowerCase();
  const isTicketsPage = currentPath.includes('/tickets') || currentPath.includes('ticket');
  const isChatAdminPage = currentPath.includes('/chat/admin') || currentPath.includes('chat/admin');
  
  // Explicitly check for dashboard routes
  const isRoot = currentPath === '/' || currentPath === '';
  const isDashboardRoute = currentPath.endsWith('/dashboard');
  const isOrgRoot = /^\/org\/[^/]+\/?$/.test(currentPath);
  const isOrgDashboard = /^\/org\/[^/]+\/dashboard\/?$/.test(currentPath);
  const isDashboard = isRoot || isDashboardRoute || isOrgRoot || isOrgDashboard;
  
  // CRITICAL: Never show on tickets or chat admin pages
  const shouldShowAnnouncement = !isTicketsPage && !isChatAdminPage && isDashboard && announcement;

  // Debug logging
  useEffect(() => {
    logger.log('[Dashboard] Auth State:', {
      _hasHydrated,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      hasUser: !!user,
      hasOrganization: !!organization,
    });
  }, [_hasHydrated, isAuthenticated, accessToken, user, organization]);

  // Fetch organization details
  const { data: orgDetails, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization-details'],
    queryFn: async () => {
      try {
        const response = await api.get('/organizations/me');
        return response.data;
      } catch (error: any) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return null;
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    retry: false,
  });

  // Fetch organization statistics - only if user has permission to view organization
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['organization-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/organizations/me/stats');
        return response.data;
      } catch (error: any) {
        // Silently handle 403 - user doesn't have permission
        if (error?.response?.status === 403) {
          return null;
        }
        if (error?.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && (isOrganizationOwner || hasPermission('organizations.view')),
    retry: false,
  });

  // Fetch current package
  const { data: packageInfo, isLoading: isLoadingPackage, refetch: refetchPackage } = useQuery({
    queryKey: ['current-package'],
    queryFn: async () => {
      try {
        const response = await api.get('/organizations/me/package');
        return response.data;
      } catch (error: any) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return null;
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Listen for package update events
  useEffect(() => {
    const handlePackageUpdate = () => {
      logger.log('[Dashboard] Package update event received, refetching package data...');
      refetchPackage();
    };
    
    window.addEventListener('package-updated', handlePackageUpdate);
    return () => {
      window.removeEventListener('package-updated', handlePackageUpdate);
    };
  }, [refetchPackage]);

  // Fetch recent users - only if user has permission to view users
  const { data: recentUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      try {
        const response = await api.get('/users', { params: { page: 1, limit: 5 } });
        return response.data?.users || [];
      } catch (error: any) {
        // Silently handle 403 - user doesn't have permission
        if (error?.response?.status === 403) {
          return [];
        }
        if (error?.response?.status === 401) {
          return [];
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && (isOrganizationOwner || hasPermission('users.view')),
    retry: false,
  });

  // Fetch recent audit logs - only if user has permission to view audit logs
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      try {
        const response = await api.get('/audit-logs', { params: { page: 1, limit: 5 } });
        return response.data?.audit_logs || [];
      } catch (error: any) {
        // Silently handle 403 - user doesn't have permission
        if (error?.response?.status === 403) {
          return [];
        }
        if (error?.response?.status === 401) {
          return [];
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && (isOrganizationOwner || hasPermission('audit.view')),
    retry: false,
  });

  const isLoading = isLoadingOrg || isLoadingStats || isLoadingPackage;

  // Marketplace: favorites and last used
  const { data: favoriteApps } = useQuery({
    queryKey: ['marketplace-favorites'],
    queryFn: marketplaceService.getFavorites,
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const { data: lastUsedApps, refetch: refetchLastUsed } = useQuery({
    queryKey: ['marketplace-last-used'],
    queryFn: marketplaceService.getLastUsed,
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const { mutate: recordUsage } = useMutation({
    mutationFn: (appId: number) => marketplaceService.recordUsage(appId),
    onSuccess: () => refetchLastUsed(),
  });

  const openApp = (appId: number) => {
    recordUsage(appId);
    navigate(`/org/${organization?.slug}/apps/${appId}`);
  };

  // Permission checks for stat cards
  const canViewUsers = isOrganizationOwner || hasPermission('users.view');
  const canViewRoles = isOrganizationOwner || hasPermission('roles.view');
  const canViewInvitations = isOrganizationOwner || hasPermission('invitations.view');
  const canViewPackages = isOrganizationOwner || hasPermission('packages.view');

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.total_users || 0,
      limit: stats?.user_limit || 0,
      usage: stats?.user_usage_percentage || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: `/org/${organization?.slug}/users`,
      permission: canViewUsers,
    },
    {
      name: 'Roles',
      value: stats?.total_roles || 0,
      limit: stats?.role_limit || 0,
      usage: stats?.role_usage_percentage || 0,
      icon: Shield,
      color: 'bg-green-500',
      link: `/org/${organization?.slug}/roles`,
      permission: canViewRoles,
    },
    {
      name: 'Pending Invitations',
      value: stats?.pending_invitations || 0,
      icon: Mail,
      color: 'bg-yellow-500',
      link: `/org/${organization?.slug}/invitations`,
      permission: canViewInvitations,
    },
    {
      name: 'Current Package',
      value: packageInfo?.package?.name || 'N/A',
      icon: Package,
      color: 'bg-purple-500',
      link: `/org/${organization?.slug}/packages`,
      permission: canViewPackages,
    },
  ];

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Show announcement modal when announcement is available and on dashboard
  // Ensure it doesn't show on tickets or chat admin pages
  useEffect(() => {
    // CRITICAL: Check path first - hide modal immediately if on tickets or chat admin
    const path = location.pathname.toLowerCase();
    const onTickets = path.includes('/tickets') || path.includes('ticket');
    const onChatAdmin = path.includes('/chat/admin') || path.includes('chat/admin');
    
    if (onTickets || onChatAdmin) {
      setShowAnnouncement(false);
      return;
    }
    
    // Also check if we're not on dashboard
    if (!isDashboard) {
      setShowAnnouncement(false);
      return;
    }
    
    // Only show if we're on dashboard and have an announcement
    if (shouldShowAnnouncement && announcement) {
      setShowAnnouncement(true);
    } else {
      setShowAnnouncement(false);
    }
  }, [shouldShowAnnouncement, isTicketsPage, isChatAdminPage, isDashboard, announcement, location.pathname]);

  const handleAnnouncementClose = () => {
    setShowAnnouncement(false);
    if (announcement) {
      // For first-time welcome, mark as permanently dismissed so it doesn't show again
      const isPermanent = announcement.isFirstTime || false;
      dismissAnnouncement(announcement.id, isPermanent);
    }
  };

  const handleAnnouncementDismiss = () => {
    setShowAnnouncement(false);
    if (announcement) {
      // Always permanently dismiss when user clicks "Don't show again"
      dismissAnnouncement(announcement.id, true);
    }
  };

  return (
    <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      {/* Announcement Modal - Only show on dashboard, not on tickets or chat admin pages */}
      {(() => {
        // Double-check path before rendering modal
        const path = location.pathname.toLowerCase();
        const onTickets = path.includes('/tickets') || path.includes('ticket');
        const onChatAdmin = path.includes('/chat/admin') || path.includes('chat/admin');
        
        if (onTickets || onChatAdmin || !isDashboard) {
          return null;
        }
        
        return showAnnouncement && announcement ? (
          <AnnouncementModal
            announcement={announcement}
            onClose={handleAnnouncementClose}
            onDismiss={announcement.isFirstTime ? undefined : handleAnnouncementDismiss}
          />
        ) : null;
      })()}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
              Welcome back, {user?.first_name}! Here's what's happening with {orgDetails?.name || organization?.name || 'your organization'}.
            </p>
          </div>
        </div>
      </div>

      {/* Organization Info Card */}
      {orgDetails && (
        <div 
          className="relative backdrop-blur-sm rounded-xl p-6 mb-6 shadow-xl overflow-hidden"
          style={{ 
            background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background}, ${theme.colors.surface})`,
            border: `1px solid ${theme.colors.border}80`
          }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 animate-pulse" style={{ background: `linear-gradient(to right, ${theme.colors.primary}08, transparent, ${theme.colors.primary}08)` }}></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg" style={{ background: `linear-gradient(to bottom right, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: theme.colors.text }}>{orgDetails.name}</h2>
                <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: theme.colors.textSecondary }}>{orgDetails.email}</p>
                {orgDetails.description && (
                  <p className="text-xs sm:text-sm mt-1 line-clamp-2" style={{ color: theme.colors.textSecondary, opacity: 0.8 }}>{orgDetails.description}</p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {orgDetails.mfa_enabled ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#23a55a]/20 to-[#23a55a]/10 text-[#23a55a] border border-[#23a55a]/30 shadow-sm">
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                  MFA Enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#faa61a]/20 to-[#faa61a]/10 text-[#faa61a] border border-[#faa61a]/30 shadow-sm">
                  <AlertCircle className="h-3 w-3 mr-1.5" />
                  MFA Disabled
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="backdrop-blur-sm rounded-xl p-6 animate-pulse shadow-lg"
              style={{ 
                backgroundColor: `${theme.colors.surface}CC`,
                border: `1px solid ${theme.colors.border}80`
              }}
            >
              <div className="h-24 rounded-lg" style={{ backgroundColor: `${theme.colors.background}80` }}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const hasPermission = stat.permission !== false;
            return (
              <div
                key={stat.name}
                className={`group relative backdrop-blur-sm rounded-xl p-6 transition-all duration-300 shadow-lg overflow-hidden ${
                  hasPermission ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'opacity-50 cursor-not-allowed blur-sm'
                }`}
                style={{ 
                  background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
                  border: `1px solid ${theme.colors.border}80`
                }}
                onMouseEnter={(e) => {
                  if (hasPermission) {
                    e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                    e.currentTarget.style.boxShadow = `0 20px 25px -5px ${theme.colors.primary}33`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasPermission) {
                    e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
              >
                {hasPermission ? (
                  <Link 
                    to={stat.link || '#'} 
                    className="block"
                  >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 transition-all duration-300" style={{ background: `linear-gradient(to bottom right, transparent, transparent)` }} onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to bottom right, ${theme.colors.primary}1A, transparent)`;
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to bottom right, transparent, transparent)`;
                }}></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium transition-colors" style={{ color: theme.colors.textSecondary }}>{stat.name}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.text }}>{stat.value}</p>
                      {stat.limit !== undefined && stat.limit > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center text-xs mb-1.5" style={{ color: theme.colors.textSecondary, opacity: 0.8 }}>
                            <span>{stat.value} / {stat.limit}</span>
                            <span className="ml-2">({stat.usage}% used)</span>
                          </div>
                          <div className="mt-1 w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: theme.colors.border }}>
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                stat.usage >= 90 
                                  ? 'bg-gradient-to-r from-[#ed4245] to-[#f04747]' 
                                  : stat.usage >= 70 
                                  ? 'bg-gradient-to-r from-[#faa61a] to-[#fbbf24]' 
                                  : 'bg-gradient-to-r from-[#23a55a] to-[#2dd4bf]'
                              } shadow-lg`}
                              style={{ width: `${Math.min(stat.usage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  </Link>
                ) : (
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`${stat.color} p-3 rounded-xl shadow-lg opacity-50`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>{stat.name}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.textSecondary }}>—</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apps quick access */}
      <div className="mt-6 sm:mt-8">
        <div 
          className="backdrop-blur-sm rounded-xl p-6 mb-4 shadow-lg"
          style={{ 
            background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
            border: `1px solid ${theme.colors.border}80`
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center" style={{ color: theme.colors.text }}>
              <Clock className="h-5 w-5 mr-2" style={{ color: theme.colors.primary }} />
              Last used apps
            </h2>
            <Link 
              to={`/org/${organization?.slug}/apps`} 
              className="text-sm transition-colors font-medium"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
            >
              View all →
            </Link>
          </div>
          {lastUsedApps && lastUsedApps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lastUsedApps.slice(0, 6).map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="group flex items-center gap-3 backdrop-blur-sm rounded-xl p-4 transition-all duration-300 text-left hover:-translate-y-0.5"
                  style={{ 
                    backgroundColor: `${theme.colors.background}CC`,
                    border: `1px solid ${theme.colors.border}80`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                    e.currentTarget.style.backgroundColor = theme.colors.background;
                    e.currentTarget.style.boxShadow = `0 10px 15px -3px ${theme.colors.primary}1A`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                    e.currentTarget.style.backgroundColor = `${theme.colors.background}CC`;
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="h-10 w-10 rounded-xl text-white flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
                    {app.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate transition-colors" style={{ color: theme.colors.text }}>{app.name}</p>
                    <p className="text-xs line-clamp-1 mt-0.5" style={{ color: theme.colors.textSecondary }}>{app.short_description || 'Resume where you left off'}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 flex-shrink-0 transition-colors" style={{ color: theme.colors.textSecondary }} />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
              <Clock className="h-4 w-4" />
              No app usage yet. Open an app to see it here.
            </div>
          )}
        </div>

        <div 
          className="backdrop-blur-sm rounded-xl p-6 shadow-lg"
          style={{ 
            background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
            border: `1px solid ${theme.colors.border}80`
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center" style={{ color: theme.colors.text }}>
              <Star className="h-5 w-5 mr-2 text-[#faa61a]" />
              Favorite apps
            </h2>
            <Link 
              to={`/org/${organization?.slug}/apps`} 
              className="text-sm transition-colors font-medium"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
            >
              Manage →
            </Link>
          </div>
          {favoriteApps && favoriteApps.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {favoriteApps.slice(0, 4).map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="group backdrop-blur-sm rounded-xl p-4 transition-all duration-300 text-left hover:-translate-y-0.5"
                  style={{ 
                    backgroundColor: `${theme.colors.background}CC`,
                    border: `1px solid ${theme.colors.border}80`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `#faa61a80`;
                    e.currentTarget.style.backgroundColor = theme.colors.background;
                    e.currentTarget.style.boxShadow = `0 10px 15px -3px #faa61a1A`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                    e.currentTarget.style.backgroundColor = `${theme.colors.background}CC`;
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="h-10 w-10 rounded-xl text-white flex items-center justify-center text-lg font-bold mb-2 shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${theme.colors.accent}, ${theme.colors.primary})` }}>
                    {app.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <p className="font-semibold truncate transition-colors" style={{ color: theme.colors.text }}>{app.name}</p>
                  <p className="text-xs line-clamp-2 mt-0.5" style={{ color: theme.colors.textSecondary }}>{app.short_description || 'Quick access'}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
              <Star className="h-4 w-4 text-[#faa61a]" />
              Pin up to 4 favorites from the Apps page.
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="rounded-lg p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center" style={{ color: theme.colors.text }}>
                <Activity className="h-5 w-5 mr-2" style={{ color: theme.colors.primary }} />
                Recent Activity
              </h2>
              <Link 
                to={`/org/${organization?.slug}/audit-logs`} 
                className="text-sm"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.secondary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.primary}
              >
                View All
              </Link>
            </div>
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                    <div className="h-16 rounded" style={{ backgroundColor: theme.colors.background }}></div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity: any) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: theme.colors.border }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.border}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: theme.colors.text }}>{activity.action}</p>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                        {activity.entity_type} • {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                <Activity className="h-12 w-12 mx-auto mb-2" style={{ color: theme.colors.textSecondary, opacity: 0.8 }} />
                <p>No recent activity</p>
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="rounded-lg p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center" style={{ color: theme.colors.text }}>
                <Users className="h-5 w-5 mr-2" style={{ color: theme.colors.primary }} />
                Recent Users
              </h2>
              <Link 
                to={`/org/${organization?.slug}/users`} 
                className="text-sm"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.secondary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.primary}
              >
                View All
              </Link>
            </div>
            {isLoadingUsers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 rounded" style={{ backgroundColor: theme.colors.background }}></div>
                  </div>
                ))}
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((userItem: any) => (
                  <div 
                    key={userItem.id} 
                    className="flex items-center p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: theme.colors.border }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.border}
                  >
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                      <span className="text-white font-medium text-sm">
                        {userItem.first_name?.[0]?.toUpperCase() || ''}{userItem.last_name?.[0]?.toUpperCase() || ''}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {userItem.first_name} {userItem.last_name}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{userItem.email}</p>
                    </div>
                    {userItem.role && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ color: theme.colors.textSecondary, backgroundColor: theme.colors.background }}>
                        {userItem.role.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                <Users className="h-12 w-12 mx-auto mb-2" style={{ color: theme.colors.textSecondary, opacity: 0.8 }} />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Package Info */}
          {packageInfo && (
            <div className="rounded-lg p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: theme.colors.text }}>
                <Package className="h-5 w-5 mr-2" style={{ color: theme.colors.primary }} />
                Package Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Current Package</p>
                  <p className="text-lg font-semibold" style={{ color: theme.colors.text }}>{packageInfo.package?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Price</p>
                  <p className="text-lg font-semibold" style={{ color: theme.colors.primary }}>
                    ${packageInfo.package?.price === 0 ? 'Free' : packageInfo.package?.price || 0}
                    {packageInfo.package?.price > 0 && <span className="text-sm" style={{ color: theme.colors.textSecondary }}>/mo</span>}
                  </p>
                </div>
                {packageInfo.current_limits && (
                  <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                    <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>Usage Limits</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                          <span>Users</span>
                          <span>{stats?.total_users || 0} / {formatLimit(packageInfo.current_limits.users)}</span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: theme.colors.border }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${Math.min(stats?.user_usage_percentage || 0, 100)}%`,
                              backgroundColor: (stats?.user_usage_percentage || 0) >= 90 ? '#ed4245' : theme.colors.primary
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                          <span>Roles</span>
                          <span>{stats?.total_roles || 0} / {formatLimit(packageInfo.current_limits.roles)}</span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: theme.colors.border }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${Math.min(stats?.role_usage_percentage || 0, 100)}%`,
                              backgroundColor: (stats?.role_usage_percentage || 0) >= 90 ? '#ed4245' : '#23a55a'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <Link 
                    to={`/org/${organization?.slug}/packages`} 
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.secondary}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Package
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-lg p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: theme.colors.text }}>
              <TrendingUp className="h-5 w-5 mr-2" style={{ color: theme.colors.primary }} />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {(isOrganizationOwner || hasPermission('invitations.create')) && (
                <Link 
                  to={`/org/${organization?.slug}/invitations`} 
                  className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
                  style={{ color: theme.colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Create Invitation</span>
                </Link>
              )}
              {(isOrganizationOwner || hasPermission('users.view')) && (
                <Link 
                  to={`/org/${organization?.slug}/users`} 
                  className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
                  style={{ color: theme.colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>View All Users</span>
                </Link>
              )}
              {(isOrganizationOwner || hasPermission('roles.view')) && (
                <Link 
                  to={`/org/${organization?.slug}/roles`} 
                  className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
                  style={{ color: theme.colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Manage Roles</span>
                </Link>
              )}
              {(isOrganizationOwner || hasPermission('tickets.view')) && (
                <Link 
                  to={`/org/${organization?.slug}/tickets`} 
                  className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
                  style={{ color: theme.colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Ticket className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>View Tickets</span>
                </Link>
              )}
              {(isOrganizationOwner || hasPermission('admin_chat.access')) && (
                <Link 
                  to={`/org/${organization?.slug}/chat/admin`} 
                  className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
                  style={{ color: theme.colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Chat with Admin</span>
                </Link>
              )}
              <Link 
                to={`/org/${organization?.slug}/settings`} 
                className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Organization Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

