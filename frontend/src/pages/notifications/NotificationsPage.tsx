import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (filter === 'unread') {
        params.read_status = 'unread';
      } else if (filter === 'read') {
        params.read_status = 'read';
      }
      const response = await api.get('/notifications', { params });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 0, // Always consider stale to ensure fresh data
  });
  
  // Also fetch unread count separately to ensure it updates
  const { refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return {
        unread_count: response.data?.unread_count || 0,
        read_count: response.data?.read_count || 0,
      };
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 0,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId, read }: { notificationId: string; read: boolean }) => {
      const response = await api.put(`/notifications/${notificationId}/read`, { read });
      return response.data;
    },
    onMutate: async ({ notificationId, read }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', page, filter] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['notifications', page, filter]);
      
        // Optimistically update
        queryClient.setQueryData(['notifications', page, filter], (old: any) => {
          if (!old) return old;
          
          const updatedNotifications = old.notifications?.map((n: any) => {
            if (n.id === notificationId) {
              return {
                ...n,
                read_at: read ? new Date().toISOString() : null,
              };
            }
            return n;
          }) || [];
          
          // If filtering by unread and marking as read, remove from list
          if (filter === 'unread' && read) {
            return {
              ...old,
              notifications: updatedNotifications.filter((n: any) => !n.read_at),
              unread_count: Math.max(0, (old.unread_count || 0) - 1),
              read_count: (old.read_count || 0) + 1,
            };
          }
          
          // If filtering by read and marking as unread, remove from list
          if (filter === 'read' && !read) {
            return {
              ...old,
              notifications: updatedNotifications.filter((n: any) => n.read_at),
              unread_count: (old.unread_count || 0) + 1,
              read_count: Math.max(0, (old.read_count || 0) - 1),
            };
          }
          
          return {
            ...old,
            notifications: updatedNotifications,
            unread_count: read 
              ? Math.max(0, (old.unread_count || 0) - 1)
              : (old.unread_count || 0) + 1,
            read_count: read
              ? (old.read_count || 0) + 1
              : Math.max(0, (old.read_count || 0) - 1),
          };
        });
        
        // Update unread count query optimistically
        queryClient.setQueryData(['notification-unread-count'], (old: any) => {
          if (!old) return { unread_count: 0, read_count: 0 };
          return {
            unread_count: read 
              ? Math.max(0, (old.unread_count || 0) - 1)
              : (old.unread_count || 0) + 1,
            read_count: read
              ? (old.read_count || 0) + 1
              : Math.max(0, (old.read_count || 0) - 1),
          };
        });
        
        return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, filter], context.previousData);
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      // Refetch current query
      queryClient.refetchQueries({ queryKey: ['notifications', page, filter] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', page, filter] });
      await queryClient.cancelQueries({ queryKey: ['notification-unread-count'] });
      
      // Snapshot the previous values
      const previousData = queryClient.getQueryData(['notifications', page, filter]);
      const previousCount = queryClient.getQueryData(['notification-unread-count']);
      
      // Get current unread count from the count query
      const currentUnreadCount = previousCount ? (previousCount as any).unread_count || 0 : 0;
      const currentReadCount = previousCount ? (previousCount as any).read_count || 0 : 0;
      
      // Optimistically clear unread notifications if filtering by unread
      if (filter === 'unread') {
        queryClient.setQueryData(['notifications', page, filter], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: [],
            unread_count: 0,
            read_count: (old.read_count || 0) + (old.unread_count || 0),
          };
        });
      } else {
        // Update all notifications to read
        queryClient.setQueryData(['notifications', page, filter], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications?.map((n: any) => ({
              ...n,
              read_at: n.read_at || new Date().toISOString(),
            })) || [],
            unread_count: 0,
            read_count: (old.read_count || 0) + (old.unread_count || 0),
          };
        });
      }
      
      // Update unread count query optimistically - CRITICAL: Set to 0
      queryClient.setQueryData(['notification-unread-count'], () => {
        return {
          unread_count: 0,
          read_count: currentReadCount + currentUnreadCount,
        };
      });
      
      return { previousData, previousCount };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, filter], context.previousData);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notification-unread-count'], context.previousCount);
      }
    },
    onSuccess: async (data) => {
      // Update unread count to 0 based on backend response
      queryClient.setQueryData(['notification-unread-count'], (old: any) => {
        const currentUnread = old?.unread_count || 0;
        const currentRead = old?.read_count || 0;
        return {
          unread_count: 0,
          read_count: currentRead + currentUnread,
        };
      });
      
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      
      // Force immediate refetch of unread count with exact match
      await queryClient.refetchQueries({ queryKey: ['notification-unread-count'], exact: true });
      // Also manually refetch
      await refetchUnreadCount();
      // Refetch current query
      await queryClient.refetchQueries({ queryKey: ['notifications', page, filter] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', page, filter] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['notifications', page, filter]);
      
      // Optimistically remove the notification
      queryClient.setQueryData(['notifications', page, filter], (old: any) => {
        if (!old) return old;
        const notification = old.notifications?.find((n: any) => n.id === notificationId);
        const wasUnread = notification && !notification.read_at;
        return {
          ...old,
          notifications: old.notifications?.filter((n: any) => n.id !== notificationId) || [],
          unread_count: wasUnread 
            ? Math.max(0, (old.unread_count || 0) - 1)
            : old.unread_count || 0,
          read_count: !wasUnread && notification
            ? Math.max(0, (old.read_count || 0) - 1)
            : old.read_count || 0,
        };
      });
      
      // Update unread count query optimistically if notification was unread
      if (wasUnread) {
        queryClient.setQueryData(['notification-unread-count'], (old: any) => {
          if (!old) return { unread_count: 0, read_count: 0 };
          return {
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
            read_count: old.read_count || 0,
          };
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, filter], context.previousData);
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      // Refetch current query
      queryClient.refetchQueries({ queryKey: ['notifications', page, filter] });
      toast.success('Notification deleted');
    },
  });

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (!notification.read_at) {
      markAsReadMutation.mutate({ notificationId: notification.id, read: true });
    }

    // Navigate to the link if available
    if (notification.data?.link?.route) {
      const route = notification.data.link.route;
      const params = notification.data.link.params || {};
      
      // Build route with params
      let finalRoute = route;
      if (params.userId) {
        finalRoute = `/users/${params.userId}`;
      } else if (params.roleId) {
        finalRoute = `/roles/${params.roleId}`;
      } else if (params.invitationId) {
        finalRoute = `/invitations?invitation=${params.invitationId}`;
      } else if (params.tab) {
        finalRoute = `${route}?tab=${params.tab}`;
      }

      navigate(finalRoute);
    }
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;
  const readCount = data?.read_count || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn btn-secondary"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-800">
            Error loading notifications: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">No notifications</p>
            <p className="text-gray-500">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? 'No read notifications yet.'
                : "You don't have any notifications yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`card cursor-pointer hover:shadow-md transition-all ${
                !notification.read_at ? 'border-l-4 border-l-primary-600 bg-primary-50/30' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start">
                    {!notification.read_at && (
                      <span className="mt-1.5 mr-3 h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">{notification.title}</h3>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate({ notificationId: notification.id, read: true });
                              }}
                              className="p-1 text-gray-400 hover:text-primary-600"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                        {notification.data?.link && (
                          <span className="text-xs text-primary-600 flex items-center">
                            View details <ExternalLink className="h-3 w-3 ml-1" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of{' '}
                {data.total} notifications
              </div>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

