import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { chatService, Chat } from '../services/chatService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ChatWindow from './ChatWindow';
import { Socket } from 'socket.io-client';

interface OpenChat {
  id: string;
  chatId: string | null;
  userId: string | null;
  isMinimized: boolean;
  chatName?: string;
  initials?: string;
  userName?: string; // For direct chats, store the user's name
}

export default function ChatManager() {
  const { organization, accessToken } = useAuthStore();
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const queryClient = useQueryClient();

  // Connect WebSocket for real-time updates
  useEffect(() => {
    if (!organization?.id || !accessToken) return;

    const socket = chatService.connect(organization.id, accessToken);
    
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('[ChatManager] Socket not connected, waiting for connection...');
      socket.once('connect', () => {
        console.log('[ChatManager] Socket connected, setting up listeners');
      });
    }

    // Listen for new messages
    const handleNewMessage = (data: { message: any; chat_id: string }) => {
      console.log('[ChatManager] Received message:new event', { 
        chat_id: data.chat_id, 
        message_id: data.message.id,
        message_content: data.message.content?.substring(0, 50)
      });
      
      // Find if any open chat window is viewing this chat
      const isChatOpen = openChats.some(
        (chat) => chat.chatId === data.chat_id && !chat.isMinimized
      );
      
      console.log('[ChatManager] Is chat open?', isChatOpen, 'openChats:', openChats.map(c => ({ chatId: c.chatId, minimized: c.isMinimized })));
      
      // Update unread counts optimistically - this updates all components using this query
      queryClient.setQueryData(['chats', organization.id], (old: any) => {
        if (!old) {
          console.log('[ChatManager] No existing chat data, cannot update');
          return old;
        }
        
        const updatedChats = old.chats.map((chat: any) => {
          if (chat.id === data.chat_id) {
            // If chat is open and not minimized, unread_count should be 0
            // If chat is closed, increment unread_count
            const currentUnread = typeof chat.unread_count === 'number' ? chat.unread_count : 0;
            let newUnread: number;
            
            if (isChatOpen) {
              // Chat is open and visible - mark as read
              newUnread = 0;
              console.log('[ChatManager] Chat is open, setting unread_count to 0');
            } else {
              // Chat is closed - increment unread count
              // Always increment, even if currentUnread is 0 (in case it was just reset)
              newUnread = currentUnread + 1;
              console.log('[ChatManager] Chat is closed, incrementing unread_count:', currentUnread, '->', newUnread);
            }
            
            console.log('[ChatManager] Updating chat', chat.id, 'unread_count:', currentUnread, '->', newUnread, 'isChatOpen:', isChatOpen);
            return {
              ...chat,
              unread_count: newUnread,
              last_message: data.message,
            };
          }
          return chat;
        });
        
        console.log('[ChatManager] Updated chats query cache, total chats:', updatedChats.length);
        return {
          ...old,
          chats: updatedChats,
        };
      });
      
      // Invalidate messages query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['messages', data.chat_id] });
    };

    console.log('[ChatManager] Attaching message:new listener');
    socket.on('message:new', handleNewMessage);

    // Listen for new chats
    socket.on('chat:new', () => {
      queryClient.invalidateQueries({ queryKey: ['chats', organization.id] });
    });

    return () => {
      // Only remove event listeners, don't disconnect the socket
      // The socket is shared with ChatWindow and other components
      console.log('[ChatManager] Removing event listeners');
      socket.off('message:new', handleNewMessage);
      socket.off('chat:new');
      // Don't disconnect - let the socket stay connected for other components
    };
  }, [organization?.id, accessToken, queryClient, openChats]);

  const openChat = useCallback((chatId: string | null, userId: string | null = null, chatName?: string, initials?: string, userName?: string) => {
    setOpenChats((openChats) => {
      // Check if chat is already open - check both chatId and userId to prevent duplicates
      const existingChat = openChats.find((chat) => {
        // If we have a chatId, check if it matches
        if (chatId && chat.chatId === chatId) return true;
        // If we have a userId, check if it matches (for direct chats)
        if (userId && chat.userId === userId) return true;
        // Also check if chatId matches userId (in case we're opening with userId but chat already has chatId)
        if (userId && chat.chatId && chat.userId === userId) return true;
        return false;
      });

      if (existingChat) {
        // If minimized, restore it (and minimize another if needed)
        if (existingChat.isMinimized) {
          const openCount = openChats.filter((c) => !c.isMinimized).length;
          // If we have 3 open windows, minimize the oldest one
          if (openCount >= 3) {
            const oldestOpen = openChats
              .filter((c) => !c.isMinimized && c.id !== existingChat.id)
              .sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))[0];
            
            if (oldestOpen) {
              return openChats.map((chat) =>
                chat.id === oldestOpen.id
                  ? { ...chat, isMinimized: true }
                  : chat.id === existingChat.id
                  ? { ...chat, isMinimized: false, chatName, initials, userName, chatId: chatId || chat.chatId, userId: userId || chat.userId }
                  : chat
              );
            } else {
            return openChats.map((chat) =>
              chat.id === existingChat.id ? { ...chat, isMinimized: false, chatName, initials, userName, chatId: chatId || chat.chatId, userId: userId || chat.userId } : chat
            );
            }
          } else {
            return openChats.map((chat) =>
              chat.id === existingChat.id ? { ...chat, isMinimized: false, chatName, initials, userName, chatId: chatId || chat.chatId, userId: userId || chat.userId } : chat
            );
          }
        }
        // Already open and not minimized - just update the info if provided
        if (chatName || userName) {
          return openChats.map((chat) =>
            chat.id === existingChat.id 
              ? { ...chat, chatName: chatName || chat.chatName, userName: userName || chat.userName, initials: initials || chat.initials, chatId: chatId || chat.chatId, userId: userId || chat.userId }
              : chat
          );
        }
        return openChats; // Already open and not minimized, no updates needed
      }

      // Check if we already have 3 open windows
      const openCount = openChats.filter((c) => !c.isMinimized).length;
      
      // If we have 3 open windows, minimize the oldest one
      let chatsToUpdate = [...openChats];
      if (openCount >= 3) {
        const oldestOpen = openChats
          .filter((c) => !c.isMinimized)
          .sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))[0];
        
        if (oldestOpen) {
          chatsToUpdate = chatsToUpdate.map((chat) =>
            chat.id === oldestOpen.id ? { ...chat, isMinimized: true } : chat
          );
        }
      }

      // Add new chat window
      const newChat: OpenChat = {
        id: `chat-${Date.now()}-${Math.random()}`,
        chatId,
        userId,
        isMinimized: false,
        chatName,
        initials,
        userName,
      };

      return [...chatsToUpdate, newChat];
    });
  }, []);

  const closeChat = (chatId: string) => {
    setOpenChats((chats) => {
      const updated = chats.filter((chat) => chat.id !== chatId);
      console.log('[ChatManager] Chat closed:', chatId, 'Remaining open chats:', updated.length);
      
      // Don't invalidate immediately on close - let ChatManager handle unread counts
      // Invalidating here can cause race conditions where new messages arrive
      // and the increment gets overwritten by the refetch
      // Instead, we'll let the natural query refetch handle it, or invalidate only
      // when needed (e.g., when explicitly refreshing)
      
      return updated;
    });
  };

  const minimizeChat = (chatId: string) => {
    setOpenChats((chats) =>
      chats.map((chat) =>
        chat.id === chatId ? { ...chat, isMinimized: true } : chat
      )
    );
  };

  const restoreChat = (chatId: string) => {
    setOpenChats((openChats) => {
      const openCount = openChats.filter((c) => !c.isMinimized).length;
      
      // If we have 3 open windows, minimize the oldest one
      if (openCount >= 3) {
        const oldestOpen = openChats
          .filter((c) => !c.isMinimized)
          .sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))[0];
        
        if (oldestOpen) {
          return openChats.map((chat) =>
            chat.id === oldestOpen.id
              ? { ...chat, isMinimized: true }
              : chat.id === chatId
              ? { ...chat, isMinimized: false }
              : chat
          );
        } else {
          return openChats.map((chat) =>
            chat.id === chatId ? { ...chat, isMinimized: false } : chat
          );
        }
      } else {
        return openChats.map((chat) =>
          chat.id === chatId ? { ...chat, isMinimized: false } : chat
        );
      }
    });
  };

  // Expose openChat function globally for use in other components
  useEffect(() => {
    (window as any).openChatWindow = (chatId: string | null, userId: string | null = null) => {
      openChat(chatId, userId);
    };
    return () => {
      delete (window as any).openChatWindow;
    };
  }, [openChat]);

  return (
    <>
      {/* Minimized chat windows bar */}
      {openChats.filter((chat) => chat.isMinimized).length > 0 && (
        <div className="fixed bottom-0 right-4 flex gap-2 z-40">
          {openChats
            .filter((chat) => chat.isMinimized)
            .map((chat) => (
              <button
                key={chat.id}
                onClick={() => restoreChat(chat.id)}
                className="h-10 w-10 bg-[#2f3136] hover:bg-[#393c43] text-white rounded-t-lg border-t border-x border-[#202225] transition-colors flex items-center justify-center text-xs font-semibold"
                title={chat.chatName || 'Chat'}
              >
                {chat.initials || 'C'}
              </button>
            ))}
        </div>
      )}

      {/* Open chat windows - positioned side by side */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-50 flex-row-reverse">
        {openChats
          .filter((chat) => !chat.isMinimized)
          .slice(0, 3) // Ensure max 3 open windows
          .map((chat, index) => (
            <ChatWindowWrapper
              key={chat.id}
              chat={chat}
              index={index}
              onClose={() => closeChat(chat.id)}
              onMinimize={() => minimizeChat(chat.id)}
              onChatLoaded={(chatName, initials) => {
                setOpenChats((chats) =>
                  chats.map((c) =>
                    c.id === chat.id ? { ...c, chatName, initials } : c
                  )
                );
              }}
            />
          ))}
      </div>
    </>
  );
}

// Separate component to avoid recreating callbacks in map
function ChatWindowWrapper({
  chat,
  index,
  onClose,
  onMinimize,
  onChatLoaded,
}: {
  chat: OpenChat;
  index: number;
  onClose: () => void;
  onMinimize: () => void;
  onChatLoaded: (chatName: string, initials: string) => void;
}) {
  const stableOnChatLoaded = useCallback(
    (chatName: string, initials: string) => {
      onChatLoaded(chatName, initials);
    },
    [onChatLoaded]
  );

  return (
    <div
      style={{
        zIndex: 50 + index,
      }}
    >
              <ChatWindow
                chatId={chat.chatId}
                userId={chat.userId}
                userName={chat.userName}
                onClose={onClose}
                onMinimize={onMinimize}
                onChatLoaded={stableOnChatLoaded}
              />
    </div>
  );
}

