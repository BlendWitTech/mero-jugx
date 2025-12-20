import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { chatService, Chat, Message } from '../services/chatService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { Send, X, Users, User, Minimize2, ChevronRight, ChevronLeft, Phone, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import CallWindow from './CallWindow';

interface ChatWindowProps {
  chatId: string | null;
  userId?: string | null; // For creating new direct chat
  userName?: string | null; // User's name for direct chats (when opening from members list)
  onClose: () => void;
  onMinimize?: () => void;
  onChatLoaded?: (chatName: string, initials: string) => void;
}

export default function ChatWindow({ chatId, userId, userName, onClose, onMinimize, onChatLoaded }: ChatWindowProps) {
  const { organization, accessToken, user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Deduplicate messages before rendering to prevent duplicate keys
  const uniqueMessages = useMemo(() => {
    const messageMap = new Map<string, Message>();
    messages.forEach((m) => {
      if (m && m.id) {
        messageMap.set(m.id, m);
      }
    });
    return Array.from(messageMap.values()).sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
  }, [messages]);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    type: 'audio' | 'video';
    isIncoming?: boolean;
    offer?: RTCSessionDescriptionInit;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Store handler in ref to persist through re-renders
  const messageHandlerRef = useRef<((data: { message: Message; chat_id: string }) => void) | null>(null);

  // Check if organization has chat access
  const { data: currentPackage } = useQuery({
    queryKey: ['current-package'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/package');
      return response.data;
    },
    enabled: !!organization?.id,
    retry: false,
  });

  const hasChatAccess = currentPackage && (
    currentPackage.package?.slug === 'platinum' || 
    currentPackage.package?.slug === 'diamond' ||
    (currentPackage.active_features || []).some((f: any) => f.feature?.slug === 'chat-system')
  );

  // Load or create chat
  useEffect(() => {
    const loadChat = async () => {
      if (!organization?.id || !accessToken) return;
      
      // Prevent multiple simultaneous loads
      if (isLoading && chat) return;

      try {
        let chatData: Chat | null = null;

        if (chatId) {
          // Load existing chat
          chatData = await chatService.getChat(organization.id, chatId);
        } else if (userId) {
          // Create new direct chat
          try {
            chatData = await chatService.createChat(organization.id, {
              type: 'direct',
              member_ids: [userId],
            });
          } catch (error: any) {
            // Error toast is already handled by API interceptor
            // No need to show duplicate toast here
            onClose();
            return;
          }
        }

        if (chatData) {
          setChat(chatData);
          setIsLoading(false);
        }
      } catch (error: any) {
        // Error toast is already handled by API interceptor
        // No need to show duplicate toast here
        onClose();
      }
    };

    // Only load if we don't have a chat yet or the chatId/userId changed
    if ((chatId && chat?.id !== chatId) || (userId && !chat)) {
      setIsLoading(true);
      loadChat();
    }
  }, [chatId, userId]);

  // Connect WebSocket
  useEffect(() => {
    if (!organization?.id || !accessToken || !chat) return;

    const ws = chatService.connect(organization.id, accessToken);
    setSocket(ws);

    // Wait for socket to be connected before joining
    const joinChat = () => {
      if (ws.connected) {
        console.log('[ChatWindow] Socket already connected, joining chat room:', chat.id);
        ws.emit('chat:join', { chat_id: chat.id });
      } else {
        console.log('[ChatWindow] Socket not connected, waiting for connect event');
        const connectHandler = () => {
          console.log('[ChatWindow] Socket connected, joining chat room:', chat.id);
          ws.emit('chat:join', { chat_id: chat.id });
          ws.off('connect', connectHandler); // Remove this one-time handler
        };
        ws.on('connect', connectHandler);
      }
    };

    // Join chat room
    joinChat();
    
    // WebSocket event handlers
    const handleNewMessage = (data: { message: Message; chat_id: string }) => {
      console.log('[ChatWindow] Received message:new event', { 
        chat_id: data.chat_id, 
        message_id: data.message.id, 
        current_chat_id: chat.id,
        message_content: data.message.content?.substring(0, 50),
        socket_connected: ws.connected
      });
      if (chat.id === data.chat_id) {
        // Update query cache first (source of truth)
        queryClient.setQueryData(['messages', chat.id], (old: any) => {
          if (!old) {
            return {
              messages: [data.message],
              total: 1,
              page: 1,
              limit: 50,
            };
          }
          
          // Check if message already exists - use Map for efficient deduplication
          const existingMessages = old.messages || [];
          const messageMap = new Map<string, Message>();
          
          // Add all existing messages to map
          existingMessages.forEach((m: Message) => {
            if (m && m.id) {
              messageMap.set(m.id, m);
            }
          });
          
          // Check if new message already exists
          if (messageMap.has(data.message.id)) {
            console.log('[ChatWindow] Message already in cache, skipping');
            return old;
          }
          
          console.log('[ChatWindow] Adding message to cache');
          // Add new message to map (this automatically handles duplicates)
          messageMap.set(data.message.id, data.message);
          
          // Convert to array and sort by created_at
          const updatedMessages = Array.from(messageMap.values()).sort((a: Message, b: Message) => {
            const aTime = new Date(a.created_at || 0).getTime();
            const bTime = new Date(b.created_at || 0).getTime();
            return aTime - bTime;
          });
          
          return {
            ...old,
            messages: updatedMessages,
            total: updatedMessages.length,
          };
        });
        
        // Don't update local state here - let the useEffect handle it from query cache
        // This prevents race conditions and ensures single source of truth
        
        // Use requestAnimationFrame to ensure state update happens before scroll
        requestAnimationFrame(() => {
          scrollToBottom();
        });
        
        // Mark message as delivered if it's not from current user
        if (data.message.sender_id !== currentUser?.id && ws.connected) {
          ws.emit('message:delivered', { message_ids: [data.message.id] });
          console.log('[ChatWindow] Marked message as delivered:', data.message.id);
        }
        
        // Mark as read since user is viewing this chat
        // Also call backend to mark messages as read
        if (organization?.id && chat.id === data.chat_id) {
          // Update cache optimistically
          queryClient.setQueryData(['chats', organization.id], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              chats: old.chats.map((c: any) =>
                c.id === data.chat_id
                  ? { ...c, unread_count: 0, last_message: data.message }
                  : c
              ),
            };
          });
          
          // Mark message as read via WebSocket
          if (data.message.sender_id !== currentUser?.id && ws.connected) {
            ws.emit('message:read', { chat_id: chat.id, message_ids: [data.message.id] });
            console.log('[ChatWindow] Marked message as read:', data.message.id);
          }
          
          // Call backend to mark messages as read (since user is viewing the chat)
          // This ensures unread_count is properly updated in the database
          chatService.getMessages(organization.id, chat.id, { limit: 1 }).catch((error) => {
            console.error('[ChatWindow] Error marking messages as read:', error);
          });
        }
      } else {
        console.log('[ChatWindow] Message for different chat (expected:', chat.id, 'got:', data.chat_id, '), ignoring');
      }
    };

    // Store handler in ref so it persists through re-renders
    messageHandlerRef.current = handleNewMessage;

    // Also try to join on reconnect and re-attach listeners
    const reconnectHandler = () => {
      console.log('[ChatWindow] Socket reconnected, joining chat room:', chat.id);
      ws.emit('chat:join', { chat_id: chat.id });
      // Re-attach message listener after reconnect using ref
      if (messageHandlerRef.current) {
        // Remove any existing listener first
        ws.off('message:new');
        ws.on('message:new', messageHandlerRef.current);
        console.log('[ChatWindow] Re-attached message:new listener after reconnect');
      }
    };
    ws.on('connect', reconnectHandler);

    console.log('[ChatWindow] Attaching message:new listener for chat:', chat.id, 'socket connected:', ws.connected, 'socket ID:', ws.id);
    ws.on('message:new', handleNewMessage);
    
    // Listen for message delivery status updates
    const handleMessageDelivered = (data: { message_ids: string[]; delivered_to: string; delivered_at: string }) => {
      console.log('[ChatWindow] Message delivered:', data);
      // Update message read status in cache
      queryClient.setQueryData(['messages', chat.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m: Message) => {
            if (data.message_ids.includes(m.id) && m.sender_id === currentUser?.id) {
              return {
                ...m,
                read_status: {
                  ...m.read_status,
                  delivered_at: data.delivered_at,
                },
              };
            }
            return m;
          }),
        };
      });
    };
    ws.on('message:delivered', handleMessageDelivered);
    
    // Listen for message read status updates
    const handleMessageRead = (data: { message_ids: string[]; read_by: string; read_at: string }) => {
      console.log('[ChatWindow] Message read:', data);
      // Update message read status in cache
      queryClient.setQueryData(['messages', chat.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m: Message) => {
            if (data.message_ids.includes(m.id) && m.sender_id === currentUser?.id) {
              return {
                ...m,
                read_status: {
                  ...m.read_status,
                  read_at: data.read_at,
                },
              };
            }
            return m;
          }),
        };
      });
    };
    ws.on('message:read', handleMessageRead);
    
    // Also listen for messages immediately if socket is already connected
    if (ws.connected) {
      console.log('[ChatWindow] Socket already connected, listener should be active');
    }

    // Call event handlers
    ws.on('call:incoming', (data: { 
      chatId: string; 
      otherUserId: string; 
      otherUserName: string; 
      callType: 'audio' | 'video';
      offer: RTCSessionDescriptionInit;
    }) => {
      if (chat.id === data.chatId) {
        setActiveCall({
          type: data.callType,
          isIncoming: true,
          offer: data.offer,
        });
      }
    });

    ws.on('call:rejected', () => {
      setActiveCall(null);
      toast.error('Call was rejected');
    });

    ws.on('call:ended', () => {
      setActiveCall(null);
    });

    ws.on('error', (error: { message: string }) => {
      toast.error(error.message || 'WebSocket error');
    });

    return () => {
      console.log('[ChatWindow] Cleaning up WebSocket listeners for chat:', chat?.id);
      if (chat?.id && ws.connected) {
        ws.emit('chat:leave', { chat_id: chat.id });
      }
      
      // Refresh chats list to get accurate unread counts from backend
      if (chat?.id && organization?.id) {
        // Invalidate to refetch from backend
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['chats', organization.id] });
        }, 100);
      }
      
      // Remove event listeners but don't disconnect the socket
      // The socket is shared with ChatManager
      if (messageHandlerRef.current) {
        ws.off('message:new', messageHandlerRef.current);
      }
      ws.off('connect', reconnectHandler);
      ws.off('message:delivered');
      ws.off('message:read');
      ws.off('call:incoming');
      ws.off('call:rejected');
      ws.off('call:ended');
      ws.off('error');
      messageHandlerRef.current = null;
    };
  }, [organization?.id, accessToken, chat?.id, queryClient, currentUser?.id]);

  // Load messages - backend automatically marks messages as read when getMessages is called
  const { data: messagesData } = useQuery({
    queryKey: ['messages', chat?.id],
    queryFn: async () => {
      if (!organization?.id || !chat?.id) return { messages: [], total: 0, page: 1, limit: 50 };
      const result = await chatService.getMessages(organization.id, chat.id, { limit: 50 });
      // The backend automatically marks messages as read when getMessages is called
      // Update the query cache to reflect unread_count = 0
      if (organization?.id && chat?.id) {
        queryClient.setQueryData(['chats', organization.id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            chats: old.chats.map((c: any) =>
              c.id === chat.id
                ? { ...c, unread_count: 0 }
                : c
            ),
          };
        });
      }
      return result;
    },
    enabled: !!chat?.id && !!organization?.id,
    // Refetch when chat window opens to ensure messages are marked as read
    refetchOnMount: true,
  });

  // Mark messages as read when chat window opens
  useEffect(() => {
    if (!chat?.id || !organization?.id) return;
    
    // The backend getMessages call above already marks messages as read
    // But we also explicitly call it here to ensure it happens even if cache exists
    const markAsRead = async () => {
      try {
        // Call getMessages with minimal params to trigger backend mark-as-read
        // This ensures messages are marked as read even if query cache exists
        await chatService.getMessages(organization.id, chat.id, { limit: 1 });
        
        // Update cache to reflect unread_count = 0
        queryClient.setQueryData(['chats', organization.id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            chats: old.chats.map((c: any) =>
              c.id === chat.id
                ? { ...c, unread_count: 0 }
                : c
            ),
          };
        });
      } catch (error) {
        console.error('[ChatWindow] Error marking messages as read:', error);
      }
    };
    
    // Mark as read when chat window opens
    markAsRead();
  }, [chat?.id, organization?.id, queryClient]);

  useEffect(() => {
    if (messagesData && messagesData.messages) {
      // Use messages from query cache as source of truth
      // Deduplicate by ID using Map to ensure uniqueness
      const messageMap = new Map<string, Message>();
      messagesData.messages.forEach((m: Message) => {
        if (m && m.id) {
          messageMap.set(m.id, m);
        }
      });
      
      // Convert to array and sort by created_at
      const uniqueMessages = Array.from(messageMap.values()).sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return aTime - bTime;
      });
      
      // Always set messages from query cache (it's the source of truth)
      // This ensures we don't have duplicates from WebSocket + query cache
      setMessages(uniqueMessages);
      scrollToBottom();
    }
  }, [messagesData]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!organization?.id || !chat?.id) throw new Error('No chat selected');
      return await chatService.sendMessage(organization.id, chat.id, {
        type: 'text',
        content,
      });
    },
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');
      scrollToBottom();
      queryClient.invalidateQueries({ queryKey: ['chats', organization?.id] });
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to send messages in this chat.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !chat) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  // Get the other user's ID from chat members or userId prop
  const otherUserId = chat?.type === 'direct' 
    ? (chat.members?.find((m: any) => m.user_id !== currentUser?.id)?.user_id || userId)
    : null;

  // Fetch user details if we have userId but no user in chat members
  const { data: userData } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: async () => {
      if (!otherUserId || !organization?.id) return null;
      try {
        const response = await api.get(`/users/${otherUserId}`);
        return response.data;
      } catch (error: any) {
        // If we can't fetch user (e.g., permission denied), try to get from members list
        // The error will be shown by the global error handler, so we just return null here
        return null;
      }
    },
    enabled: !!otherUserId && !!organization?.id && chat?.type === 'direct' && !chat.members?.find((m: any) => m.user_id === otherUserId)?.user,
    retry: false, // Don't retry on permission errors
  });

  // Get chat name - for direct chats, find the other member
  const getChatName = () => {
    if (!chat) return '';
    if (chat.type === 'direct') {
      // First priority: use userName prop if provided (from MembersList)
      if (userName) {
        return userName;
      }
      
      // Second priority: get from chat member user object
      const otherMember = chat.members?.find((m: any) => m.user_id !== currentUser?.id);
      if (otherMember?.user) {
        const firstName = otherMember.user.first_name || '';
        const lastName = otherMember.user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || otherMember.user.email || 'User';
      }
      
      // Third priority: use fetched user data
      if (otherUserId && userData) {
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || userData.email || 'User';
      }
      
      // Fallback
      return 'User';
    }
    return chat.name || 'Group Chat';
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const chatName = chat ? getChatName() : '';
  const initials = chatName && chatName !== 'Group Chat' && chatName !== 'Loading...' && chatName !== 'Unknown User'
    ? getInitials(chatName) 
    : chat?.type === 'group' ? 'GC' : (chatName === 'Loading...' ? '...' : 'U');

  // Track if we've already notified the parent to prevent infinite loops
  const notifiedRef = useRef<string | null>(null);
  const lastChatNameRef = useRef<string>('');

  // Notify parent when chat is loaded - MUST be before any early returns
  useEffect(() => {
    if (chat && onChatLoaded && chatName && chatName !== lastChatNameRef.current) {
      lastChatNameRef.current = chatName;
      notifiedRef.current = chat.id;
      onChatLoaded(chatName, initials);
    }
  }, [chat?.id, chatName]);

  // Show error if no chat access
  if (!hasChatAccess) {
    return (
      <div className="bg-[#2f3136] rounded-lg p-4 w-80 h-[500px] flex flex-col border border-[#202225]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Chat Not Available</h2>
            <button
              onClick={onClose}
              className="text-[#b9bbbe] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <p className="text-sm text-[#dcddde]">
              Chat feature is not available for this organization. Please upgrade to Platinum or Diamond package, or purchase the Chat System feature.
            </p>
            <p className="text-xs text-[#8e9297]">
              Contact your organization administrator to unlock this feature.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#36393f] rounded-lg flex flex-col w-80 h-[500px] shadow-xl border border-[#202225]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#8e9297] text-sm">Loading chat...</div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return null;
  }

  // Get active members for group chats
  const activeMembers = chat?.type === 'group' 
    ? (chat.members || []).filter((m: any) => m.status === 'active' && m.user)
    : [];

  // Get other user's name for call
  const otherUserName = chat?.type === 'direct' 
    ? (userName || getChatName() || 'User')
    : 'User';

  return (
    <>
      {activeCall && socket && chat && otherUserId && (
        <CallWindow
          chatId={chat.id}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          callType={activeCall.type}
          socket={socket}
          onClose={() => setActiveCall(null)}
          isIncoming={activeCall.isIncoming}
          offer={activeCall.offer}
        />
      )}
      <div className="bg-[#36393f] rounded-lg flex flex-col w-80 h-[500px] shadow-xl border border-[#202225] relative">
      {/* Header */}
      <div className="h-12 bg-[#2f3136] border-b border-[#202225] px-3 flex items-center justify-between flex-shrink-0 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {chat.type === 'group' ? (
            <Users className="h-4 w-4 text-[#8e9297] flex-shrink-0" />
          ) : (
            <User className="h-4 w-4 text-[#8e9297] flex-shrink-0" />
          )}
          <h2 className="text-sm font-semibold text-white truncate">{chatName}</h2>
          {chat.type === 'group' && activeMembers.length > 0 && (
            <span className="text-xs text-[#8e9297] ml-1">({activeMembers.length})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {chat.type === 'direct' && socket && otherUserId && (
            <>
              <button
                onClick={() => {
                  if (!socket || !chat?.id || !otherUserId) return;
                  setActiveCall({ type: 'audio' });
                }}
                className="p-1 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
                title="Start audio call"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (!socket || !chat?.id || !otherUserId) return;
                  setActiveCall({ type: 'video' });
                }}
                className="p-1 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
                title="Start video call"
              >
                <Video className="h-4 w-4" />
              </button>
            </>
          )}
          {chat.type === 'group' && (
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-1 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
              title={showMembers ? 'Hide members' : 'Show members'}
            >
              {showMembers ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </button>
          )}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {chat.type === 'group' && showMembers ? (
        /* Members List - Full Width (for group chats) */
        <div className="flex-1 flex flex-col bg-[#2f3136] overflow-hidden">
          <div className="h-10 px-3 border-b border-[#202225] flex items-center justify-between flex-shrink-0">
            <h3 className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">Members</h3>
            <button
              onClick={() => setShowMembers(false)}
              className="p-1 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
              title="Close members list"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
            {activeMembers.length === 0 ? (
              <div className="text-xs text-[#8e9297] px-2 py-4 text-center">No members</div>
            ) : (
              activeMembers.map((member: any) => {
                const memberUser = member.user;
                const memberName = memberUser 
                  ? `${memberUser.first_name} ${memberUser.last_name}`.trim() 
                  : 'Unknown';
                const initials = memberUser
                  ? `${memberUser.first_name?.[0] || ''}${memberUser.last_name?.[0] || ''}`.toUpperCase()
                  : 'U';
                const isCurrentUser = memberUser?.id === currentUser?.id;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                      isCurrentUser ? 'bg-[#393c43]' : 'hover:bg-[#393c43]'
                    } transition-colors`}
                  >
                    <div className="relative flex-shrink-0">
                      {memberUser?.avatar_url ? (
                        <img
                          src={memberUser.avatar_url}
                          alt={memberName}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">{initials}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#dcddde] truncate">
                        {memberName}
                        {isCurrentUser && <span className="text-xs text-[#8e9297] ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-[#8e9297] capitalize">{member.role}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Messages */
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
          {uniqueMessages.length === 0 ? (
            <div className="text-center text-[#8e9297] py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            uniqueMessages.map((message) => {
              const isOwn = message.sender_id === currentUser?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-[#5865f2] text-white'
                          : 'bg-[#2f3136] text-[#dcddde]'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {isOwn && (
                        <div className="flex items-center justify-end mt-1">
                          {message.read_status?.read_at ? (
                            <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" transform="translate(4 0)" />
                            </svg>
                          ) : message.read_status?.delivered_at ? (
                            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[#202225] flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#40444b] text-white placeholder-[#72767d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              disabled={sendMessageMutation.isPending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="p-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

