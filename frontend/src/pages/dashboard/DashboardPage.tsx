import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatLimit } from '../../utils/formatLimit';
import { Users, Building2, Mail, Shield, Package, TrendingUp, Activity, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

export default function DashboardPage() {
  const { organization, user, isAuthenticated, accessToken, _hasHydrated } = useAuthStore();

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Auth State:', {
        _hasHydrated,
        isAuthenticated,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        hasUser: !!user,
        hasOrganization: !!organization,
      });
    }
  }, [_hasHydrated, isAuthenticated, accessToken, user, organization]);

  // Fetch organization details
  const { data: orgDetails, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization-details'],
    queryFn: async () => {
      const response = await api.get('/organizations/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch organization statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['organization-stats'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/stats');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch current package
  const { data: packageInfo, isLoading: isLoadingPackage, refetch: refetchPackage } = useQuery({
    queryKey: ['current-package'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/package');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    refetchOnWindowFocus: true,
  });

  // Listen for package update events
  useEffect(() => {
    const handlePackageUpdate = () => {
      console.log('[Dashboard] Package update event received, refetching package data...');
      refetchPackage();
    };
    
    window.addEventListener('package-updated', handlePackageUpdate);
    return () => {
      window.removeEventListener('package-updated', handlePackageUpdate);
    };
  }, [refetchPackage]);

  // Fetch recent users
  const { data: recentUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { page: 1, limit: 5 } });
      return response.data?.users || [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch recent audit logs
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      try {
        const response = await api.get('/audit-logs', { params: { page: 1, limit: 5 } });
        return response.data?.audit_logs || [];
      } catch (error) {
        // If user doesn't have permission, return empty array
        return [];
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const isLoading = isLoadingOrg || isLoadingStats || isLoadingPackage;

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.total_users || 0,
      limit: stats?.user_limit || 0,
      usage: stats?.user_usage_percentage || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/users',
    },
    {
      name: 'Roles',
      value: stats?.total_roles || 0,
      limit: stats?.role_limit || 0,
      usage: stats?.role_usage_percentage || 0,
      icon: Shield,
      color: 'bg-green-500',
      link: '/roles',
    },
    {
      name: 'Pending Invitations',
      value: stats?.pending_invitations || 0,
      icon: Mail,
      color: 'bg-yellow-500',
      link: '/invitations',
    },
    {
      name: 'Current Package',
      value: packageInfo?.package?.name || 'N/A',
      icon: Package,
      color: 'bg-purple-500',
      link: '/packages',
    },
  ];

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5865f2] rounded-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">
              Welcome back, {user?.first_name}! Here's what's happening with {orgDetails?.name || organization?.name || 'your organization'}.
            </p>
          </div>
        </div>
      </div>

      {/* Organization Info Card */}
      {orgDetails && (
        <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225] mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="h-12 w-12 rounded-full bg-[#5865f2] flex items-center justify-center mr-4 flex-shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{orgDetails.name}</h2>
                <p className="text-xs sm:text-sm text-[#b9bbbe] mt-1 truncate">{orgDetails.email}</p>
                {orgDetails.description && (
                  <p className="text-xs sm:text-sm text-[#8e9297] mt-1 line-clamp-2">{orgDetails.description}</p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {orgDetails.mfa_enabled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#23a55a]/20 text-[#23a55a]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  MFA Enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#faa61a]/20 text-[#faa61a]">
                  <AlertCircle className="h-3 w-3 mr-1" />
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
            <div key={i} className="bg-[#2f3136] rounded-lg p-6 border border-[#202225] animate-pulse">
              <div className="h-24 bg-[#36393f] rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.name} to={stat.link || '#'} className="bg-[#2f3136] rounded-lg p-6 border border-[#202225] hover:border-[#5865f2] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#b9bbbe]">{stat.name}</p>
                      <p className="text-2xl font-semibold text-white">{stat.value}</p>
                      {stat.limit !== undefined && stat.limit > 0 && (
                        <div className="mt-1">
                          <div className="flex items-center text-xs text-[#8e9297]">
                            <span>{stat.value} / {stat.limit}</span>
                            <span className="ml-2">({stat.usage}% used)</span>
                          </div>
                          <div className="mt-1 w-full bg-[#202225] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                stat.usage >= 90 ? 'bg-[#ed4245]' : stat.usage >= 70 ? 'bg-[#faa61a]' : 'bg-[#23a55a]'
                              }`}
                              style={{ width: `${Math.min(stat.usage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-[#5865f2]" />
                Recent Activity
              </h2>
              <Link to="/audit-logs" className="text-sm text-[#5865f2] hover:text-[#4752c4]">
                View All
              </Link>
            </div>
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-[#36393f] rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start p-3 bg-[#202225] rounded-lg hover:bg-[#393c43] transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{activity.action}</p>
                      <p className="text-xs text-[#b9bbbe] mt-1">
                        {activity.entity_type} • {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#b9bbbe]">
                <Activity className="h-12 w-12 mx-auto mb-2 text-[#8e9297]" />
                <p>No recent activity</p>
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#5865f2]" />
                Recent Users
              </h2>
              <Link to="/users" className="text-sm text-[#5865f2] hover:text-[#4752c4]">
                View All
              </Link>
            </div>
            {isLoadingUsers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-[#36393f] rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((userItem: any) => (
                  <div key={userItem.id} className="flex items-center p-3 bg-[#202225] rounded-lg hover:bg-[#393c43] transition-colors">
                    <div className="h-10 w-10 rounded-full bg-[#5865f2] flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {userItem.first_name?.[0]?.toUpperCase() || ''}{userItem.last_name?.[0]?.toUpperCase() || ''}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {userItem.first_name} {userItem.last_name}
                      </p>
                      <p className="text-xs text-[#b9bbbe]">{userItem.email}</p>
                    </div>
                    {userItem.role && (
                      <span className="px-2 py-1 text-xs font-medium text-[#b9bbbe] bg-[#36393f] rounded-full">
                        {userItem.role.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#b9bbbe]">
                <Users className="h-12 w-12 mx-auto mb-2 text-[#8e9297]" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Package Info */}
          {packageInfo && (
            <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-[#5865f2]" />
                Package Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#b9bbbe]">Current Package</p>
                  <p className="text-lg font-semibold text-white">{packageInfo.package?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#b9bbbe]">Price</p>
                  <p className="text-lg font-semibold text-[#5865f2]">
                    ${packageInfo.package?.price === 0 ? 'Free' : packageInfo.package?.price || 0}
                    {packageInfo.package?.price > 0 && <span className="text-sm text-[#b9bbbe]">/mo</span>}
                  </p>
                </div>
                {packageInfo.current_limits && (
                  <div className="pt-4 border-t border-[#202225]">
                    <p className="text-sm text-[#b9bbbe] mb-3">Usage Limits</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-[#b9bbbe] mb-1">
                          <span>Users</span>
                          <span>{stats?.total_users || 0} / {formatLimit(packageInfo.current_limits.users)}</span>
                        </div>
                        <div className="w-full bg-[#202225] rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              (stats?.user_usage_percentage || 0) >= 90 ? 'bg-[#ed4245]' : 'bg-[#5865f2]'
                            }`}
                            style={{ width: `${Math.min(stats?.user_usage_percentage || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-[#b9bbbe] mb-1">
                          <span>Roles</span>
                          <span>{stats?.total_roles || 0} / {formatLimit(packageInfo.current_limits.roles)}</span>
                        </div>
                        <div className="w-full bg-[#202225] rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              (stats?.role_usage_percentage || 0) >= 90 ? 'bg-[#ed4245]' : 'bg-[#23a55a]'
                            }`}
                            style={{ width: `${Math.min(stats?.role_usage_percentage || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-[#202225] mt-4">
                  <Link 
                    to="/packages" 
                    className="flex items-center justify-center w-full px-4 py-2.5 bg-[#5865f2] text-white text-sm font-medium rounded-lg hover:bg-[#4752c4] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865f2]"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Package
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-[#5865f2]" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/invitations" className="block px-4 py-2 text-sm text-[#5865f2] hover:bg-[#5865f2]/10 rounded-lg transition-colors">
                + Create Invitation
              </Link>
              <Link to="/users" className="block px-4 py-2 text-sm text-[#5865f2] hover:bg-[#5865f2]/10 rounded-lg transition-colors">
                View All Users
              </Link>
              <Link to="/roles" className="block px-4 py-2 text-sm text-[#5865f2] hover:bg-[#5865f2]/10 rounded-lg transition-colors">
                Manage Roles
              </Link>
              <Link to="/organizations" className="block px-4 py-2 text-sm text-[#5865f2] hover:bg-[#5865f2]/10 rounded-lg transition-colors">
                Organization Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

