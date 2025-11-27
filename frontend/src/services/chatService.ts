import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  organization_id: string;
  created_by_user_id: string | null;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  members?: ChatMember[];
  last_message?: Message;
  unread_count?: number;
}

export interface ChatMember {
  id: number;
  chat_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'left' | 'removed';
  last_read_at: string | null;
  unread_count: number;
  notifications_enabled: boolean;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  type: 'text' | 'attachment' | 'call_start' | 'call_end' | 'system';
  content: string | null;
  parent_message_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessageAttachment {
  id: number;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  thumbnail_url: string | null;
  created_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

class ChatService {
  private socket: Socket | null = null;

  getSocket(): Socket | null {
    return this.socket;
  }

  connect(organizationId: string, token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(`${API_URL}/chat`, {
      auth: {
        token,
      },
      query: {
        organizationId,
        token, // Also pass in query for fallback
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`, // Also pass in headers
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async getChats(organizationId: string, params?: { type?: string; page?: number; limit?: number }): Promise<{
    chats: Chat[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await axios.get(`${API_URL}/api/v1/chats`, {
      params,
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
    return response.data;
  }

  async getChat(organizationId: string, chatId: string): Promise<Chat> {
    const response = await axios.get(`${API_URL}/api/v1/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
    return response.data;
  }

  async getMessages(
    organizationId: string,
    chatId: string,
    params?: { page?: number; limit?: number; before?: string },
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await axios.get(
      `${API_URL}/api/v1/chats/${chatId}/messages`,
      {
        params,
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
    return response.data;
  }

  async createChat(organizationId: string, data: {
    type: 'direct' | 'group';
    name?: string;
    description?: string;
    member_ids?: string[];
  }): Promise<Chat> {
    const response = await axios.post(`${API_URL}/api/v1/chats`, data, {
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
    return response.data;
  }

  async sendMessage(
    organizationId: string,
    chatId: string,
    data: {
      type: 'text' | 'attachment';
      content?: string;
      reply_to_id?: string;
      attachments?: Array<{
        file_name: string;
        file_url: string;
        file_type: string;
        file_size: string;
        thumbnail_url?: string;
      }>;
    },
  ): Promise<Message> {
    const response = await axios.post(
      `${API_URL}/api/v1/chats/${chatId}/messages`,
      data,
      {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
    return response.data;
  }

  async addMember(organizationId: string, chatId: string, userId: string): Promise<void> {
    await axios.post(
      `${API_URL}/api/v1/chats/${chatId}/members`,
      { member_ids: [userId] },
      {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
  }

  async removeMember(organizationId: string, chatId: string, memberId: number): Promise<void> {
    await axios.delete(
      `${API_URL}/api/v1/chats/${chatId}/members/${memberId}`,
      {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
  }

  async updateChat(organizationId: string, chatId: string, data: {
    name?: string;
    description?: string;
    avatar_url?: string;
  }): Promise<Chat> {
    const response = await axios.put(
      `${API_URL}/api/v1/chats/${chatId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
    return response.data;
  }

  async deleteChat(organizationId: string, chatId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/v1/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
  }
}

export const chatService = new ChatService();

