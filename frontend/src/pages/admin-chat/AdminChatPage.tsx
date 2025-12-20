import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { adminChatService, AdminChat, AdminChatMessage } from '../../services/adminChatService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Plus, Search, MessageSquare, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function AdminChatPage() {
  const { organization, accessToken, user: currentUser } = useAuthStore();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load admin chats
  const { data: chatsData, isLoading: isLoadingChats } = useQuery({
    queryKey: ['admin-chats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { chats: [], total: 0, page: 1, limit: 50 };
      try {
        return await adminChatService.getChats(organization.id, { limit: 50 });
      } catch (error: any) {
        if (error.response?.status === 403) {
          toast.error('You do not have permission to chat with admin');
          return { chats: [], total: 0, page: 1, limit: 100 };
        }
        if (error.response?.status === 400) {
          console.error('Admin chat 400 error:', error.response?.data);
          toast.error(error.response?.data?.message || 'Invalid request. Please check your input.');
          return { chats: [], total: 0, page: 1, limit: 100 };
        }
        throw error;
      }
    },
    enabled: !!organization?.id,
    retry: false,
  });

  useEffect(() => {
    if (chatsData) {
      setChats(chatsData.chats);
      setIsLoading(false);
    }
  }, [chatsData]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && organization?.id) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat?.id, organization?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (chatId: string) => {
    if (!organization?.id) return;
    try {
      const result = await adminChatService.getMessages(organization.id, chatId);
      setMessages(result.messages.reverse());
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load messages');
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (!selectedChat || !organization?.id) throw new Error('No chat selected');
      return await adminChatService.sendMessage(organization.id, selectedChat.id, data);
    },
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['admin-chats', organization?.id] });
    },
        onError: (error: any) => {
          console.error('Send message error:', error.response?.data);
          toast.error(error.response?.data?.message || 'Failed to send message');
        },
  });

  const createChatMutation = useMutation({
    mutationFn: async (data: { subject: string; initial_message: string }) => {
      if (!organization?.id) throw new Error('No organization');
      return await adminChatService.createChat(organization.id, {
        subject: data.subject,
        initial_message: data.initial_message,
      });
    },
    onSuccess: (newChat) => {
      toast.success('Chat created successfully');
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-chats', organization?.id] });
      setSelectedChat(newChat);
    },
        onError: (error: any) => {
          console.error('Create chat error:', error.response?.data);
          toast.error(error.response?.data?.message || 'Failed to create chat');
        },
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;
    sendMessageMutation.mutate({ content: messageText });
  };

  // Filter chats
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return chat.subject.toLowerCase().includes(query);
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'closed':
        return <X className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  if (isLoading || isLoadingChats) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: theme.colors.background }}>
        <div style={{ color: theme.colors.text }}>Loading admin chats...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: theme.colors.background }}>
      {/* Chat List Sidebar */}
      <div className="w-80 flex flex-col" style={{ backgroundColor: theme.colors.surface, borderRight: `1px solid ${theme.colors.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>Admin Support</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.border;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: theme.colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                '--tw-ring-color': theme.colors.primary
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
          {filteredChats.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#8e9297]">No chats found</p>
            </div>
          ) : (
            <div className="px-4 py-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className="w-full p-3 text-left transition-colors rounded-lg mb-1"
                  style={selectedChat?.id === chat.id
                    ? { backgroundColor: theme.colors.surface, borderLeft: `2px solid ${theme.colors.primary}` }
                    : {}
                  }
                  onMouseEnter={(e) => {
                    if (selectedChat?.id !== chat.id) {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedChat?.id !== chat.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}>
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium truncate" style={{ color: theme.colors.text }}>{chat.subject}</div>
                        {getStatusIcon(chat.status)}
                      </div>
                      <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {new Date(chat.last_message_at || chat.created_at).toLocaleDateString()}
                      </div>
                      {chat.unread_count && chat.unread_count > 0 && (
                        <div className="mt-1">
                          <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}>
                            {chat.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedChat.subject || 'No Subject'}</h3>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Status: {selectedChat.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${!message.is_from_admin ? 'justify-end' : 'justify-start'}`}
                >
                  {message.is_from_admin && (
                    <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs flex-shrink-0">
                      {message.sender?.first_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      !message.is_from_admin
                        ? 'bg-[#5865f2] text-white'
                        : ''
                      }
                      style={message.sender_type === 'admin' 
                        ? { backgroundColor: theme.colors.primary, color: '#ffffff' }
                        : { backgroundColor: theme.colors.surface, color: theme.colors.text }
                      }
                    }`}
                  >
                    {message.is_from_admin && message.sender && (
                      <div className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                        {message.sender.first_name} {message.sender.last_name} (Admin)
                      </div>
                    )}
                    <div>{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-6 py-4" style={{ backgroundColor: theme.colors.surface, borderTop: `1px solid ${theme.colors.border}` }}>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    '--tw-ring-color': theme.colors.primary
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="p-3 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: theme.colors.textSecondary }}>
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
              <h3 className="text-xl font-semibold text-white mb-2">Select a chat to start messaging</h3>
              <p>Choose a conversation from the sidebar or create a new one</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-3 bg-[#5865f2] text-white rounded-lg font-medium hover:bg-[#4752c4] transition-colors"
              >
                New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      {showCreateModal && (
        <CreateChatModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(subject, initial_message) => {
            createChatMutation.mutate({ subject, initial_message });
          }}
          isPending={createChatMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateChatModal({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void;
  onCreate: (subject: string, initial_message: string) => void;
  isPending: boolean;
}) {
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    onCreate(subject.trim(), initialMessage.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl shadow-2xl max-w-lg w-full" style={{ backgroundColor: theme.colors.surface }}>
        <div className="p-6" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">New Admin Chat</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.border;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                '--tw-ring-color': theme.colors.primary
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Initial Message *</label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Enter your message"
              rows={4}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors"
              style={{ 
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                '--tw-ring-color': theme.colors.primary
              }}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-colors"
              style={{ 
                borderColor: theme.colors.border,
                color: theme.colors.textSecondary
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.background}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!subject.trim() || !initialMessage.trim() || isPending}
              className="flex-1 px-4 py-2 bg-[#5865f2] text-white rounded-lg font-medium hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

