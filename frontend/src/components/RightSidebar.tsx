import { useState, useEffect } from 'react';
import { Ticket, MessageSquare, Clock, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Hash, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function RightSidebar({ 
  isCollapsed, 
  onCollapse, 
  onExpand 
}: { 
  isCollapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}) {
  const { hasPermission } = usePermissions();
  const { organization } = useAuthStore();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const queryClient = useQueryClient();

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

  const canCreateGroup = hasPermission('chat.create_group');

  // Load all chats to get unread counts - use same query key as ChatManager for consistency
  // This ensures we get real-time updates when ChatManager updates the cache
  const { data: chatsData } = useQuery({
    queryKey: ['chats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { chats: [], total: 0, page: 1, limit: 50 };
      try {
        return await chatService.getChats(organization.id, { limit: 100 });
      } catch (error: any) {
        // Handle 403 (no access) or 400 (validation/access issue) gracefully
        if (error.response?.status === 403 || error.response?.status === 400) {
          console.warn('Chat access issue:', error.response?.data?.message || error.message);
          return { chats: [], total: 0, page: 1, limit: 50 };
        }
        throw error;
      }
    },
    enabled: !!organization?.id && !!currentPackage && hasChatAccess === true,
    retry: false,
    // Refetch interval to ensure we get updates (though setQueryData should handle this)
    refetchInterval: false,
  });

  const allChats = chatsData?.chats || [];
  const groups = allChats.filter((chat: any) => chat.type === 'group');
  
  // Debug: Log unread counts
  useEffect(() => {
    if (allChats.length > 0) {
      const unreadChats = allChats.filter((c: any) => (c.unread_count || 0) > 0);
      if (unreadChats.length > 0) {
        console.log('[RightSidebar] Chats with unread messages:', unreadChats.map((c: any) => ({ id: c.id, name: c.name, unread: c.unread_count })));
      }
    }
  }, [allChats]);
  
  // Get unread count for a chat
  const getUnreadCount = (chatId: string) => {
    const chat = allChats.find((c: any) => c.id === chatId);
    const count = chat?.unread_count || 0;
    // Debug logging
    if (count > 0) {
      console.log('[RightSidebar] Unread count for chat', chatId, ':', count);
    }
    return count;
  };

  const handleCreateGroup = async (name: string, description?: string, memberIds: string[] = []) => {
    if (!organization?.id) return;

    try {
      const newChat = await chatService.createChat(organization.id, {
        type: 'group',
        name,
        description,
        member_ids: memberIds,
      });
      // Open the new group chat window
      if ((window as any).openChatWindow) {
        (window as any).openChatWindow(newChat.id, null);
      }
      setShowCreateGroupModal(false);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to create groups.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  };

  if (isCollapsed) {
    return null; // Parent will handle showing the expand button
  }

  return (
    <>
      <div className="w-[240px] h-full bg-[#2f3136] flex flex-col border-l border-[#202225] transition-all duration-300">
        {/* Header */}
        <div className="h-12 px-4 border-b border-[#202225] flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Quick Access
          </h2>
          <button
            onClick={() => {
              onCollapse?.();
            }}
            className="text-[#b9bbbe] hover:text-white transition-colors"
            title="Collapse sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
          <div className="p-4 space-y-4">
            {/* Support Section */}
            <QuickAccessSection
              title="Support"
              icon={Ticket}
              items={[
                { label: 'Tickets', icon: Ticket, href: '/tickets' },
                { label: 'Chat with Admin', icon: MessageSquare, href: '/chat/admin' },
              ]}
            />

            {/* Online Users Section */}
            {hasPermission('users.view') && (
              <OnlineUsersSection 
                onOpenChat={(chatId) => {
                  if ((window as any).openChatWindow) {
                    (window as any).openChatWindow(chatId, null);
                  }
                }}
                allChats={allChats}
                getUnreadCount={getUnreadCount}
              />
            )}

            {/* Groups Section */}
            {hasChatAccess && (
              <GroupsSection
                groups={groups}
                canCreateGroup={canCreateGroup}
                onCreateGroup={() => setShowCreateGroupModal(true)}
                onOpenChat={(chatId) => {
                  if ((window as any).openChatWindow) {
                    (window as any).openChatWindow(chatId, null);
                  }
                }}
                getUnreadCount={getUnreadCount}
              />
            )}

            {/* Chat Access Alert */}
            {!hasChatAccess && (
              <div className="p-3 bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg">
                <p className="text-xs text-[#ed4245] font-medium mb-1">Chat Not Available</p>
                <p className="text-xs text-[#8e9297]">
                  Purchase the chat app or ask the organization to unlock this feature.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </>
  );
}

function QuickAccessSection({ title, icon: Icon, items }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[#8e9297]" />
        <h3 className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="space-y-1">
        {items.map((item: any) => {
          const ItemIcon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde] transition-colors group"
            >
              <ItemIcon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function OnlineUsersSection({ 
  onOpenChat, 
  allChats, 
  getUnreadCount 
}: { 
  onOpenChat: (chatId: string) => void;
  allChats: any[];
  getUnreadCount: (chatId: string) => number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user: currentUser, organization } = useAuthStore();
  const { hasPermission, isOrganizationOwner } = usePermissions();
  // Organization owners should always be able to view users
  const canViewUsers = hasPermission('users.view') || isOrganizationOwner;

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['online-members'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 50 } });
      const users = response.data.users || [];
      // Filter to show only active users (online status tracking can be added later via WebSockets)
      // Exclude current user from the list
      return users.filter((u: any) => u.id !== currentUser?.id && u.status === 'active');
    },
    enabled: canViewUsers, // Only fetch if user has permission or is organization owner
    retry: false,
  });

  const handleUserClick = async (userId: string, userName?: string) => {
    if (!organization?.id) return;

    try {
      // First check if we already have this chat in our loaded chats
      const existingChat = allChats.find(
        (chat: any) =>
          chat.type === 'direct' &&
          chat.members?.some((m: any) => m.user_id === userId)
      );

      if (existingChat) {
        // Open existing chat with user name - ChatManager will prevent duplicates
        if ((window as any).openChatWindow) {
          (window as any).openChatWindow(existingChat.id, userId, undefined, undefined, userName);
        }
      } else {
        // Try to fetch chats to see if one exists
        const chats = await chatService.getChats(organization.id, { type: 'direct' });
        const foundChat = chats.chats.find(
          (chat: any) =>
            chat.type === 'direct' &&
            chat.members?.some((m: any) => m.user_id === userId)
        );

        if (foundChat) {
          // Open existing chat
          if ((window as any).openChatWindow) {
            (window as any).openChatWindow(foundChat.id, userId, undefined, undefined, userName);
          }
        } else {
          // Create new direct chat
          const newChat = await chatService.createChat(organization.id, {
            type: 'direct',
            member_ids: [userId],
          });
          // Open new chat with user name
          if ((window as any).openChatWindow) {
            (window as any).openChatWindow(newChat.id, userId, undefined, undefined, userName);
          }
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Chat feature is not available. Please upgrade to Platinum or Diamond package, or purchase the Chat System feature.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to open chat');
      }
    }
  };

  // Get unread count for a user's direct chat
  const getUserUnreadCount = (userId: string) => {
    const chat = allChats.find(
      (c: any) =>
        c.type === 'direct' &&
        c.members?.some((m: any) => m.user_id === userId)
    );
    return chat ? getUnreadCount(chat.id) : 0;
  };

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-2 group"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#8e9297] group-hover:text-[#dcddde] transition-colors" />
          <h3 className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide group-hover:text-[#dcddde] transition-colors">
            Online Now
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[#8e9297] group-hover:text-[#dcddde] transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8e9297] group-hover:text-[#dcddde] transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2">
          {!canViewUsers ? (
            <div className="text-xs text-[#8e9297] px-2">No permission to view users</div>
          ) : isLoading ? (
            <div className="text-xs text-[#8e9297] px-2">Loading...</div>
          ) : error ? (
            <div className="text-xs text-[#ed4245] px-2">Failed to load users</div>
          ) : members && members.length > 0 ? (
            <>
              {members.map((member: any) => {
                const unreadCount = getUserUnreadCount(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => handleUserClick(member.id, `${member.first_name} ${member.last_name}`.trim())}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#393c43] transition-colors group relative"
                  >
                    <div className="relative flex-shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Show green dot for active users (online status tracking can be added later) */}
                      {member.status === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#23a55a] border-2 border-[#2f3136]"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-[#dcddde] truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      {/* Show "Active now" for active users (online status tracking can be added later) */}
                      {member.status === 'active' && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-[#8e9297]" />
                          <span className="text-xs text-[#8e9297]">Active now</span>
                        </div>
                      )}
                    </div>
                    {/* Show unread count badge */}
                    {unreadCount > 0 && (
                      <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#ed4245] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {unreadCount > 999 ? '999+' : unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          ) : (
            <div className="text-xs text-[#8e9297] px-2">No one online</div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupsSection({ 
  groups, 
  canCreateGroup, 
  onCreateGroup, 
  onOpenChat,
  getUnreadCount
}: { 
  groups: any[]; 
  canCreateGroup: boolean; 
  onCreateGroup: () => void;
  onOpenChat: (chatId: string) => void;
  getUnreadCount: (chatId: string) => number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 group flex-1"
        >
          <Hash className="h-4 w-4 text-[#8e9297] group-hover:text-[#dcddde] transition-colors" />
          <h3 className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide group-hover:text-[#dcddde] transition-colors">
            Groups
          </h3>
        </button>
        {canCreateGroup && (
          <button
            onClick={onCreateGroup}
            className="p-1 text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] rounded transition-colors"
            title="Create Group"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[#8e9297] ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8e9297] ml-1" />
        )}
      </div>

      {isExpanded && (
        <div className="space-y-1">
          {groups.length === 0 ? (
            <div className="text-xs text-[#8e9297] px-2">No groups yet</div>
          ) : (
            groups.map((group) => {
              const unreadCount = getUnreadCount(group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => onOpenChat(group.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#393c43] transition-colors text-left relative"
                >
                  <Hash className="h-4 w-4 text-[#8e9297] flex-shrink-0" />
                  <span className="text-sm text-[#dcddde] truncate flex-1">{group.name || 'Unnamed Group'}</span>
                  {unreadCount > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#ed4245] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {unreadCount > 999 ? '999+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, description?: string, memberIds?: string[]) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { organization } = useAuthStore();
  const { user: currentUser } = useAuthStore();

  // Fetch members for group selection
  const { data: membersData } = useQuery({
    queryKey: ['group-members'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data.users || [];
    },
    enabled: !!organization?.id,
  });

  // Include all active members (including current user) - they can choose to include/exclude themselves
  const availableMembers = (membersData || []).filter((m: any) => m.status === 'active');
  
  // Get creator's name for display
  const creatorName = currentUser 
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email || 'You'
    : 'You';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim() || undefined, selectedMembers);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2f3136] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Create Group</h2>
          <button
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#dcddde] mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#dcddde] mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={2}
              className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#dcddde] mb-2">
              Add Members ({selectedMembers.length} selected)
            </label>
            <div className="mb-2 px-2 py-1.5 bg-[#36393f] rounded-lg">
              <p className="text-xs text-[#8e9297]">
                Creating group as: <span className="text-[#dcddde] font-medium">{creatorName}</span>
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto bg-[#40444b] rounded-lg p-2 space-y-1 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
              {availableMembers.length === 0 ? (
                <p className="text-xs text-[#8e9297] px-2 py-2">No members available</p>
              ) : (
                availableMembers.map((member: any) => {
                  const isCurrentUser = member.id === currentUser?.id;
                  const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown';
                  
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                        selectedMembers.includes(member.id)
                          ? 'bg-[#5865f2] text-white'
                          : 'hover:bg-[#36393f] text-[#dcddde]'
                      } ${isCurrentUser ? 'ring-1 ring-[#5865f2]/50' : ''}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm truncate flex-1">
                        {memberName}
                        {isCurrentUser && <span className="text-xs text-[#8e9297] ml-1">(You)</span>}
                      </span>
                      {selectedMembers.includes(member.id) && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#40444b] hover:bg-[#36393f] text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

