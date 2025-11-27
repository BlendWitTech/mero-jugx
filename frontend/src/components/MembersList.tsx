import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Circle, User as UserIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

export default function MembersList() {
  const { user: currentUser, organization } = useAuthStore();
  const { hasPermission, isOrganizationOwner } = usePermissions();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Organization owners should always be able to view users
  const canViewUsers = hasPermission('users.view') || isOrganizationOwner;

  // Load chats to get unread counts
  const { data: chatsData } = useQuery({
    queryKey: ['chats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { chats: [], total: 0, page: 1, limit: 50 };
      try {
        return await chatService.getChats(organization.id, { limit: 100 });
      } catch (error: any) {
        if (error.response?.status === 403) {
          return { chats: [], total: 0, page: 1, limit: 50 };
        }
        return { chats: [], total: 0, page: 1, limit: 50 };
      }
    },
    enabled: !!organization?.id && canViewUsers,
  });

  const allChats = chatsData?.chats || [];

  // Get unread count for a user's direct chat
  const getUnreadCountForUser = (userId: string) => {
    const directChat = allChats.find(
      (chat: any) =>
        chat.type === 'direct' &&
        chat.members?.some((m: any) => m.user_id === userId)
    );
    return directChat?.unread_count || 0;
  };

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['organization-members'],
    queryFn: async () => {
      const response = await api.get('/users', { params: { limit: 100 } });
      return response.data.users || [];
    },
    enabled: canViewUsers, // Only fetch if user has permission
    retry: false,
  });

  if (!canViewUsers) {
    return (
      <div className="px-2 py-4 text-center">
        <p className="text-xs text-[#8e9297]">No permission to view members</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-2 py-1.5 rounded animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#36393f]"></div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-[#36393f] rounded mb-1"></div>
                <div className="h-2 w-16 bg-[#36393f] rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 py-4 text-center">
        <p className="text-xs text-[#ed4245]">Failed to load members</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="px-2 py-4 text-center">
        <p className="text-xs text-[#8e9297]">No members found</p>
      </div>
    );
  }

  // Show all active members - no role-based filtering
  // Role hierarchy only affects modification permissions, not visibility or chat access
  const allMembers = members.filter((m: any) => m.status === 'active' && m.id !== currentUser?.id);
  
  // Sort members alphabetically by name for better UX
  const sortedMembers = [...allMembers].sort((a: any, b: any) => {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Filter by search query
  const filteredMembers = searchQuery.trim()
    ? sortedMembers.filter((m: any) => {
        const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
        const email = (m.email || '').toLowerCase();
        const roleName = (m.role?.name || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query) || roleName.includes(query);
      })
    : sortedMembers;
  
  // For now, we'll just show all members in one list since online status isn't tracked yet
  const onlineMembers = filteredMembers; // All active members shown as "online" for now
  const offlineMembers: any[] = []; // Empty for now until we implement proper online status tracking

  // Handle opening chat with a member
  const handleOpenChat = async (memberId: string) => {
    if (!organization?.id || memberId === currentUser?.id) return;

    try {
      // Try to find existing direct chat
      const chats = await chatService.getChats(organization.id);
      const existingChat = chats.chats.find(
        (chat: any) =>
          chat.type === 'direct' &&
          chat.members?.some((m: any) => m.user_id === memberId)
      );

      // Get member's name for display
      const member = members.find((m: any) => m.id === memberId);
      const memberName = member 
        ? `${member.first_name || ''} ${member.last_name || ''}`.trim() 
        : null;

      if (existingChat) {
        // Open existing chat window via ChatManager
        if ((window as any).openChatWindow) {
          (window as any).openChatWindow(existingChat.id, null, undefined, undefined, memberName);
        }
        return;
      }

      // Open new chat window (will create chat on mount)
      if ((window as any).openChatWindow) {
        (window as any).openChatWindow(null, memberId, undefined, undefined, memberName);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Chat feature is not available. Please upgrade to Platinum or Diamond package, or purchase the Chat System feature.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to open chat');
      }
    }
  };

  return (
    <>
      <div className="space-y-1">
        {/* Search Bar */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e9297]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-[#202225] text-white placeholder-[#72767d] rounded px-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>
        </div>

        {/* Online Members */}
        {onlineMembers.length > 0 && (
          <>
            <div className="px-2 py-1.5">
              <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                Online — {onlineMembers.length}
              </div>
            </div>
            {onlineMembers.map((member: any) => {
              const unreadCount = getUnreadCountForUser(member.id);
              return (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOnline={true}
                  isSelected={selectedMember === member.id}
                  unreadCount={unreadCount}
                  onClick={async () => {
                    setSelectedMember(member.id === selectedMember ? null : member.id);
                    await handleOpenChat(member.id);
                  }}
                />
              );
            })}
          </>
        )}

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <>
            {onlineMembers.length > 0 && (
              <div className="px-2 py-1.5">
                <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                  Offline — {offlineMembers.length}
                </div>
              </div>
            )}
            {offlineMembers.map((member: any) => {
              const unreadCount = getUnreadCountForUser(member.id);
              return (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOnline={false}
                  isSelected={selectedMember === member.id}
                  unreadCount={unreadCount}
                  onClick={async () => {
                    setSelectedMember(member.id === selectedMember ? null : member.id);
                    await handleOpenChat(member.id);
                  }}
                />
              );
            })}
          </>
        )}
        
        {/* Show message if no members */}
        {onlineMembers.length === 0 && offlineMembers.length === 0 && (
          <div className="px-2 py-4 text-center">
            <p className="text-xs text-[#8e9297]">No other members</p>
          </div>
        )}
      </div>
    </>
  );
}

function MemberItem({ member, isOnline, isSelected, unreadCount = 0, onClick }: any) {
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase();
  const displayName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1.5 rounded flex items-center gap-2 group transition-colors relative ${
        isSelected
          ? 'bg-[#393c43] text-white'
          : 'text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]'
      }`}
    >
      <div className="relative flex-shrink-0">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={displayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {initials || <UserIcon className="h-4 w-4" />}
            </span>
          </div>
        )}
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#23a55a] border-2 border-[#2f3136]"></div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{displayName}</p>
        {member.role && (
          <p className="text-xs text-[#8e9297] truncate">{member.role.name}</p>
        )}
      </div>
      {unreadCount > 0 && (
        <span className="h-5 w-5 rounded-full bg-[#ed4245] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

