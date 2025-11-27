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

    // Listen for new messages
    socket.on('message:new', (data: { message: any; chat_id: string }) => {
      // Invalidate chat queries to refresh unread counts
      queryClient.invalidateQueries({ queryKey: ['chats', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.chat_id] });
    });

    // Listen for new chats
    socket.on('chat:new', () => {
      queryClient.invalidateQueries({ queryKey: ['chats', organization.id] });
    });

    return () => {
      chatService.disconnect();
    };
  }, [organization?.id, accessToken, queryClient]);

  const openChat = useCallback((chatId: string | null, userId: string | null = null, chatName?: string, initials?: string, userName?: string) => {
    setOpenChats((openChats) => {
      // Check if chat is already open
      const existingChat = openChats.find(
        (chat) => (chatId && chat.chatId === chatId) || (userId && chat.userId === userId)
      );

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
                  ? { ...chat, isMinimized: false, chatName, initials }
                  : chat
              );
            } else {
            return openChats.map((chat) =>
              chat.id === existingChat.id ? { ...chat, isMinimized: false, chatName, initials, userName } : chat
            );
            }
          } else {
            return openChats.map((chat) =>
              chat.id === existingChat.id ? { ...chat, isMinimized: false, chatName, initials, userName } : chat
            );
          }
        }
        return openChats; // Already open and not minimized
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
    setOpenChats((chats) => chats.filter((chat) => chat.id !== chatId));
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

