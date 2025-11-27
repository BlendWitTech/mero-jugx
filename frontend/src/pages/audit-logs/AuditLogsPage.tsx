import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Activity, Eye, X, Filter, Calendar, User, FileText, Search, AlertCircle, FileText as FileTextIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  // Fetch viewable users for filter dropdown (only users the current user can view audit logs for)
  const { data: usersData } = useQuery({
    queryKey: ['viewable-users-for-audit-filter'],
    queryFn: async () => {
      const response = await api.get('/audit-logs/viewable-users');
      return response.data || [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter, entityTypeFilter, userIdFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {
        page,
        limit: 20,
      };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entity_type = entityTypeFilter;
      if (userIdFilter) params.user_id = userIdFilter;
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;

      const response = await api.get('/audit-logs', { params });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !hasPermissionError,
    retry: 1,
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        setHasPermissionError(true);
        toast.error('You do not have permission to view audit logs');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-logs-stats', dateFrom, dateTo],
    queryFn: async () => {
      try {
        const params: any = {};
        if (dateFrom) params.from_date = dateFrom;
        if (dateTo) params.to_date = dateTo;
        const response = await api.get('/audit-logs/stats', { params });
        return response.data;
      } catch (error) {
        // Don't fail the page if stats fail - it's optional data
        console.warn('Failed to load audit log stats:', error);
        return null;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    retry: 1,
  });

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const clearFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setUserIdFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('accept')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('edit')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('delete') || action.includes('revoke') || action.includes('cancel')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-[#393c43] text-[#dcddde]';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('accept')) {
      return '✓';
    }
    if (action.includes('update') || action.includes('edit')) {
      return '✎';
    }
    if (action.includes('delete') || action.includes('revoke') || action.includes('cancel')) {
      return '✗';
    }
    return '•';
  };

  const actionTypes = [
    'user.create',
    'user.update',
    'user.delete',
    'user.revoke',
    'role.create',
    'role.update',
    'role.delete',
    'role.assign',
    'invitation.create',
    'invitation.accept',
    'invitation.cancel',
    'organization.update',
    'organization.settings.update',
  ];

  const entityTypes = ['user', 'role', 'invitation', 'organization', 'package', 'permission'];

  // Show permission error message
  if (hasPermissionError || (error && (error as any)?.response?.status === 403)) {
    return (
      <div>
        <div className="card bg-[#ed4245]/10 border-2 border-[#ed4245]/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-[#ed4245]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#ed4245] mb-2">Access Denied</h2>
              <p className="text-[#ed4245] mb-4">
                You do not have permission to view audit logs. Only users with the appropriate role permissions can access this page.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5865f2] rounded-lg">
              <FileTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Audit Logs</h1>
              <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">Track all activities and changes in your organization</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && typeof stats === 'object' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="card">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary-500 mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Total Logs</p>
                <p className="text-2xl font-semibold text-white">{(stats as any)?.total_logs || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Unique Users</p>
                <p className="text-2xl font-semibold text-white">{(stats as any)?.unique_users || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Actions Today</p>
                <p className="text-2xl font-semibold text-white">{(stats as any)?.actions_today || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Actions This Week</p>
                <p className="text-2xl font-semibold text-white">{(stats as any)?.actions_this_week || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#b9bbbe] mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search logs..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b9bbbe] mb-1">User</label>
              <select
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                className="input"
              >
                <option value="">All Users</option>
                {usersData?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b9bbbe] mb-1">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="input"
              >
                <option value="">All Actions</option>
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action.replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b9bbbe] mb-1">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="input"
              >
                <option value="">All Entities</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b9bbbe] mb-1">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="input text-sm"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="input text-sm"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
          {(actionFilter || entityTypeFilter || userIdFilter || dateFrom || dateTo || search) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-4">
          <p className="text-red-800">
            Error loading audit logs: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#36393f] rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#202225]">
              <thead className="bg-[#2f3136]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#2f3136] divide-y divide-[#202225]">
                {data?.audit_logs && data.audit_logs.length > 0 ? (
                  data.audit_logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#36393f]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)} {log.action.replace('.', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="text-sm font-medium text-white">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-xs text-[#8e9297] ml-2">#{log.entity_id}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {log.user?.first_name} {log.user?.last_name}
                        </div>
                        <div className="text-xs text-[#8e9297]">{log.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8e9297]">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#8e9297]">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No audit logs found. {search && 'Try adjusting your filters.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && (
            <div className="mt-4 flex items-center justify-between px-6 py-4 border-t border-[#202225]">
              <div className="text-sm text-[#b9bbbe]">
                {data.total > 0 ? (
                  <>
                    Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} logs
                    {data.totalPages > 1 && ` (Page ${data.page} of ${data.totalPages})`}
                  </>
                ) : (
                  'No logs found'
                )}
              </div>
              {data.totalPages > 1 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-[#36393f]0 bg-opacity-75" onClick={() => setShowDetailModal(false)}></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-[#2f3136] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Audit Log Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-[#8e9297]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#8e9297]">Action</p>
                      <p className="mt-1 text-sm text-white">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                          {selectedLog.action}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297]">Entity Type</p>
                      <p className="mt-1 text-sm text-white">{selectedLog.entity_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297]">Entity ID</p>
                      <p className="mt-1 text-sm text-white">{selectedLog.entity_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297]">Timestamp</p>
                      <p className="mt-1 text-sm text-white">{formatDateTime(selectedLog.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297]">User</p>
                      <p className="mt-1 text-sm text-white">
                        {selectedLog.user?.first_name} {selectedLog.user?.last_name}
                      </p>
                      <p className="text-xs text-[#8e9297]">{selectedLog.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297]">IP Address</p>
                      <p className="mt-1 text-sm text-white">{selectedLog.ip_address || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                    <div className="pt-4 border-t border-[#202225]">
                      <p className="text-sm font-medium text-[#8e9297] mb-2">Old Values</p>
                      <pre className="bg-[#36393f] p-3 rounded text-xs text-[#b9bbbe] overflow-x-auto">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                    <div className="pt-4 border-t border-[#202225]">
                      <p className="text-sm font-medium text-[#8e9297] mb-2">New Values</p>
                      <pre className="bg-[#36393f] p-3 rounded text-xs text-[#b9bbbe] overflow-x-auto">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="pt-4 border-t border-[#202225]">
                      <p className="text-sm font-medium text-[#8e9297] mb-2">Metadata</p>
                      <pre className="bg-[#36393f] p-3 rounded text-xs text-[#b9bbbe] overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

