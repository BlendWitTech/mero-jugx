import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Filter, MessageSquare, AtSign, UserPlus, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

type NotificationCategory = 'all' | 'messages' | 'mentions' | 'regular';
type ReadFilter = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<NotificationCategory>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page, readFilter],
    queryFn: async () => {
      const params: any = { page, limit: 100 }; // Get more to readFilter by category
      if (readFilter === 'unread') {
        params.read_status = 'unread';
      } else if (readFilter === 'read') {
        params.read_status = 'read';
      }
      const response = await api.get('/notifications', { params });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 0,
  });

  // Categorize and filter notifications
  const categorizedNotifications = useMemo(() => {
    let notifications = data?.notifications || [];
    
    // Apply read status filter first
    if (readFilter === 'unread') {
      notifications = notifications.filter((n: any) => !n.read_at);
    } else if (readFilter === 'read') {
      notifications = notifications.filter((n: any) => !!n.read_at);
    }
    
    // Then categorize
    const messages = notifications.filter((n: any) => 
      n.type === 'chat.message' || 
      n.type === 'chat.unread' || 
      n.type === 'chat.initiated' ||
      n.type === 'chat.group_added'
    );
    
    const mentions = notifications.filter((n: any) => 
      n.type === 'chat.mention'
    );
    
    const regular = notifications.filter((n: any) => 
      n.type !== 'chat.message' && 
      n.type !== 'chat.unread' && 
      n.type !== 'chat.initiated' &&
      n.type !== 'chat.mention' &&
      n.type !== 'chat.group_added'
    );

    switch (category) {
      case 'messages':
        return messages;
      case 'mentions':
        return mentions;
      case 'regular':
        return regular;
      default:
        return notifications;
    }
  }, [data?.notifications, category, readFilter]);
  
  // Fetch unread count separately
  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
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
      await queryClient.cancelQueries({ queryKey: ['notifications', page, readFilter] });
      const previousData = queryClient.getQueryData(['notifications', page, readFilter]);
      
      queryClient.setQueryData(['notifications', page, readFilter], (old: any) => {
        if (!old) return old;
        const updatedNotifications = old.notifications?.map((n: any) => {
          if (n.id === notificationId) {
            return { ...n, read_at: read ? new Date().toISOString() : null };
          }
          return n;
        }) || [];
        
        if (readFilter === 'unread' && read) {
          return {
            ...old,
            notifications: updatedNotifications.filter((n: any) => !n.read_at),
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
            read_count: (old.read_count || 0) + 1,
          };
        }
        
        if (readFilter === 'read' && !read) {
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
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, readFilter], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      refetchUnreadCount();
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', page, readFilter] });
      await queryClient.cancelQueries({ queryKey: ['notification-unread-count'] });
      
      const previousData = queryClient.getQueryData(['notifications', page, readFilter]);
      const previousCount = queryClient.getQueryData(['notification-unread-count']);
      
      // Optimistically set unread count to 0
      queryClient.setQueryData(['notification-unread-count'], () => ({
        unread_count: 0,
        read_count: (previousCount as any)?.read_count || 0,
      }));
      
      if (readFilter === 'unread') {
        queryClient.setQueryData(['notifications', page, readFilter], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: [],
            unread_count: 0,
            read_count: (old.read_count || 0) + (old.unread_count || 0),
          };
        });
      } else {
        queryClient.setQueryData(['notifications', page, readFilter], (old: any) => {
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
      
      return { previousData, previousCount };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, readFilter], context.previousData);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notification-unread-count'], context.previousCount);
      }
    },
    onSuccess: async () => {
      // Force unread count to 0
      queryClient.setQueryData(['notification-unread-count'], () => ({
        unread_count: 0,
        read_count: (unreadCountData?.read_count || 0) + (unreadCountData?.unread_count || 0),
      }));
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      await refetchUnreadCount();
      await queryClient.refetchQueries({ queryKey: ['notifications', page, readFilter] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', page, readFilter] });
      const previousData = queryClient.getQueryData(['notifications', page, readFilter]);
      
      let wasUnread = false;
      queryClient.setQueryData(['notifications', page, readFilter], (old: any) => {
        if (!old) return old;
        const notification = old.notifications?.find((n: any) => n.id === notificationId);
        wasUnread = notification && !notification.read_at;
        return {
          ...old,
          notifications: old.notifications?.readFilter((n: any) => n.id !== notificationId) || [],
          unread_count: wasUnread 
            ? Math.max(0, (old.unread_count || 0) - 1)
            : old.unread_count || 0,
          read_count: !wasUnread && notification
            ? Math.max(0, (old.read_count || 0) - 1)
            : old.read_count || 0,
        };
      });
      
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
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, readFilter], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      queryClient.refetchQueries({ queryKey: ['notifications', page, readFilter] });
      toast.success('Notification deleted');
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsReadMutation.mutate({ notificationId: notification.id, read: true });
    }

    if (notification.data?.link?.route) {
      const route = notification.data.link.route;
      const params = notification.data.link.params || {};
      
      let finalRoute = route;
      if (params.userId) {
        finalRoute = `/users/${params.userId}`;
      } else if (params.roleId) {
        finalRoute = `/roles/${params.roleId}`;
      } else if (params.invitationId) {
        finalRoute = `/invitations?invitation=${params.invitationId}`;
      } else if (params.chatId) {
        finalRoute = `/chat?chatId=${params.chatId}`;
      } else if (params.tab) {
        finalRoute = `${route}?tab=${params.tab}`;
      }

      navigate(finalRoute);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat.message':
      case 'chat.unread':
        return <MessageSquare className="h-5 w-5 text-[#5865f2]" />;
      case 'chat.mention':
        return <AtSign className="h-5 w-5 text-[#faa61a]" />;
      case 'chat.group_added':
        return <UserPlus className="h-5 w-5 text-[#23a55a]" />;
      default:
        return <Bell className="h-5 w-5 text-[#8e9297]" />;
    }
  };

  const notifications = categorizedNotifications;
  const unreadCount = unreadCountData?.unread_count || data?.unread_count || 0;
  const readCount = unreadCountData?.read_count || data?.read_count || 0;

  // Get counts per category
  const allNotifications = data?.notifications || [];
  const messagesCount = allNotifications.readFilter((n: any) => 
    n.type === 'chat.message' || n.type === 'chat.unread' || n.type === 'chat.initiated' || n.type === 'chat.group_added'
  ).length;
  const mentionsCount = allNotifications.readFilter((n: any) => n.type === 'chat.mention').length;
  const regularCount = allNotifications.readFilter((n: any) => 
    n.type !== 'chat.message' && n.type !== 'chat.unread' && n.type !== 'chat.initiated' && 
    n.type !== 'chat.mention' && n.type !== 'chat.group_added'
  ).length;

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5865f2] rounded-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
            <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Category Tabs (Discord-like) */}
      <div className="card mb-4">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              category === 'all'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            <Hash className="h-4 w-4" />
            All
          </button>
          <button
            onClick={() => setCategory('messages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              category === 'messages'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Messages {messagesCount > 0 && `(${messagesCount})`}
          </button>
          <button
            onClick={() => setCategory('mentions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              category === 'mentions'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            <AtSign className="h-4 w-4" />
            Mentions {mentionsCount > 0 && `(${mentionsCount})`}
          </button>
          <button
            onClick={() => setCategory('regular')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              category === 'regular'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            <Bell className="h-4 w-4" />
            Other {regularCount > 0 && `(${regularCount})`}
          </button>
        </div>
      </div>

      {/* Read Status Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-[#8e9297]" />
          <button
            onClick={() => setReadFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              readFilter === 'all'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              readFilter === 'unread'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              readFilter === 'read'
                ? 'bg-[#5865f2] text-white'
                : 'text-[#b9bbbe] hover:bg-[#393c43]'
            }`}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-[#ed4245]/10 border border-[#ed4245]/20 mb-6">
          <p className="text-[#ed4245]">
            Error loading notifications: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-[#36393f] rounded"></div>
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 text-[#8e9297]" />
            <p className="text-lg font-medium text-white mb-2">No notifications</p>
            <p className="text-[#8e9297]">
              {readFilter === 'unread'
                ? "You're all caught up! No unread notifications."
                : readFilter === 'read'
                ? 'No read notifications yet.'
                : category !== 'all'
                ? `No ${category} notifications found.`
                : "You don't have any notifications yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`card cursor-pointer hover:bg-[#393c43] transition-all ${
                !notification.read_at 
                  ? 'border-l-4 border-l-[#5865f2] bg-[#5865f2]/5' 
                  : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">{notification.title}</h3>
                        {!notification.read_at && (
                          <span className="h-2 w-2 rounded-full bg-[#5865f2] flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-[#b9bbbe]">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#8e9297]">{formatTime(notification.created_at)}</span>
                        {notification.data?.link && (
                          <span className="text-xs text-[#5865f2] flex items-center gap-1">
                            View details <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      {!notification.read_at && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate({ notificationId: notification.id, read: true });
                          }}
                          className="p-1.5 text-[#8e9297] hover:text-[#5865f2] hover:bg-[#393c43] rounded transition-colors"
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
                        className="p-1.5 text-[#8e9297] hover:text-[#ed4245] hover:bg-[#393c43] rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-[#8e9297]">
                Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of{' '}
                {data.total} notifications
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#2f3136] text-white rounded-lg hover:bg-[#393c43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-4 py-2 bg-[#2f3136] text-white rounded-lg hover:bg-[#393c43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
