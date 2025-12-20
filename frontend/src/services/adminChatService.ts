import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const getApiUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    return viteApiUrl.endsWith('/') ? viteApiUrl.slice(0, -1) : viteApiUrl;
  }
  return '/api/v1';
};

const API_URL = getApiUrl();

export interface AdminChat {
  id: string;
  organization_id: string;
  user_id: string;
  subject: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  unread_count_user?: number;
  unread_count_admin?: number;
}

export interface AdminChatMessage {
  id: string;
  admin_chat_id: string;
  sender_id: string;
  is_from_admin: boolean;
  content: string;
  is_read: boolean;
  type: 'text' | 'system';
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
  attachments?: AdminChatMessageAttachment[];
}

export interface AdminChatMessageAttachment {
  id: number;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

class AdminChatService {
  async getChats(organizationId: string, params?: { status?: string; page?: number; limit?: number }): Promise<{
    chats: AdminChat[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await axios.get(`${API_URL}/admin-chat`, {
      params,
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
    return response.data;
  }

  async getChat(organizationId: string, chatId: string): Promise<AdminChat> {
    const response = await axios.get(`${API_URL}/admin-chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
    return response.data;
  }

  async createChat(organizationId: string, data: {
    subject: string;
    initial_message: string;
  }): Promise<AdminChat> {
    const response = await axios.post(`${API_URL}/admin-chat`, data, {
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
    });
    return response.data;
  }

  async getMessages(
    organizationId: string,
    chatId: string,
    params?: { page?: number; limit?: number },
  ): Promise<{
    messages: AdminChatMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await axios.get(
      `${API_URL}/admin-chat/${chatId}/messages`,
      {
        params,
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
    return response.data;
  }

  async sendMessage(
    organizationId: string,
    chatId: string,
    data: {
      content: string;
      type?: 'text' | 'system';
    },
  ): Promise<AdminChatMessage> {
    // Only send content and type to match backend DTO (attachments not supported yet)
    const payload: { content: string; type?: 'text' | 'system' } = {
      content: data.content,
    };
    if (data.type) {
      payload.type = data.type;
    }

    const response = await axios.post(
      `${API_URL}/admin-chat/${chatId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      },
    );
    return response.data;
  }
}

export const adminChatService = new AdminChatService();

