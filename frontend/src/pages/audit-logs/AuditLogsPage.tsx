import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Activity, Eye, X, Filter, Calendar, User, FileText, Search, AlertCircle, FileText as FileTextIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  metadata: any;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AuditLogsResponse {
  audit_logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

  const { data, isLoading, error } = useQuery<AuditLogsResponse>({
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
  });

  // Handle error
  useEffect(() => {
    if (error && (error as any)?.response?.status === 403) {
      setHasPermissionError(true);
      toast.error('You do not have permission to view audit logs');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [error, navigate]);

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

  // Format audit log action into human-readable message
  const formatAuditLogMessage = (log: any): string => {
    const userName = log.user ? `${log.user.first_name} ${log.user.last_name}`.trim() : 'Unknown User';
    const action = log.action;
    const entityType = log.entity_type;
    const metadata = log.metadata || {};
    const oldValues = log.old_values || {};
    const newValues = log.new_values || {};

    // Chat actions
    if (action === 'chat.created') {
      const chatType = metadata.chat_type === 'group' ? 'group chat' : 'direct message';
      const chatName = metadata.chat_name ? `"${metadata.chat_name}"` : chatType;
      return `${userName} created a ${chatName}`;
    }
    if (action === 'chat.updated') {
      const changes: string[] = [];
      if (newValues.name && oldValues.name !== newValues.name) {
        changes.push(`renamed to "${newValues.name}"`);
      }
      if (newValues.description !== undefined && oldValues.description !== newValues.description) {
        changes.push('updated the description');
      }
      if (changes.length > 0) {
        return `${userName} ${changes.join(' and ')}`;
      }
      return `${userName} updated the chat`;
    }
    if (action === 'chat.deleted') {
      return `${userName} deleted a chat`;
    }
    if (action === 'chat.members.added') {
      const count = Array.isArray(metadata.user_ids) ? metadata.user_ids.length : 1;
      return `${userName} added ${count} member${count !== 1 ? 's' : ''} to the group`;
    }
    if (action === 'chat.member.removed') {
      return `${userName} removed a member from the group`;
    }
    if (action === 'chat.left') {
      return `${userName} left a chat`;
    }

    // User actions
    if (action === 'user.create') {
      return `${userName} created a new user account`;
    }
    if (action === 'user.update') {
      const changes: string[] = [];
      if (newValues.first_name && oldValues.first_name !== newValues.first_name) {
        changes.push('first name');
      }
      if (newValues.last_name && oldValues.last_name !== newValues.last_name) {
        changes.push('last name');
      }
      if (newValues.email && oldValues.email !== newValues.email) {
        changes.push('email address');
      }
      if (changes.length > 0) {
        return `${userName} updated user's ${changes.join(', ')}`;
      }
      return `${userName} updated a user`;
    }
    if (action === 'user.delete') {
      return `${userName} deleted a user account`;
    }
    if (action === 'user.revoke') {
      return `${userName} revoked access for a user`;
    }

    // Role actions
    if (action === 'role.create') {
      const roleName = metadata.role_name || 'a role';
      return `${userName} created the role "${roleName}"`;
    }
    if (action === 'role.update') {
      const roleName = metadata.role_name || 'a role';
      return `${userName} updated the role "${roleName}"`;
    }
    if (action === 'role.delete') {
      return `${userName} deleted a role`;
    }
    if (action === 'role.assign') {
      const roleName = metadata.role_name || 'a role';
      return `${userName} assigned the role "${roleName}" to a user`;
    }

    // Invitation actions
    if (action === 'invitation.create') {
      return `${userName} sent an invitation`;
    }
    if (action === 'invitation.accept') {
      return `${userName} accepted an invitation`;
    }
    if (action === 'invitation.cancel') {
      return `${userName} cancelled an invitation`;
    }

    // Organization actions
    if (action === 'organization.update') {
      return `${userName} updated organization settings`;
    }
    if (action === 'organization.settings.update') {
      return `${userName} changed organization settings`;
    }

    // Package actions
    if (action === 'package.purchased') {
      const packageName = metadata.package_name || 'a package';
      return `${userName} purchased the ${packageName} package`;
    }
    if (action === 'package.upgraded') {
      const packageName = metadata.package_name || 'a package';
      return `${userName} upgraded to the ${packageName} package`;
    }

    // Default fallback
    const actionWords = action.split('.').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    return `${userName} performed ${actionWords} on ${entityType}`;
  };

  // Format entity information into human-readable text
  const formatEntityReadable = (log: any): { name: string; subtitle?: string } => {
    const entityType = log.entity_type;
    const metadata = log.metadata || {};
    const oldValues = log.old_values || {};
    const newValues = log.new_values || {};

    // Chat entities
    if (entityType === 'chat') {
      const chatName = metadata.chat_name || newValues.name || oldValues.name;
      const chatType = metadata.chat_type || newValues.type || oldValues.type;
      
      if (chatType === 'direct' || chatType === 'direct_message' || (!chatType && !chatName)) {
        // For direct messages, try to get participant info from metadata
        const otherParticipant = metadata.other_participant_name || metadata.participant_name || metadata.member_name;
        const otherParticipantEmail = metadata.other_participant_email || metadata.participant_email || metadata.member_email;
        
        if (otherParticipant) {
          return {
            name: `Direct message with ${otherParticipant}`,
            subtitle: otherParticipantEmail || 'One-on-one conversation'
          };
        }
        if (otherParticipantEmail) {
          return {
            name: `Direct message with ${otherParticipantEmail}`,
            subtitle: 'One-on-one conversation'
          };
        }
        // If we have member_ids in metadata, we could potentially show count
        if (metadata.member_ids && Array.isArray(metadata.member_ids) && metadata.member_ids.length > 0) {
          return {
            name: 'Direct Message',
            subtitle: `${metadata.member_ids.length} participant${metadata.member_ids.length !== 1 ? 's' : ''}`
          };
        }
        return {
          name: 'Direct Message',
          subtitle: 'One-on-one conversation'
        };
      }
      
      if (chatName) {
        return {
          name: `"${chatName}"`,
          subtitle: chatType === 'group' ? 'Group Chat' : 'Direct Message'
        };
      }
      return {
        name: chatType === 'group' ? 'Group Chat' : 'Direct Message',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Role entities
    if (entityType === 'role') {
      const roleName = metadata.role_name || newValues.name || oldValues.name;
      if (roleName) {
        return {
          name: `"${roleName}"`,
          subtitle: 'Role'
        };
      }
      return {
        name: 'Role',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // User entities
    if (entityType === 'user') {
      const userName = metadata.user_name || newValues.first_name || oldValues.first_name;
      const userEmail = metadata.user_email || newValues.email || oldValues.email;
      if (userName || userEmail) {
        return {
          name: userName ? `${userName} ${newValues.last_name || oldValues.last_name || ''}`.trim() : userEmail,
          subtitle: userEmail && userName ? userEmail : 'User'
        };
      }
      return {
        name: 'User',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Invitation entities
    if (entityType === 'invitation') {
      const email = metadata.invited_email || newValues.email || oldValues.email;
      if (email) {
        return {
          name: email,
          subtitle: 'Invitation'
        };
      }
      return {
        name: 'Invitation',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Organization entities
    if (entityType === 'organization') {
      const orgName = metadata.organization_name || newValues.name || oldValues.name;
      if (orgName) {
        return {
          name: `"${orgName}"`,
          subtitle: 'Organization'
        };
      }
      return {
        name: 'Organization',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Package entities
    if (entityType === 'package') {
      const packageName = metadata.package_name || newValues.name || oldValues.name;
      if (packageName) {
        return {
          name: packageName.charAt(0).toUpperCase() + packageName.slice(1),
          subtitle: 'Package'
        };
      }
      return {
        name: 'Package',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Package Feature entities
    if (entityType === 'package_feature' || entityType === 'organization_package_feature') {
      const featureName = metadata.feature_name || newValues.name || oldValues.name;
      const featureSlug = metadata.feature_slug || newValues.slug || oldValues.slug;
      const featureType = metadata.feature_type || newValues.type || oldValues.type;
      const packageName = metadata.package_name || metadata.purchased_with_package || metadata.current_package_name;
      
      // Format feature name
      let displayName = 'Package Feature';
      if (featureName) {
        displayName = featureName;
      } else if (featureSlug) {
        // Convert slug to readable name (e.g., "chat-system" -> "Chat System")
        displayName = featureSlug
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else if (featureType) {
        // Use feature type as fallback
        displayName = featureType
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // Build subtitle with package and feature info
      const subtitleParts: string[] = [];
      
      // Add feature type info if available
      if (featureType) {
        const typeMap: Record<string, string> = {
          'user_upgrade': 'User Upgrade Feature',
          'role_upgrade': 'Role Upgrade Feature',
          'chat': 'Chat Feature',
          'support': 'Support Feature',
        };
        subtitleParts.push(typeMap[featureType] || 'Feature');
      } else {
        subtitleParts.push('Feature');
      }
      
      // Add package info if available
      if (packageName) {
        subtitleParts.push(`with ${packageName.charAt(0).toUpperCase() + packageName.slice(1)} package`);
      } else if (metadata.package_id) {
        subtitleParts.push('(standalone purchase)');
      }
      
      return {
        name: displayName,
        subtitle: subtitleParts.join(' ')
      };
    }

    // Permission entities
    if (entityType === 'permission') {
      const permName = metadata.permission_name || newValues.name || oldValues.name;
      if (permName) {
        return {
          name: permName,
          subtitle: 'Permission'
        };
      }
      return {
        name: 'Permission',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Message entities
    if (entityType === 'message') {
      return {
        name: 'Message',
        subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
      };
    }

    // Default fallback
    return {
      name: entityType.charAt(0).toUpperCase() + entityType.slice(1),
      subtitle: log.entity_id ? `ID: ${log.entity_id}` : undefined
    };
  };

  // Format metadata/values into human-readable paragraphs
  const formatMetadataReadable = (data: any, log: any): string => {
    if (!data || Object.keys(data).length === 0) return '';

    const parts: string[] = [];
    const action = log.action;
    const metadata = log.metadata || {};
    const oldValues = log.old_values || {};
    const newValues = log.new_values || {};

    // Chat-specific formatting
    if (action === 'chat.created') {
      if (data.chat_type) {
        parts.push(`Chat type: ${data.chat_type === 'group' ? 'Group chat' : 'Direct message'}`);
      }
      if (data.chat_name) {
        parts.push(`Chat name: "${data.chat_name}"`);
      }
    }

    if (action === 'chat.updated') {
      if (newValues.name && oldValues.name !== newValues.name) {
        parts.push(`Chat was renamed from "${oldValues.name || 'Unnamed'}" to "${newValues.name}"`);
      }
      if (newValues.description !== undefined && oldValues.description !== newValues.description) {
        if (oldValues.description) {
          parts.push(`Description was updated from "${oldValues.description}" to "${newValues.description || 'No description'}"`);
        } else {
          parts.push(`Description was set to "${newValues.description || 'No description'}"`);
        }
      }
    }

    if (action === 'chat.members.added') {
      if (data.user_ids && Array.isArray(data.user_ids)) {
        parts.push(`${data.user_ids.length} member${data.user_ids.length !== 1 ? 's were' : ' was'} added to the group`);
      }
    }

    if (action === 'chat.member.removed') {
      if (data.removed_user_id) {
        parts.push(`A member was removed from the group`);
      }
    }

    // Role-specific formatting
    if (action === 'role.create' || action === 'role.update') {
      if (data.role_name) {
        parts.push(`Role name: "${data.role_name}"`);
      }
      if (data.role_id) {
        parts.push(`Role ID: ${data.role_id}`);
      }
    }

    if (action === 'role.assign') {
      if (data.role_name) {
        parts.push(`Role "${data.role_name}" was assigned`);
      }
      if (data.user_id) {
        parts.push(`Assigned to user ID: ${data.user_id}`);
      }
    }

    // User-specific formatting
    if (action === 'user.update') {
      const changes: string[] = [];
      if (newValues.first_name && oldValues.first_name !== newValues.first_name) {
        changes.push(`first name from "${oldValues.first_name}" to "${newValues.first_name}"`);
      }
      if (newValues.last_name && oldValues.last_name !== newValues.last_name) {
        changes.push(`last name from "${oldValues.last_name}" to "${newValues.last_name}"`);
      }
      if (newValues.email && oldValues.email !== newValues.email) {
        changes.push(`email from "${oldValues.email}" to "${newValues.email}"`);
      }
      if (changes.length > 0) {
        parts.push(`Changed ${changes.join(', ')}`);
      }
    }

    // Package-specific formatting
    if (action === 'package.purchased' || action === 'package.upgraded') {
      if (data.package_name) {
        parts.push(`Package: ${data.package_name.charAt(0).toUpperCase() + data.package_name.slice(1)}`);
      }
    }

    // Generic formatting for any remaining fields
    const formattedKeys: Record<string, string> = {
      chat_type: 'Chat Type',
      chat_name: 'Chat Name',
      user_ids: 'User IDs',
      role_name: 'Role Name',
      role_id: 'Role ID',
      package_name: 'Package Name',
      removed_user_id: 'Removed User ID',
    };

    for (const [key, value] of Object.entries(data)) {
      if (!parts.some(p => p.includes(formattedKeys[key] || key))) {
        const label = formattedKeys[key] || key.split('_').map((w: string) => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        
        if (Array.isArray(value)) {
          parts.push(`${label}: ${value.length} item${value.length !== 1 ? 's' : ''}`);
        } else if (typeof value === 'object' && value !== null) {
          parts.push(`${label}: ${JSON.stringify(value)}`);
        } else {
          parts.push(`${label}: ${value}`);
        }
      }
    }

    return parts.length > 0 ? parts.join('. ') + '.' : '';
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
    'chat.created',
    'chat.updated',
    'chat.deleted',
    'chat.members.added',
    'chat.member.removed',
    'chat.left',
    'message.deleted',
  ];

  const entityTypes = ['user', 'role', 'invitation', 'organization', 'package', 'permission', 'chat', 'message'];

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider w-2/5">
                    Action & Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider w-1/6">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider w-1/6">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider w-1/6">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8e9297] uppercase tracking-wider w-1/12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#2f3136] divide-y divide-[#202225]">
                {data?.audit_logs && data.audit_logs.length > 0 ? (
                  data.audit_logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#36393f]">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)} {log.action.replace('.', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-[#b9bbbe]">
                          {formatAuditLogMessage(log)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const entityInfo = formatEntityReadable(log);
                          return (
                            <div>
                              <div className="text-sm font-medium text-white">
                                {entityInfo.name}
                              </div>
                              {entityInfo.subtitle && (
                                <div className="text-xs text-[#8e9297] mt-0.5">
                                  {entityInfo.subtitle}
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                <div className="space-y-6">
                  {/* Human-readable summary */}
                  <div className="bg-[#36393f] rounded-lg p-4 border-l-4 border-[#5865f2]">
                    <p className="text-sm font-medium text-[#8e9297] mb-2">Summary</p>
                    <p className="text-base text-white leading-relaxed">
                      {formatAuditLogMessage(selectedLog)}
                    </p>
                    <p className="text-xs text-[#8e9297] mt-2">
                      {formatDateTime(selectedLog.created_at)}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#8e9297] mb-1">Action Type</p>
                      <p className="text-sm text-white">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                          {getActionIcon(selectedLog.action)} {selectedLog.action}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297] mb-1">Entity</p>
                      {(() => {
                        const entityInfo = formatEntityReadable(selectedLog);
                        return (
                          <div>
                            <p className="text-sm text-white font-medium">{entityInfo.name}</p>
                            {entityInfo.subtitle && (
                              <p className="text-xs text-[#8e9297] mt-0.5">{entityInfo.subtitle}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297] mb-1">Entity Type & ID</p>
                      <p className="text-sm text-white capitalize">{selectedLog.entity_type}</p>
                      {selectedLog.entity_id && (
                        <p className="text-xs text-[#8e9297] font-mono mt-0.5">ID: {selectedLog.entity_id}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297] mb-1">Timestamp</p>
                      <p className="text-sm text-white">{formatDateTime(selectedLog.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297] mb-1">Performed By</p>
                      <p className="text-sm text-white">
                        {selectedLog.user?.first_name} {selectedLog.user?.last_name}
                      </p>
                      <p className="text-xs text-[#8e9297]">{selectedLog.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8e9297] mb-1">IP Address</p>
                      <p className="text-sm text-white font-mono">{selectedLog.ip_address || 'Not recorded'}</p>
                    </div>
                  </div>

                  {/* Changes (if update action) */}
                  {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && 
                   selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                    <div className="pt-4 border-t border-[#202225]">
                      <p className="text-sm font-medium text-[#8e9297] mb-3">Changes Made</p>
                      <div className="bg-[#36393f] rounded-lg p-4 space-y-3">
                        {Object.keys(selectedLog.new_values).map((key) => {
                          const oldVal = selectedLog.old_values[key];
                          const newVal = selectedLog.new_values[key];
                          if (oldVal === newVal) return null;
                          
                          const label = key.split('_').map((w: string) => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                          ).join(' ');
                          
                          return (
                            <div key={key} className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white mb-1">{label}</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-[#ed4245] line-through">{String(oldVal || 'Empty')}</span>
                                  <span className="text-[#8e9297]">→</span>
                                  <span className="text-[#23a55a]">{String(newVal || 'Empty')}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="pt-4 border-t border-[#202225]">
                      <p className="text-sm font-medium text-[#8e9297] mb-3">Additional Information</p>
                      <div className="bg-[#36393f] rounded-lg p-4">
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                          {formatMetadataReadable(selectedLog.metadata, selectedLog) || 
                           'No additional information available.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Raw Data (collapsible for technical details) */}
                  <details className="pt-4 border-t border-[#202225]">
                    <summary className="text-sm font-medium text-[#8e9297] cursor-pointer hover:text-white mb-2">
                      Technical Details (JSON)
                    </summary>
                    <div className="mt-3 space-y-3">
                      {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[#8e9297] mb-1">Old Values</p>
                          <pre className="bg-[#202225] p-3 rounded text-xs text-[#b9bbbe] overflow-x-auto">
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[#8e9297] mb-1">New Values</p>
                          <pre className="bg-[#202225] p-3 rounded text-xs text-[#b9bbbe] overflow-x-auto">
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[#8e9297] mb-1">Metadata</p>
                          <pre className="bg-[#202225] p-3 rounded text-xs text-[#b9bbbe] overflow-x-auto">
                            {JSON.stringify(selectedLog.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
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

