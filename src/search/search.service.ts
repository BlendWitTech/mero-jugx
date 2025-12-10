import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Or } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Organization } from '../database/entities/organization.entity';
import { Role } from '../database/entities/role.entity';
import { Chat } from '../database/entities/chat.entity';
import { Message } from '../database/entities/message.entity';
import { CacheService } from '../common/services/cache.service';

export interface SearchResult {
  users: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  }>;
  roles: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  chats: Array<{
    id: string;
    name: string | null;
    type: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    chat_id: string;
    chat_name: string | null;
    created_at: Date;
    sender_name: string;
  }>;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private cacheService: CacheService,
  ) {}

  /**
   * Global search across all entities in an organization
   */
  async globalSearch(
    organizationId: string,
    query: string,
    limit: number = 20,
  ): Promise<SearchResult> {
    const cacheKey = `search:org:${organizationId}:${query}:${limit}`;
    
    return this.cacheService.getOrSet(cacheKey, async () => {
      const searchTerm = `%${query}%`;

      const [users, roles, chats, messages] = await Promise.all([
        this.searchUsers(organizationId, searchTerm, limit),
        this.searchRoles(organizationId, searchTerm, limit),
        this.searchChats(organizationId, searchTerm, limit),
        this.searchMessages(organizationId, searchTerm, limit),
      ]);

      return {
        users,
        roles,
        chats,
        messages,
      };
    }, 60); // Cache for 1 minute
  }

  /**
   * Search users in organization
   */
  private async searchUsers(
    organizationId: string,
    searchTerm: string,
    limit: number,
  ) {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.organization_memberships', 'member')
      .where('member.organization_id = :orgId', { orgId: organizationId })
      .andWhere('member.status = :status', { status: 'active' })
      .andWhere(
        '(user.email ILIKE :term OR user.first_name ILIKE :term OR user.last_name ILIKE :term)',
        { term: searchTerm },
      )
      .select([
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.avatar_url',
      ])
      .limit(limit)
      .getMany();

    return results.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
    }));
  }

  /**
   * Search roles in organization
   */
  private async searchRoles(
    organizationId: string,
    searchTerm: string,
    limit: number,
  ) {
    const results = await this.roleRepository
      .createQueryBuilder('role')
      .where('role.organization_id = :orgId', { orgId: organizationId })
      .andWhere('role.is_active = :isActive', { isActive: true })
      .andWhere('(role.name ILIKE :term OR role.description ILIKE :term)', {
        term: searchTerm,
      })
      .select(['role.id', 'role.name', 'role.description'])
      .limit(limit)
      .getMany();

    return results.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  /**
   * Search chats in organization
   */
  private async searchChats(
    organizationId: string,
    searchTerm: string,
    limit: number,
  ) {
    const results = await this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.organization_id = :orgId', { orgId: organizationId })
      .andWhere('chat.status = :status', { status: 'active' })
      .andWhere('(chat.name ILIKE :term)', { term: searchTerm })
      .select(['chat.id', 'chat.name', 'chat.type'])
      .limit(limit)
      .getMany();

    return results.map(chat => ({
      id: chat.id,
      name: chat.name,
      type: chat.type,
    }));
  }

  /**
   * Search messages in organization chats
   */
  private async searchMessages(
    organizationId: string,
    searchTerm: string,
    limit: number,
  ) {
    const results = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.chat', 'chat')
      .leftJoin('message.sender', 'sender')
      .leftJoin('chat.members', 'member')
      .where('chat.organization_id = :orgId', { orgId: organizationId })
      .andWhere('chat.status = :status', { status: 'active' })
      .andWhere('message.content ILIKE :term', { term: searchTerm })
      .andWhere('message.status != :deleted', { deleted: 'deleted' })
      .select([
        'message.id',
        'message.content',
        'message.created_at',
        'chat.id',
        'chat.name',
        'sender.first_name',
        'sender.last_name',
      ])
      .orderBy('message.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return results.map(message => ({
      id: message.id,
      content: message.content,
      chat_id: (message.chat as any).id,
      chat_name: (message.chat as any).name,
      created_at: message.created_at,
      sender_name: `${(message as any).sender?.first_name || ''} ${(message as any).sender?.last_name || ''}`.trim(),
    }));
  }

  /**
   * Search messages within a specific chat
   */
  async searchChatMessages(
    chatId: string,
    query: string,
    limit: number = 50,
  ) {
    const searchTerm = `%${query}%`;

    const results = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .where('message.chat_id = :chatId', { chatId })
      .andWhere('message.content ILIKE :term', { term: searchTerm })
      .andWhere('message.status != :deleted', { deleted: 'deleted' })
      .select([
        'message.id',
        'message.content',
        'message.created_at',
        'message.type',
        'sender.id',
        'sender.first_name',
        'sender.last_name',
        'sender.avatar_url',
      ])
      .orderBy('message.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return results.map(message => ({
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      type: message.type,
      sender: {
        id: (message as any).sender?.id,
        name: `${(message as any).sender?.first_name || ''} ${(message as any).sender?.last_name || ''}`.trim(),
        avatar_url: (message as any).sender?.avatar_url,
      },
    }));
  }
}

