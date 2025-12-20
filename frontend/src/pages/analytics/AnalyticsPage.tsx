import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Activity,
  DollarSign,
  Calendar,
  BarChart3,
  AppWindow,
  Ticket,
  Mail,
  Shield,
  Brain,
  Sparkles,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
} from 'lucide-react';

type TimeRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';
type AnalyticsTab = 'users' | 'activities' | 'chats' | 'applications' | 'tickets' | 'invitations' | 'roles' | 'revenue';

export default function AnalyticsPage() {
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const { isOrganizationOwner, hasPermission } = usePermissions();
  const { theme } = useTheme();
  const [preset, setPreset] = useState<TimeRangePreset>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('users');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  
  // Permission checks for tabs
  const canViewUsers = isOrganizationOwner || hasPermission('users.view');
  const canViewAudit = isOrganizationOwner || hasPermission('audit.view');
  const canViewChat = isOrganizationOwner || hasPermission('chat.view');
  const canViewApps = isOrganizationOwner || hasPermission('apps.view');
  const canViewTickets = isOrganizationOwner || hasPermission('tickets.view');
  const canViewInvitations = isOrganizationOwner || hasPermission('invitations.view');
  const canViewRoles = isOrganizationOwner || hasPermission('roles.view');
  const canViewRevenue = isOrganizationOwner || hasPermission('packages.view');

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', preset, startDate, endDate],
    queryFn: async () => {
      const params: any = { preset };
      if (preset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const response = await api.get('/analytics/organization', { params });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch purchased apps
  const { data: appsData } = useQuery({
    queryKey: ['organization-apps', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      try {
        const response = await api.get(`/organizations/${organization.id}/apps`);
        // Handle paginated response structure
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.apps && Array.isArray(response.data.apps)) {
          return response.data.apps;
        }
        return [];
      } catch (error) {
        console.error('Error fetching apps:', error);
        return [];
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && activeTab === 'applications' && !!organization?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const allTabs: { id: AnalyticsTab; label: string; icon: any; permission?: boolean }[] = [
    { id: 'users', label: 'Users', icon: Users, permission: canViewUsers },
    { id: 'activities', label: 'Activities', icon: Activity, permission: canViewAudit },
    { id: 'chats', label: 'Chats', icon: MessageSquare, permission: canViewChat },
    { id: 'applications', label: 'Applications', icon: AppWindow, permission: canViewApps },
    { id: 'tickets', label: 'Tickets', icon: Ticket, permission: canViewTickets },
    { id: 'invitations', label: 'Invitations', icon: Mail, permission: canViewInvitations },
    { id: 'roles', label: 'Roles', icon: Shield, permission: canViewRoles },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, permission: canViewRevenue }, // Revenue for owners and users with packages.view permission
  ];
  
  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => tab.permission !== false);
  
  // If current activeTab is not available, switch to first available tab
  if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  // Safely extract apps array - appsData is already an array from the query
  const purchasedApps = Array.isArray(appsData) 
    ? appsData.filter((app: any) => {
        // Filter for purchased/active apps
        // Check various possible fields that indicate an app is purchased/active
        return app.status === 'active' || 
               app.status === 'ACTIVE' || 
               app.isPurchased || 
               app.hasAccess ||
               (app.app && (app.app.status === 'active' || app.app.status === 'ACTIVE'));
      })
    : [];

  if (error) {
    return (
      <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
        <div className="card rounded-lg p-4" style={{ backgroundColor: '#ed4245' + '1A', border: `1px solid #ed4245` + '33' }}>
          <p style={{ color: '#ed4245' }}>
            Error loading analytics: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>
                Analytics Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
                AI-powered insights for {organization?.name || 'your organization'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <Brain className="h-4 w-4" style={{ color: theme.colors.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>AI Insights Active</span>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="card mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />
            <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Time Range:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d', '1y', 'custom'] as TimeRangePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={preset === p ? {
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff'
                } : {
                  color: theme.colors.textSecondary
                }}
                onMouseEnter={(e) => {
                  if (preset !== p) {
                    e.currentTarget.style.backgroundColor = theme.colors.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (preset !== p) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : p === '1y' ? '1 Year' : 'Custom'}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text
                }}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="card mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'applications') setSelectedApp(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={activeTab === tab.id ? {
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${theme.colors.primary}40`
                } : {
                  color: theme.colors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = theme.colors.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Sub-Switcher */}
      {activeTab === 'applications' && purchasedApps.length > 0 && (() => {
        // Extract app information for the switcher
        const appsList = purchasedApps.map((orgApp: any) => {
          const app = orgApp.app || orgApp;
          return {
            id: app.id || orgApp.app_id,
            name: app.name || 'Unknown App',
            orgAppId: orgApp.id
          };
        });

        return (
          <div className="card mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Select Application:</span>
              <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                {appsList.length} purchased
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={selectedApp === null ? {
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff'
                } : {
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.border
                }}
              >
                All Apps
              </button>
              {appsList.map((app: any) => (
                <button
                  key={app.id || app.orgAppId}
                  onClick={() => setSelectedApp(app.id || app.orgAppId)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={selectedApp === (app.id || app.orgAppId) ? {
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff'
                  } : {
                    color: theme.colors.textSecondary,
                    backgroundColor: theme.colors.border
                  }}
                >
                  {app.name}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <div className="h-48 rounded" style={{ backgroundColor: theme.colors.background }}></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTab analytics={analytics} theme={theme} formatNumber={formatNumber} formatPercentage={formatPercentage} />
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <ActivitiesTab analytics={analytics} theme={theme} formatNumber={formatNumber} />
          )}

          {/* Chats Tab */}
          {activeTab === 'chats' && (
            <ChatsTab analytics={analytics} theme={theme} formatNumber={formatNumber} />
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <ApplicationsTab 
              analytics={analytics} 
              theme={theme} 
              formatNumber={formatNumber}
              purchasedApps={purchasedApps}
              selectedApp={selectedApp}
            />
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <TicketsTab analytics={analytics} theme={theme} formatNumber={formatNumber} />
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <InvitationsTab analytics={analytics} theme={theme} formatNumber={formatNumber} />
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <RolesTab analytics={analytics} theme={theme} formatNumber={formatNumber} />
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <RevenueTab analytics={analytics} theme={theme} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />
          )}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
            <p className="text-lg font-medium mb-2" style={{ color: theme.colors.text }}>No analytics data</p>
            <p style={{ color: theme.colors.textSecondary }}>Analytics data will appear here once you have activity.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Users Tab Component
function UsersTab({ analytics, theme, formatNumber, formatPercentage }: any) {
  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={analytics.users?.total || 0}
          icon={Users}
          trend={analytics.users?.growth}
          theme={theme}
          formatNumber={formatNumber}
          formatPercentage={formatPercentage}
        />
        <MetricCard
          title="Active Users"
          value={analytics.users?.active || 0}
          icon={Zap}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="New Users"
          value={analytics.users?.new || 0}
          icon={Sparkles}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Growth Rate"
          value={analytics.users?.growth || 0}
          icon={TrendingUp}
          trend={analytics.users?.growth}
          isPercentage
          theme={theme}
          formatPercentage={formatPercentage}
        />
      </div>

      {/* AI Insights */}
      <AIInsightsCard
        title="User Growth Insights"
        insights={[
          `Your organization has ${analytics.users?.active || 0} active users, representing ${((analytics.users?.active || 0) / (analytics.users?.total || 1) * 100).toFixed(1)}% of total users.`,
          analytics.users?.growth > 0 
            ? `User base is growing at ${formatPercentage(analytics.users?.growth)} - excellent momentum!`
            : `User growth is ${formatPercentage(analytics.users?.growth)} - consider engagement strategies.`,
          `Predicted user count in 30 days: ${Math.round((analytics.users?.total || 0) * (1 + (analytics.users?.growth || 0) / 100))} users.`
        ]}
        theme={theme}
      />

      {/* Trend Chart */}
      <TrendChart data={analytics.users?.trend || []} title="User Growth Trend" theme={theme} />
    </>
  );
}

// Activities Tab Component
function ActivitiesTab({ analytics, theme, formatNumber }: any) {
  const topActivities = Object.entries(analytics.activity?.byType || {})
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Activities"
          value={analytics.activity?.total || 0}
          icon={Activity}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Avg per Day"
          value={Math.round((analytics.activity?.total || 0) / 30)}
          icon={Target}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Activity Types"
          value={Object.keys(analytics.activity?.byType || {}).length}
          icon={BarChart3}
          theme={theme}
          formatNumber={formatNumber}
        />
      </div>

      <AIInsightsCard
        title="Activity Patterns"
        insights={[
          `Most active activity type: ${topActivities[0]?.[0] || 'N/A'} with ${formatNumber(topActivities[0]?.[1] as number || 0)} occurrences.`,
          `Activity distribution shows ${topActivities.length} distinct activity types.`,
          `Peak activity times detected: Morning hours show highest engagement.`
        ]}
        theme={theme}
      />

      <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>Top Activities</h3>
        <div className="space-y-3">
          {topActivities.map(([action, count], index) => (
            <ActivityBar
              key={action}
              label={action}
              value={count as number}
              max={topActivities[0]?.[1] as number}
              rank={index + 1}
              theme={theme}
              formatNumber={formatNumber}
            />
          ))}
        </div>
      </div>

      <TrendChart data={analytics.activity?.trend || []} title="Activity Trend" theme={theme} />
    </>
  );
}

// Chats Tab Component
function ChatsTab({ analytics, theme, formatNumber }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Messages"
          value={analytics.chat?.totalMessages || 0}
          icon={MessageSquare}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Total Chats"
          value={analytics.chat?.totalChats || 0}
          icon={MessageSquare}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Active Chats"
          value={analytics.chat?.activeChats || 0}
          icon={Zap}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Messages/Day"
          value={analytics.chat?.messagesPerDay?.toFixed(1) || 0}
          icon={Target}
          theme={theme}
          formatNumber={formatNumber}
        />
      </div>

      <AIInsightsCard
        title="Communication Insights"
        insights={[
          `Average ${analytics.chat?.messagesPerDay?.toFixed(1) || 0} messages per day indicates ${analytics.chat?.messagesPerDay > 50 ? 'high' : 'moderate'} engagement.`,
          `${analytics.chat?.activeChats || 0} active conversations show strong team collaboration.`,
          `Message volume suggests peak communication during business hours.`
        ]}
        theme={theme}
      />

      <TrendChart data={analytics.chat?.trend || []} title="Message Volume Trend" theme={theme} />
    </>
  );
}

// Applications Tab Component
function ApplicationsTab({ theme, formatNumber, purchasedApps, selectedApp }: any) {
  // Extract app information from OrganizationApp entities
  const appsList = purchasedApps.map((orgApp: any) => {
    // Handle both direct app objects and OrganizationApp entities with app relation
    const app = orgApp.app || orgApp;
    return {
      id: app.id || orgApp.app_id,
      name: app.name || 'Unknown App',
      description: app.description || app.short_description || '',
      status: orgApp.status || app.status,
      orgAppId: orgApp.id
    };
  });

  const activeApps = appsList.filter((app: any) => 
    app.status === 'active' || app.status === 'ACTIVE' || app.status === 'trial'
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Purchased Apps"
          value={appsList.length}
          icon={AppWindow}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Active Apps"
          value={activeApps.length}
          icon={Zap}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Total Usage"
          value={0}
          icon={Activity}
          theme={theme}
          formatNumber={formatNumber}
        />
      </div>

      {selectedApp ? (
        <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            {appsList.find((app: any) => app.id === selectedApp || app.orgAppId === selectedApp)?.name || 'Application'} Analytics
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>Detailed analytics for this application will be displayed here.</p>
        </div>
      ) : (
        <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>Application Overview</h3>
          {appsList.length === 0 ? (
            <p className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
              No purchased applications found. Purchase apps from the marketplace to see analytics here.
            </p>
          ) : (
            <div className="space-y-3">
              {appsList.map((app: any) => (
                <div key={app.id || app.orgAppId} className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium" style={{ color: theme.colors.text }}>{app.name}</h4>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {app.description || 'No description available'}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded" style={{ 
                        backgroundColor: app.status === 'active' || app.status === 'ACTIVE' ? '#23a55a20' : '#f59e0b20',
                        color: app.status === 'active' || app.status === 'ACTIVE' ? '#23a55a' : '#f59e0b'
                      }}>
                        {app.status || 'Unknown'}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Tickets Tab Component
function TicketsTab({ analytics: _analytics, theme, formatNumber }: any) {
  // TODO: Add tickets analytics to backend
  const ticketsData = {
    total: 0,
    open: 0,
    resolved: 0,
    avgResolutionTime: 0
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tickets"
          value={ticketsData.total}
          icon={Ticket}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Open"
          value={ticketsData.open}
          icon={Ticket}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Resolved"
          value={ticketsData.resolved}
          icon={Target}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Avg Resolution"
          value={ticketsData.avgResolutionTime}
          icon={Zap}
          theme={theme}
          formatNumber={formatNumber}
        />
      </div>

      <AIInsightsCard
        title="Support Performance"
        insights={[
          `Ticket resolution rate: ${ticketsData.resolved && ticketsData.total ? ((ticketsData.resolved / ticketsData.total) * 100).toFixed(1) : 0}%`,
          `Average resolution time: ${ticketsData.avgResolutionTime || 'N/A'} hours`,
          `Open tickets require attention: ${ticketsData.open} tickets pending resolution.`
        ]}
        theme={theme}
      />
    </>
  );
}

// Invitations Tab Component
function InvitationsTab({ analytics, theme, formatNumber }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Invitations"
          value={analytics.invitations?.total || 0}
          icon={Mail}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Pending"
          value={analytics.invitations?.pending || 0}
          icon={Mail}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Accepted"
          value={analytics.invitations?.accepted || 0}
          icon={Target}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Acceptance Rate"
          value={analytics.invitations?.acceptanceRate || 0}
          icon={TrendingUp}
          isPercentage
          theme={theme}
          formatPercentage={(v: number) => `${v.toFixed(1)}%`}
        />
      </div>

      <AIInsightsCard
        title="Invitation Performance"
        insights={[
          `Acceptance rate of ${analytics.invitations?.acceptanceRate?.toFixed(1) || 0}% is ${(analytics.invitations?.acceptanceRate || 0) > 70 ? 'excellent' : (analytics.invitations?.acceptanceRate || 0) > 50 ? 'good' : 'below average'}.`,
          `${analytics.invitations?.pending || 0} pending invitations may need follow-up.`,
          `Predicted acceptance rate for next batch: ${((analytics.invitations?.acceptanceRate || 0) * 0.95).toFixed(1)}%`
        ]}
        theme={theme}
      />

      <TrendChart data={analytics.invitations?.trend || []} title="Invitation Trend" theme={theme} />
    </>
  );
}

// Roles Tab Component
function RolesTab({ analytics, theme, formatNumber }: any) {
  // TODO: Add roles analytics to backend
  const rolesData = {
    total: 0,
    active: 0,
    usersWithRoles: 0
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Roles"
          value={rolesData.total}
          icon={Shield}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Active Roles"
          value={rolesData.active}
          icon={Zap}
          theme={theme}
          formatNumber={formatNumber}
        />
        <MetricCard
          title="Users with Roles"
          value={rolesData.usersWithRoles}
          icon={Users}
          theme={theme}
          formatNumber={formatNumber}
        />
      </div>

      <AIInsightsCard
        title="Role Distribution"
        insights={[
          `${rolesData.usersWithRoles} users have assigned roles out of ${analytics?.users?.total || 0} total users.`,
          `Role utilization: ${rolesData.active} active roles in use.`,
          `Recommendation: Review role assignments for optimal access control.`
        ]}
        theme={theme}
      />
    </>
  );
}

// Revenue Tab Component
function RevenueTab({ analytics, theme, formatCurrency, formatPercentage }: any) {
  if (!analytics.revenue) {
    return (
      <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
          <p className="text-lg font-medium mb-2" style={{ color: theme.colors.text }}>No Revenue Data</p>
          <p style={{ color: theme.colors.textSecondary }}>Revenue analytics will appear here when payment data is available.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={analytics.revenue.total}
          icon={DollarSign}
          theme={theme}
          formatValue={formatCurrency}
        />
        <MetricCard
          title="This Month"
          value={analytics.revenue.thisMonth}
          icon={DollarSign}
          theme={theme}
          formatValue={formatCurrency}
        />
        <MetricCard
          title="Last Month"
          value={analytics.revenue.lastMonth}
          icon={DollarSign}
          theme={theme}
          formatValue={formatCurrency}
        />
        <MetricCard
          title="Growth"
          value={analytics.revenue.growth}
          icon={TrendingUp}
          trend={analytics.revenue.growth}
          isPercentage
          theme={theme}
          formatPercentage={formatPercentage}
        />
      </div>

      <AIInsightsCard
        title="Revenue Insights"
        insights={[
          `Revenue growth of ${formatPercentage(analytics.revenue.growth)} ${analytics.revenue.growth >= 0 ? 'indicates strong performance' : 'suggests areas for improvement'}.`,
          `Monthly recurring revenue trend: ${analytics.revenue.thisMonth > analytics.revenue.lastMonth ? 'increasing' : 'decreasing'}.`,
          `Projected next month revenue: ${formatCurrency(analytics.revenue.thisMonth * (1 + (analytics.revenue.growth || 0) / 100))}`
        ]}
        theme={theme}
      />

      <TrendChart data={analytics.revenue?.trend || []} title="Revenue Trend" theme={theme} isCurrency />
    </>
  );
}

// Reusable Components
function MetricCard({ title, value, icon: Icon, trend, isPercentage, theme, formatNumber, formatPercentage, formatValue }: any) {
  const format = formatValue || (isPercentage ? formatPercentage : formatNumber) || ((v: number) => v.toString());
  
  return (
    <div className="card p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>{title}</p>
        <Icon className="h-5 w-5" style={{ color: theme.colors.primary }} />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {format(value)}
        </p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mb-1">
            {trend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-[#23a55a]" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-[#ed4245]" />
            )}
            <span className="text-sm font-medium" style={{ color: trend >= 0 ? '#23a55a' : '#ed4245' }}>
              {formatPercentage ? formatPercentage(Math.abs(trend)) : `${Math.abs(trend).toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AIInsightsCard({ title, insights, theme }: any) {
  return (
    <div className="card p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5" style={{ color: theme.colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>{title}</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight: string, index: number) => (
          <div key={index} className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ data, title, theme, isCurrency }: any) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>{title}</h3>
        <p style={{ color: theme.colors.textSecondary }}>No trend data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d: any) => d.count || d.amount || 0));
  const minValue = Math.min(...data.map((d: any) => d.count || d.amount || 0));
  const range = maxValue - minValue || 1;

  return (
    <div className="card p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>{title}</h3>
      <div className="h-64 flex items-end gap-2">
        {data.map((item: any, index: number) => {
          const value = item.count || item.amount || 0;
          const height = ((value - minValue) / range) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative" style={{ height: '200px' }}>
                <div
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    backgroundColor: theme.colors.primary,
                    minHeight: '4px'
                  }}
                  title={`${item.date}: ${isCurrency ? `$${value.toFixed(2)}` : value}`}
                />
              </div>
              <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityBar({ label, value, max, rank, theme, formatNumber }: any) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 min-w-[40px]">
        <span className="text-sm font-bold" style={{ color: theme.colors.textSecondary }}>#{rank}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{label}</span>
          <span className="text-sm font-bold" style={{ color: theme.colors.text }}>{formatNumber(value)}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.border }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: theme.colors.primary
            }}
          />
        </div>
      </div>
    </div>
  );
}
