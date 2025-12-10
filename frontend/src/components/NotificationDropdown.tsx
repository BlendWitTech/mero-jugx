import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();

  // Fetch unread and read count
  const { data: countData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return {
        unread_count: response.data?.unread_count || 0,
        read_count: response.data?.read_count || 0,
      };
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0, // Always consider stale to ensure fresh data
  });

  const unreadCount = countData?.unread_count || 0;

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'dropdown', isOpen],
    queryFn: async () => {
      const response = await api.get('/notifications', {
        params: { page: 1, limit: 10, read_status: 'unread' },
      });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && isOpen,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId, read }: { notificationId: string; read: boolean }) => {
      const response = await api.put(`/notifications/${notificationId}/read`, { read });
      return response.data;
    },
    onMutate: async ({ notificationId, read }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', 'dropdown', isOpen] });
      
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications', 'dropdown', isOpen]);
      
      // Optimistically update to remove from unread list if marking as read
      if (read) {
        queryClient.setQueryData(['notifications', 'dropdown', isOpen], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications?.filter((n: any) => n.id !== notificationId) || [],
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
          };
        });
        
        // Update unread count optimistically
        queryClient.setQueryData(['notification-unread-count'], (old: any) => {
          if (!old) return { unread_count: 0, read_count: 0 };
          return {
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
            read_count: (old.read_count || 0) + 1,
          };
        });
      } else {
        // Marking as unread - update counts
        queryClient.setQueryData(['notification-unread-count'], (old: any) => {
          if (!old) return { unread_count: 1, read_count: 0 };
          return {
            unread_count: (old.unread_count || 0) + 1,
            read_count: Math.max(0, (old.read_count || 0) - 1),
          };
        });
      }
      
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'dropdown', isOpen], context.previousNotifications);
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      refetchUnreadCount();
      // Also invalidate analytics to update read counts
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', 'dropdown', isOpen] });
      await queryClient.cancelQueries({ queryKey: ['notification-unread-count'] });
      
      // Snapshot the previous values
      const previousNotifications = queryClient.getQueryData(['notifications', 'dropdown', isOpen]);
      const previousCount = queryClient.getQueryData(['notification-unread-count']);
      
      // Get current unread count
      const currentUnreadCount = previousCount ? (previousCount as any).unread_count || 0 : 0;
      const currentReadCount = previousCount ? (previousCount as any).read_count || 0 : 0;
      
      // Optimistically clear all unread notifications
      queryClient.setQueryData(['notifications', 'dropdown', isOpen], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: [],
          unread_count: 0,
        };
      });
      
      // Update unread count optimistically - set to 0
      queryClient.setQueryData(['notification-unread-count'], () => {
        return {
          unread_count: 0,
          read_count: currentReadCount + currentUnreadCount,
        };
      });
      
      return { previousNotifications, previousCount };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'dropdown', isOpen], context.previousNotifications);
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
      
      // Force immediate refetch of unread count - wait for it to complete
      await queryClient.refetchQueries({ queryKey: ['notification-unread-count'], exact: true });
      // Also manually refetch using the refetch function
      await refetchUnreadCount();
      // Refetch the dropdown notifications if open
      if (isOpen) {
        queryClient.refetchQueries({ queryKey: ['notifications', 'dropdown', isOpen] });
      }
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', 'dropdown', isOpen] });
      
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications', 'dropdown', isOpen]);
      
      // Optimistically remove the notification
      queryClient.setQueryData(['notifications', 'dropdown', isOpen], (old: any) => {
        if (!old) return old;
        const notification = old.notifications?.find((n: any) => n.id === notificationId);
        return {
          ...old,
          notifications: old.notifications?.filter((n: any) => n.id !== notificationId) || [],
          unread_count: notification && !notification.read_at 
            ? Math.max(0, (old.unread_count || 0) - 1)
            : old.unread_count || 0,
        };
      });
      
      // Update unread count optimistically if notification was unread
      const notification = notificationsData?.notifications?.find((n: any) => n.id === notificationId);
      if (notification && !notification.read_at) {
        queryClient.setQueryData(['notification-unread-count'], (old: any) => {
          if (!old) return { unread_count: 0, read_count: 0 };
          return {
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
            read_count: old.read_count || 0,
          };
        });
      }
      
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'dropdown', isOpen], context.previousNotifications);
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      // Refetch the dropdown notifications if open
      if (isOpen) {
        queryClient.refetchQueries({ queryKey: ['notifications', 'dropdown', isOpen] });
      }
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

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
      setIsOpen(false);
    }
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

  const notifications = notificationsData?.notifications || [];
  const hasUnread = (unreadCount || 0) > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {hasUnread && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#ed4245] ring-2 ring-[#36393f]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] z-50 max-h-[600px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#202225]">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              {hasUnread && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-sm text-[#5865f2] hover:text-[#4752c4] disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#b9bbbe] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
            {isLoading ? (
              <div className="p-4 text-center text-[#b9bbbe]">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-2 text-[#8e9297]" />
                <p className="text-[#b9bbbe]">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-[#202225]">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-[#393c43] transition-colors cursor-pointer ${
                      !notification.read_at ? 'bg-[#5865f2]/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          {!notification.read_at && (
                            <span className="mt-1.5 mr-2 h-2 w-2 rounded-full bg-[#5865f2] flex-shrink-0"></span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                              {notification.data?.message_count > 1 && (
                                <span className="ml-2 text-xs text-[#5865f2]">
                                  ({notification.data.message_count} messages)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-[#b9bbbe] mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-[#8e9297]">{formatTime(notification.created_at)}</span>
                              {notification.data?.link && (
                                <span className="text-xs text-[#5865f2] flex items-center">
                                  View <ExternalLink className="h-3 w-3 ml-1" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read_at && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate({ notificationId: notification.id, read: true });
                            }}
                            className="p-1 text-[#b9bbbe] hover:text-[#5865f2]"
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
                          className="p-1 text-[#b9bbbe] hover:text-[#ed4245]"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#202225]">
              <button
                onClick={() => {
                  if (organization?.slug) {
                    navigate(`/org/${organization.slug}/notifications`);
                  } else {
                    navigate('/notifications');
                  }
                  setIsOpen(false);
                }}
                className="w-full text-sm text-[#5865f2] hover:text-[#4752c4] font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

