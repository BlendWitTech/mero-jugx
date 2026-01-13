import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Filter, MessageSquare, AtSign, UserPlus, Hash } from 'lucide-react';
import toast from '@shared/hooks/useToast';
import { useTheme } from '../../contexts/ThemeContext';

type NotificationCategory = 'all' | 'messages' | 'mentions' | 'regular';
type ReadFilter = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<NotificationCategory>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  // Fetch all notifications (without read_status filter) to get accurate counts
  const { data: allNotificationsData } = useQuery({
    queryKey: ['notifications', 'all', page],
    queryFn: async () => {
      const response = await api.get('/notifications', { 
        params: { page, limit: 100 } 
      });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 0,
  });

  // Fetch filtered notifications based on readFilter
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
    queryKey: ['notification-unread-count', organization?.id],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return {
        unread_count: response.data?.unread_count || 0,
        read_count: response.data?.read_count || 0,
      };
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id,
    staleTime: 0,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId, read }: { notificationId: string; read: boolean }) => {
      const response = await api.put(`/notifications/${notificationId}/read`, { read });
      return response.data;
    },
    onMutate: async ({ notificationId, read }) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', page, readFilter] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'all', page] });
      const previousData = queryClient.getQueryData(['notifications', page, readFilter]);
      const previousAllData = queryClient.getQueryData(['notifications', 'all', page]);
      
      // Update the 'all' notifications query
      queryClient.setQueryData(['notifications', 'all', page], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications?.map((n: any) => {
            if (n.id === notificationId) {
              return { ...n, read_at: read ? new Date().toISOString() : null };
            }
            return n;
          }) || [],
        };
      });
      
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
      
      queryClient.setQueryData(['notification-unread-count', organization?.id], (old: any) => {
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
      
      return { previousData, previousAllData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, readFilter], context.previousData);
      }
      if (context?.previousAllData) {
        queryClient.setQueryData(['notifications', 'all', page], context.previousAllData);
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch to ensure counts are accurate
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count', organization?.id] });
      // Refetch both queries to ensure counts are synchronized
      await Promise.all([
        refetchUnreadCount(),
        queryClient.refetchQueries({ queryKey: ['notifications', page, readFilter] }),
        queryClient.refetchQueries({ queryKey: ['notifications', 'all', page] }),
      ]);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', page, readFilter] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'all', page] });
      await queryClient.cancelQueries({ queryKey: ['notification-unread-count', organization?.id] });
      
      const previousData = queryClient.getQueryData(['notifications', page, readFilter]);
      const previousAllData = queryClient.getQueryData(['notifications', 'all', page]);
      const previousCount = queryClient.getQueryData(['notification-unread-count', organization?.id]) as any;
      const currentUnread = previousCount?.unread_count || 0;
      const currentRead = previousCount?.read_count || 0;
      
      // Optimistically set unread count to 0 and add all unread to read
      queryClient.setQueryData(['notification-unread-count', organization?.id], {
        unread_count: 0,
        read_count: currentRead + currentUnread,
      });
      
      // Update the 'all' notifications query
      queryClient.setQueryData(['notifications', 'all', page], (old: any) => {
        if (!old) return old;
        const now = new Date().toISOString();
        return {
          ...old,
          notifications: old.notifications?.map((n: any) => ({
            ...n,
            read_at: n.read_at || now,
          })) || [],
        };
      });
      
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
      
      return { previousData, previousAllData, previousCount };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, readFilter], context.previousData);
      }
      if (context?.previousAllData) {
        queryClient.setQueryData(['notifications', 'all', page], context.previousAllData);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notification-unread-count'], context.previousCount);
      }
    },
    onSuccess: async () => {
      // Get current counts before updating
      const currentCountData = queryClient.getQueryData(['notification-unread-count', organization?.id]) as any;
      const currentUnread = currentCountData?.unread_count || 0;
      const currentRead = currentCountData?.read_count || 0;
      
      // Force unread count to 0 and add all unread to read
      queryClient.setQueryData(['notification-unread-count', organization?.id], {
        unread_count: 0,
        read_count: currentRead + currentUnread,
      });
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count', organization?.id] });
      await Promise.all([
        refetchUnreadCount(),
        queryClient.refetchQueries({ queryKey: ['notifications', page, readFilter] }),
        queryClient.refetchQueries({ queryKey: ['notifications', 'all', page] }),
      ]);
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', page, readFilter] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'all', page] });
      const previousData = queryClient.getQueryData(['notifications', page, readFilter]);
      const previousAllData = queryClient.getQueryData(['notifications', 'all', page]);
      
      let wasUnread = false;
      queryClient.setQueryData(['notifications', page, readFilter], (old: any) => {
        if (!old) return old;
        const notification = old.notifications?.find((n: any) => n.id === notificationId);
        wasUnread = notification && !notification.read_at;
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
      
      // Update the 'all' notifications query
      queryClient.setQueryData(['notifications', 'all', page], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications?.filter((n: any) => n.id !== notificationId) || [],
        };
      });
      
      if (wasUnread) {
        queryClient.setQueryData(['notification-unread-count', organization?.id], (old: any) => {
          if (!old) return { unread_count: 0, read_count: 0 };
          return {
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
            read_count: old.read_count || 0,
          };
        });
      }
      
      return { previousData, previousAllData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', page, readFilter], context.previousData);
      }
      if (context?.previousAllData) {
        queryClient.setQueryData(['notifications', 'all', page], context.previousAllData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count', organization?.id] });
      queryClient.refetchQueries({ queryKey: ['notifications', page, readFilter] });
      queryClient.refetchQueries({ queryKey: ['notifications', 'all', page] });
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
        return <MessageSquare className="h-5 w-5" style={{ color: theme.colors.primary }} />;
      case 'chat.mention':
        return <AtSign className="h-5 w-5" style={{ color: '#faa61a' }} />; // Keep mention color distinct
      case 'chat.group_added':
        return <UserPlus className="h-5 w-5" style={{ color: '#23a55a' }} />; // Keep success color distinct
      default:
        return <Bell className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />;
    }
  };

  const notifications = categorizedNotifications;
  
  // Use all notifications data (not filtered) for accurate counts
  const allNotifications = allNotificationsData?.notifications || data?.notifications || [];
  
  // Calculate counts from all notifications (not filtered) to ensure accuracy
  const calculatedUnreadCount = useMemo(() => {
    return allNotifications.filter((n: any) => !n.read_at).length;
  }, [allNotifications]);
  
  const calculatedReadCount = useMemo(() => {
    return allNotifications.filter((n: any) => !!n.read_at).length;
  }, [allNotifications]);
  
  // Use unreadCountData as primary source, but sync with calculated counts if there's a mismatch
  const unreadCount = unreadCountData?.unread_count ?? calculatedUnreadCount;
  const readCount = unreadCountData?.read_count ?? calculatedReadCount;
  const totalCount = unreadCount + readCount;
  
  // Sync counts when notifications data changes
  useEffect(() => {
    if (allNotifications.length > 0 && unreadCountData) {
      const actualUnread = calculatedUnreadCount;
      const actualRead = calculatedReadCount;
      
      // If there's a mismatch, update the cache
      if (unreadCountData.unread_count !== actualUnread || unreadCountData.read_count !== actualRead) {
        queryClient.setQueryData(['notification-unread-count', organization?.id], {
          unread_count: actualUnread,
          read_count: actualRead,
        });
      }
    }
  }, [allNotifications, unreadCountData, calculatedUnreadCount, calculatedReadCount, organization?.id, queryClient]);

  // Get counts per category from all notifications
  const messagesCount = allNotifications.filter((n: any) => 
    n.type === 'chat.message' || n.type === 'chat.unread' || n.type === 'chat.initiated' || n.type === 'chat.group_added'
  ).length;
  const mentionsCount = allNotifications.filter((n: any) => n.type === 'chat.mention').length;
  const regularCount = allNotifications.filter((n: any) => 
    n.type !== 'chat.message' && n.type !== 'chat.unread' && n.type !== 'chat.initiated' && 
    n.type !== 'chat.mention' && n.type !== 'chat.group_added'
  ).length;

  return (
    <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
            <Bell className="h-6 w-6" style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>Notifications</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
            onMouseEnter={(e) => {
              if (!markAllAsReadMutation.isPending) {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!markAllAsReadMutation.isPending) {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }
            }}
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="card mb-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setCategory('all')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
            style={
              category === 'all'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (category !== 'all') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (category !== 'all') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Hash className="h-4 w-4" />
            All {totalCount > 0 && `(${totalCount})`}
          </button>
          <button
            onClick={() => setCategory('messages')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
            style={
              category === 'messages'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (category !== 'messages') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (category !== 'messages') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Messages {messagesCount > 0 && `(${messagesCount})`}
          </button>
          <button
            onClick={() => setCategory('mentions')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
            style={
              category === 'mentions'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (category !== 'mentions') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (category !== 'mentions') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <AtSign className="h-4 w-4" />
            Mentions {mentionsCount > 0 && `(${mentionsCount})`}
          </button>
          <button
            onClick={() => setCategory('regular')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
            style={
              category === 'regular'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (category !== 'regular') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (category !== 'regular') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Bell className="h-4 w-4" />
            Other {regularCount > 0 && `(${regularCount})`}
          </button>
        </div>
      </div>

      {/* Read Status Filters */}
      <div className="card mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />
          <button
            onClick={() => setReadFilter('all')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              readFilter === 'all'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (readFilter !== 'all') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (readFilter !== 'all') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              readFilter === 'unread'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (readFilter !== 'unread') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (readFilter !== 'unread') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              readFilter === 'read'
                ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                : { color: theme.colors.textSecondary, backgroundColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (readFilter !== 'read') {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            onMouseLeave={(e) => {
              if (readFilter !== 'read') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <p style={{ color: '#ed4245' }}>
            Error loading notifications: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded" style={{ backgroundColor: theme.colors.background }}></div>
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
            <p className="text-lg font-medium mb-2" style={{ color: theme.colors.text }}>No notifications</p>
            <p style={{ color: theme.colors.textSecondary }}>
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
              className="card cursor-pointer transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderLeft: !notification.read_at ? `4px solid ${theme.colors.primary}` : undefined,
                background: !notification.read_at 
                  ? `linear-gradient(to right, ${theme.colors.primary}0D, ${theme.colors.surface})`
                  : theme.colors.surface,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = !notification.read_at 
                  ? theme.colors.surface
                  : theme.colors.surface;
              }}
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
                        <h3 className="text-base font-semibold" style={{ color: theme.colors.text }}>{notification.title}</h3>
                        {!notification.read_at && (
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.colors.primary }}></span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{formatTime(notification.created_at)}</span>
                        {notification.data?.link && (
                          <span className="text-xs flex items-center gap-1" style={{ color: theme.colors.primary }}>
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
                          className="p-1.5 rounded transition-colors"
                          style={{ color: theme.colors.textSecondary }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = theme.colors.primary;
                            e.currentTarget.style.backgroundColor = theme.colors.background;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = theme.colors.textSecondary;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
                        className="p-1.5 rounded transition-colors"
                        style={{ color: theme.colors.textSecondary }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ed4245';
                          e.currentTarget.style.backgroundColor = theme.colors.background;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = theme.colors.textSecondary;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
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
              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of{' '}
                {data.total} notifications
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: theme.colors.surface, 
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    if (page !== 1) {
                      e.currentTarget.style.backgroundColor = theme.colors.background;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page !== 1) {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                    }
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: theme.colors.surface, 
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    if (page !== data.totalPages) {
                      e.currentTarget.style.backgroundColor = theme.colors.background;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page !== data.totalPages) {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                    }
                  }}
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
