import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Bell, 
  Mail, 
  Activity,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

type TimeRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export default function AnalyticsPage() {
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const [preset, setPreset] = useState<TimeRangePreset>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="card bg-[#ed4245]/10 border border-[#ed4245]/20">
          <p className="text-[#ed4245]">
            Error loading analytics: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5865f2] rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
            <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">
              Insights and metrics for {organization?.name || 'your organization'}
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#8e9297]" />
            <span className="text-sm font-medium text-[#b9bbbe]">Time Range:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d', '1y', 'custom'] as TimeRangePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  preset === p
                    ? 'bg-[#5865f2] text-white'
                    : 'text-[#b9bbbe] hover:bg-[#393c43]'
                }`}
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
                className="px-3 py-2 bg-[#2f3136] border border-[#202225] rounded-lg text-white text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-[#2f3136] border border-[#202225] rounded-lg text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-[#36393f] rounded"></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Users Metrics */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-[#5865f2]" />
              <h2 className="text-lg font-semibold text-white">Users</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Users</p>
                <p className="text-2xl font-bold text-white">{analytics.users?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Active Users</p>
                <p className="text-2xl font-bold text-white">{analytics.users?.active || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">New Users</p>
                <p className="text-2xl font-bold text-white">{analytics.users?.new || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Growth</p>
                <div className="flex items-center gap-2">
                  {analytics.users?.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-[#23a55a]" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-[#ed4245]" />
                  )}
                  <p className={`text-2xl font-bold ${analytics.users?.growth >= 0 ? 'text-[#23a55a]' : 'text-[#ed4245]'}`}>
                    {formatPercentage(analytics.users?.growth || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-5 w-5 text-[#5865f2]" />
              <h2 className="text-lg font-semibold text-white">Activity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Activities</p>
                <p className="text-2xl font-bold text-white">{formatNumber(analytics.activity?.total || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe] mb-2">Top Activities</p>
                <div className="space-y-1">
                  {Object.entries(analytics.activity?.byType || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([action, count]) => (
                      <div key={action} className="flex justify-between text-sm">
                        <span className="text-[#b9bbbe]">{action}</span>
                        <span className="text-white font-medium">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Metrics */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-5 w-5 text-[#5865f2]" />
              <h2 className="text-lg font-semibold text-white">Chat</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Messages</p>
                <p className="text-2xl font-bold text-white">{formatNumber(analytics.chat?.totalMessages || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Chats</p>
                <p className="text-2xl font-bold text-white">{analytics.chat?.totalChats || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Active Chats</p>
                <p className="text-2xl font-bold text-white">{analytics.chat?.activeChats || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Messages/Day</p>
                <p className="text-2xl font-bold text-white">{analytics.chat?.messagesPerDay?.toFixed(1) || 0}</p>
              </div>
            </div>
          </div>

          {/* Notifications Metrics */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-[#5865f2]" />
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Notifications</p>
                <p className="text-2xl font-bold text-white">{formatNumber(analytics.notifications?.total || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Unread</p>
                <p className="text-2xl font-bold text-white">{analytics.notifications?.unread || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Read Rate</p>
                <p className="text-2xl font-bold text-white">{analytics.notifications?.readRate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          {/* Invitations Metrics */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-[#5865f2]" />
              <h2 className="text-lg font-semibold text-white">Invitations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Invitations</p>
                <p className="text-2xl font-bold text-white">{analytics.invitations?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Pending</p>
                <p className="text-2xl font-bold text-white">{analytics.invitations?.pending || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Accepted</p>
                <p className="text-2xl font-bold text-white">{analytics.invitations?.accepted || 0}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9bbbe]">Acceptance Rate</p>
                <p className="text-2xl font-bold text-white">{analytics.invitations?.acceptanceRate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          {/* Revenue Metrics (if available) */}
          {analytics.revenue && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-5 w-5 text-[#5865f2]" />
                <h2 className="text-lg font-semibold text-white">Revenue</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-[#b9bbbe]">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.total || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#b9bbbe]">This Month</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.thisMonth || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#b9bbbe]">Last Month</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.lastMonth || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#b9bbbe]">Growth</p>
                  <div className="flex items-center gap-2">
                    {analytics.revenue.growth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-[#23a55a]" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-[#ed4245]" />
                    )}
                    <p className={`text-2xl font-bold ${analytics.revenue.growth >= 0 ? 'text-[#23a55a]' : 'text-[#ed4245]'}`}>
                      {formatPercentage(analytics.revenue.growth || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-[#8e9297]" />
            <p className="text-lg font-medium text-white mb-2">No analytics data</p>
            <p className="text-[#8e9297]">Analytics data will appear here once you have activity.</p>
          </div>
        </div>
      )}
    </div>
  );
}

