import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { chatService, Chat, Message } from '../../services/chatService';
import { usePermissions } from '../../hooks/usePermissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { Send, Plus, Phone, Video, MoreVertical, Search, Users, Star, X, UserPlus, Loader2, MessageSquare } from 'lucide-react';
import toast from '@shared/hooks/useToast';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import api from '../../services/api';

export default function ChatPage() {
  const { organization, accessToken, user: currentUser } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check permissions
  const { isOrganizationOwner } = usePermissions();
  const canCreateGroup = hasPermission('chat.create_group') || isOrganizationOwner;

  // Check if organization has chat access (Platinum/Diamond package or chat-system feature)
  const { data: currentPackage, isLoading: isLoadingPackage } = useQuery({
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

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`chat_favorites_${organization?.id}`);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, [organization?.id]);

  // Connect WebSocket
  useEffect(() => {
    if (!organization?.id || !accessToken) return;

    const ws = chatService.connect(organization.id, accessToken);
    setSocket(ws);

    // WebSocket event handlers
    ws.on('message:new', (data: { message: Message; chat_id: string }) => {
      if (selectedChat?.id === data.chat_id) {
        // Add message to current chat
        setMessages((prev) => [...prev, data.message]);
        // Mark as read since user is viewing this chat
        queryClient.setQueryData(['chats', organization.id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            chats: old.chats.map((chat: any) =>
              chat.id === data.chat_id
                ? { ...chat, unread_count: 0, last_message: data.message }
                : chat
            ),
          };
        });
      } else {
        // Update unread count for other chats
        queryClient.setQueryData(['chats', organization.id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            chats: old.chats.map((chat: any) =>
              chat.id === data.chat_id
                ? {
                    ...chat,
                    unread_count: (chat.unread_count || 0) + 1,
                    last_message: data.message,
                  }
                : chat
            ),
          };
        });
      }
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['chats', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.chat_id] });
    });

    ws.on('chat:new', () => {
      queryClient.invalidateQueries({ queryKey: ['chats', organization.id] });
    });

    ws.on('error', (error: { message: string }) => {
      toast.error(error.message || 'WebSocket error');
    });

    return () => {
      // Don't disconnect - the socket is shared with ChatManager and ChatWindow
      // Only remove event listeners if needed
      ws.off('message:new');
      ws.off('chat:new');
      ws.off('error');
    };
  }, [organization?.id, accessToken, selectedChat?.id, queryClient]);

  // Load chats - only when package is loaded and we know if chat access is available
  const { data: chatsData, isLoading: isLoadingChats, error: chatsError } = useQuery({
    queryKey: ['chats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { chats: [], total: 0, page: 1, limit: 50 };
      try {
        return await chatService.getChats(organization.id, { limit: 100 });
      } catch (error: any) {
        // If it's a 403 (no chat access) or 400 (validation/access issue), return empty chats
        if (error.response?.status === 403 || error.response?.status === 400) {
          console.warn('Chat access issue:', error.response?.data?.message || error.message);
          return { chats: [], total: 0, page: 1, limit: 100 };
        }
        throw error;
      }
    },
    enabled: !!organization?.id && !isLoadingPackage,
    retry: false,
  });

  useEffect(() => {
    if (chatsData) {
      setChats(chatsData.chats);
      setIsLoading(false);

      // Check if there's a chat ID in URL params
      const chatId = searchParams.get('chatId');
      if (chatId && !selectedChat) {
        const chat = chatsData.chats.find((c: Chat) => c.id === chatId);
        if (chat) {
          setSelectedChat(chat);
        } else {
          // Chat might be newly created, try to fetch it
          if (organization?.id) {
            chatService.getChat(organization.id, chatId)
              .then((chat) => {
                setSelectedChat(chat);
                setSearchParams({});
              })
              .catch(() => {
                setSearchParams({});
              });
          }
        }
      }
    }
  }, [chatsData, searchParams, selectedChat, organization?.id, setSearchParams]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && organization?.id) {
      loadMessages(selectedChat.id);
      socket?.emit('chat:join', { chat_id: selectedChat.id });
    }

    return () => {
      if (selectedChat) {
        socket?.emit('chat:leave', { chat_id: selectedChat.id });
      }
    };
  }, [selectedChat?.id, socket, organization?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (chatId: string) => {
    if (!organization?.id) return;
    try {
      const result = await chatService.getMessages(organization.id, chatId);
      setMessages(result.messages.reverse());
    } catch (error: any) {
      logError(error, 'Load Messages');
      toast.error(getErrorMessage(error));
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !organization?.id) return;

    try {
      socket?.emit('message:send', {
        chat_id: selectedChat.id,
        message: {
          type: 'text',
          content: messageText,
        },
      });

      setMessageText('');
    } catch (error: any) {
      logError(error, 'Send Message');
      toast.error(getErrorMessage(error));
    }
  };

  const toggleFavorite = (chatId: string) => {
    const newFavorites = favorites.includes(chatId)
      ? favorites.filter(id => id !== chatId)
      : [...favorites, chatId];
    setFavorites(newFavorites);
    localStorage.setItem(`chat_favorites_${organization?.id}`, JSON.stringify(newFavorites));
  };

  // Filter chats
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(query) ||
      chat.description?.toLowerCase().includes(query) ||
      chat.members?.some(m => 
        `${m.user?.first_name} ${m.user?.last_name}`.toLowerCase().includes(query)
      )
    );
  });

  // Separate groups and direct messages
  // Deduplicate groups by ID to prevent showing the same group twice
  const uniqueChats = filteredChats.filter((chat, index, self) => 
    index === self.findIndex((c) => c.id === chat.id)
  );
  const groupChats = uniqueChats.filter(chat => chat.type === 'group');
  const directChats = uniqueChats.filter(chat => chat.type === 'direct');
  
  // Separate favorites
  const favoriteChats = filteredChats.filter(chat => favorites.includes(chat.id));
  const nonFavoriteChats = filteredChats.filter(chat => !favorites.includes(chat.id));

  // For organization owner: show all groups, for others: show only groups they're in
  const visibleGroupChats = isOrganizationOwner 
    ? groupChats 
    : groupChats.filter(chat => chat.members?.some(m => m.user_id === currentUser?.id));

  if (isLoading || isLoadingChats || isLoadingPackage) {
    return (
      <div className="flex items-center justify-center h-full bg-[#36393f]">
        <div className="text-white">Loading chats...</div>
      </div>
    );
  }

  // Show upgrade message if chat is not available
  if (!hasChatAccess) {
    return (
      <div className="flex items-center justify-center h-full bg-[#36393f]">
        <div className="text-center max-w-md p-8 bg-[#2f3136] rounded-xl border border-[#202225]">
          <Users className="h-16 w-16 text-[#8e9297] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Chat System Not Available</h2>
          <p className="text-[#b9bbbe] mb-6">
            The chat system is not available for your current package. Please upgrade to Platinum or Diamond package, or purchase the Chat System feature to access this functionality.
          </p>
          <button
            onClick={() => navigate('/packages')}
            className="px-6 py-3 bg-[#5865f2] text-white rounded-lg font-medium hover:bg-[#4752c4] transition-colors"
          >
            View Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#36393f]">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-[#2f3136] border-r border-[#202225] flex flex-col">
        <div className="p-4 border-b border-[#202225]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Chats</h2>
            {hasChatAccess && canCreateGroup && (
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="p-2 rounded-lg hover:bg-[#393c43] text-[#b9bbbe] transition-colors"
                title="Create Group Chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8e9297]" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#202225] border border-[#202225] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
          {/* Favorites Section */}
          {favoriteChats.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide mb-2 flex items-center gap-1">
                <Star className="h-3 w-3 fill-[#faa61a] text-[#faa61a]" />
                Favorites
              </div>
              {favoriteChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => setSelectedChat(chat)}
                  onFavorite={() => toggleFavorite(chat.id)}
                  isFavorite={true}
                />
              ))}
            </div>
          )}

          {/* Group Chat Section */}
          {visibleGroupChats.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Group Chat
              </div>
              {visibleGroupChats
                .filter(chat => !favorites.includes(chat.id))
                .map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChat?.id === chat.id}
                    onClick={() => {
                      // Select the group chat directly
                      setSelectedChat(chat);
                    }}
                    onFavorite={() => toggleFavorite(chat.id)}
                    isFavorite={favorites.includes(chat.id)}
                  />
                ))}
            </div>
          )}

          {/* Direct Messages Section */}
          {directChats.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide mb-2">
                Direct Messages
              </div>
              {directChats
                .filter(chat => !favorites.includes(chat.id))
                .map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChat?.id === chat.id}
                    onClick={() => {
                      // Select the direct message directly
                      setSelectedChat(chat);
                    }}
                    onFavorite={() => toggleFavorite(chat.id)}
                    isFavorite={favorites.includes(chat.id)}
                  />
                ))}
            </div>
          )}

          {filteredChats.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#8e9297]">No chats found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#2f3136] border-b border-[#202225] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  // Determine display name and initials for header
                  let headerDisplayName: string;
                  let headerInitials: string;
                  
                  if (selectedChat.type === 'group') {
                    if (selectedChat.name && selectedChat.name.trim()) {
                      headerDisplayName = selectedChat.name;
                      headerInitials = selectedChat.name.charAt(0).toUpperCase();
                    } else {
                      const memberNames = selectedChat.members
                        ?.filter((m: any) => m.user_id !== currentUser?.id && m.user)
                        .map((m: any) => `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim())
                        .filter(Boolean)
                        .slice(0, 3) || [];
                      
                      const totalMembers = selectedChat.members?.filter((m: any) => m.user_id !== currentUser?.id && m.user).length || 0;
                      
                      if (memberNames.length > 0) {
                        // Always show it's a group, even if only 1 member
                        if (totalMembers === 1) {
                          headerDisplayName = `${memberNames[0]}'s Group`;
                        } else if (totalMembers === 2) {
                          headerDisplayName = `${memberNames[0]} & ${memberNames[1]}'s Group`;
                        } else {
                          headerDisplayName = `${memberNames[0]}, ${memberNames[1]} & ${totalMembers - 2} other${totalMembers - 2 !== 1 ? 's' : ''}'s Group`;
                        }
                        headerInitials = memberNames[0].charAt(0).toUpperCase();
                      } else {
                        const memberCount = selectedChat.members?.length || 0;
                        headerDisplayName = memberCount > 0 
                          ? `Group (${memberCount} member${memberCount !== 1 ? 's' : ''})`
                          : `Unnamed Group (${selectedChat.id.slice(0, 8)})`;
                        headerInitials = 'G';
                      }
                    }
                  } else {
                    const otherMember = selectedChat.members?.find((m: any) => m.user_id !== currentUser?.id);
                    headerDisplayName = otherMember 
                      ? `${otherMember.user?.first_name || ''} ${otherMember.user?.last_name || ''}`.trim() || otherMember.user?.email || 'Unknown User'
                      : 'Unknown User';
                    headerInitials = headerDisplayName.charAt(0).toUpperCase();
                  }
                  
                  return (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                        {headerInitials || '?'}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{headerDisplayName}</h3>
                        <p className="text-sm text-[#8e9297]">
                          {selectedChat.type === 'group' 
                            ? `${selectedChat.members?.length || 0} members`
                            : selectedChat.members?.find(m => m.user_id !== currentUser?.id)?.user?.email}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-[#393c43] text-[#b9bbbe] transition-colors">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#393c43] text-[#b9bbbe] transition-colors">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#393c43] text-[#b9bbbe] transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#8e9297]" />
                    <p className="text-[#b9bbbe]">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isCurrentUser = message.sender_id === currentUser?.id;
                  const showAvatar = !isCurrentUser && (
                    index === 0 || messages[index - 1]?.sender_id !== message.sender_id
                  );
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 items-end group ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-slideUp`}
                    >
                      {showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white text-xs flex-shrink-0 shadow-lg">
                          {message.sender?.first_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      {!showAvatar && <div className="w-8 flex-shrink-0"></div>}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-lg transition-all duration-300 ${
                          isCurrentUser
                            ? 'bg-gradient-to-br from-[#5865f2] to-[#4752c4] text-white group-hover:shadow-[#5865f2]/30'
                            : 'bg-gradient-to-br from-[#2f3136] to-[#36393f] text-white border border-[#202225]/50 group-hover:border-[#5865f2]/30'
                        }`}
                      >
                        {!isCurrentUser && message.sender && showAvatar && (
                          <div className="text-xs font-semibold text-[#b9bbbe] mb-1.5">
                            {message.sender.first_name} {message.sender.last_name}
                          </div>
                        )}
                        <div className="text-sm leading-relaxed break-words">{message.content}</div>
                        <div className={`text-xs mt-1.5 ${isCurrentUser ? 'text-white/70' : 'text-[#8e9297]'}`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-gradient-to-t from-[#2f3136] to-[#36393f] border-t border-[#202225]/50 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-[#202225]/80 backdrop-blur-sm border border-[#202225]/50 rounded-xl text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]/50 focus:border-[#5865f2]/50 transition-all duration-300"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="p-3 bg-gradient-to-br from-[#5865f2] to-[#4752c4] text-white rounded-xl hover:from-[#4752c4] hover:to-[#5865f2] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#5865f2]/30 hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#b9bbbe]">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Select a chat to start messaging</h3>
              <p>Choose a conversation from the sidebar to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            setShowCreateGroupModal(false);
            queryClient.invalidateQueries({ queryKey: ['chats', organization?.id] });
          }}
        />
      )}
    </div>
  );
}

function ChatListItem({ chat, isSelected, onClick, onFavorite, isFavorite }: any) {
  const { user: currentUser } = useAuthStore();
  
  // Determine display name based on chat type
  let displayName: string;
  if (chat.type === 'group') {
    // For group chats, use name or generate from members
    if (chat.name && chat.name.trim()) {
      displayName = chat.name;
    } else {
      // Generate name from member names (excluding current user)
      const memberNames = chat.members
        ?.filter((m: any) => m.user_id !== currentUser?.id && m.user)
        .map((m: any) => `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim())
        .filter(Boolean)
        .slice(0, 3) || [];
      
      const totalMembers = chat.members?.filter((m: any) => m.user_id !== currentUser?.id && m.user).length || 0;
      
      if (memberNames.length > 0) {
        // Always show it's a group, even if only 1 member
        if (totalMembers === 1) {
          displayName = `${memberNames[0]}'s Group`;
        } else if (totalMembers === 2) {
          displayName = `${memberNames[0]} & ${memberNames[1]}'s Group`;
        } else {
          displayName = `${memberNames[0]}, ${memberNames[1]} & ${totalMembers - 2} other${totalMembers - 2 !== 1 ? 's' : ''}'s Group`;
        }
      } else {
        // If no member names available, use chat ID as fallback to make it unique
        const memberCount = chat.members?.length || 0;
        displayName = memberCount > 0 
          ? `Group (${memberCount} member${memberCount !== 1 ? 's' : ''})`
          : `Unnamed Group (${chat.id.slice(0, 8)})`;
      }
    }
  } else {
    // For direct messages, use other member's name
    const otherMember = chat.members?.find((m: any) => m.user_id !== currentUser?.id);
    displayName = otherMember 
      ? `${otherMember.user?.first_name || ''} ${otherMember.user?.last_name || ''}`.trim() || otherMember.user?.email || 'Unknown User'
      : 'Unknown User';
  }
  
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left hover:bg-[#393c43] transition-colors rounded-lg mb-1 ${
        isSelected ? 'bg-[#393c43] border-l-2 border-[#5865f2]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold flex-shrink-0">
          {initials || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">{displayName}</div>
          <div className="text-sm text-[#8e9297] truncate">
            {chat.last_message?.content || 'No messages yet'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {chat.unread_count && chat.unread_count > 0 && (
            <div className="bg-[#5865f2] text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
              {chat.unread_count}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            className="p-1 hover:bg-[#202225] rounded transition-colors"
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-[#faa61a] text-[#faa61a]' : 'text-[#8e9297]'}`} />
          </button>
        </div>
      </div>
    </button>
  );
}

function CreateGroupModal({ onClose, onSuccess }: any) {
  const { organization } = useAuthStore();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members } = useQuery({
    queryKey: ['organization-members'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data.users || [];
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; member_ids: string[] }) => {
      if (!organization?.id) throw new Error('No organization');
      return await chatService.createChat(organization.id, {
        type: 'group',
        name: data.name,
        description: data.description,
        member_ids: data.member_ids,
      });
    },
    onSuccess: () => {
      toast.success('Group created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });

  const filteredMembers = members?.filter((member: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  const handleToggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    createGroupMutation.mutate({
      name: groupName,
      description: description || undefined,
      member_ids: selectedMembers,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f3136] rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#202225]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create Group</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#393c43] text-[#b9bbbe] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2 bg-[#202225] border border-[#202225] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={3}
              className="w-full px-4 py-2 bg-[#202225] border border-[#202225] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Add Members</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8e9297]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-2 bg-[#202225] border border-[#202225] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
              {filteredMembers
                ?.filter((member: any) => {
                  const { user: currentUser } = useAuthStore.getState();
                  return member.id !== currentUser?.id; // Hide creator from selection
                })
                .map((member: any) => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        isSelected
                          ? 'bg-[#5865f2]/20 border-2 border-[#5865f2]'
                          : 'bg-[#202225] hover:bg-[#393c43] border-2 border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                        {`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-[#8e9297]">{member.email}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#5865f2] flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#202225] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-[#36393f] rounded-lg text-[#b9bbbe] font-medium hover:bg-[#36393f] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || createGroupMutation.isPending}
            className="flex-1 px-4 py-2 bg-[#5865f2] text-white rounded-lg font-medium hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
