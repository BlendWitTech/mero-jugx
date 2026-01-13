import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminChat, AdminChatStatus } from '../database/entities/admin_chats.entity';
import { AdminChatMessage, AdminChatMessageType } from '../database/entities/admin_chat_messages.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { CreateAdminChatDto } from './dto/create-admin-chat.dto';
import { SendAdminChatMessageDto } from './dto/send-admin-chat-message.dto';
import { AdminChatQueryDto } from './dto/admin-chat-query.dto';
import { TicketsService } from '../tickets/tickets.service';
import { CreateTicketFromChatDto } from '../tickets/dto/create-ticket-from-chat.dto';

@Injectable()
export class AdminChatService {
  constructor(
    @InjectRepository(AdminChat)
    private adminChatRepository: Repository<AdminChat>,
    @InjectRepository(AdminChatMessage)
    private messageRepository: Repository<AdminChatMessage>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private ticketsService: TicketsService,
  ) {}

  /**
   * Verify user is member of organization and has permission to chat with admin
   */
  private async verifyUserAccess(userId: string, organizationId: string): Promise<OrganizationMember> {
    const member = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check if user's role has permission to chat with admin
    const hasPermission = 
      member.role?.is_organization_owner === true ||
      (Array.isArray(member.role?.role_permissions) &&
        member.role.role_permissions.some(
          (rp) => rp?.permission?.slug === 'admin_chat.access',
        )) ||
      false;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to chat with system admin');
    }

    return member;
  }

  /**
   * Check if user is system admin
   */
  private async isSystemAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    // For now, check if user has a special flag or role
    // This should be enhanced when system admin dashboard is created
    // For now, we'll use a simple check - you can add a is_system_admin field later
    return user?.email?.endsWith('@merojugx.com') || false; // Temporary check
  }

  /**
   * Create a new admin chat
   */
  async createChat(userId: string, organizationId: string, dto: CreateAdminChatDto): Promise<AdminChat> {
    await this.verifyUserAccess(userId, organizationId);

    const chat = this.adminChatRepository.create({
      organization_id: organizationId,
      user_id: userId,
      subject: dto.subject || null,
      status: AdminChatStatus.OPEN,
    });

    const savedChat = await this.adminChatRepository.save(chat);

    // If initial message is provided, create it
    if (dto.initial_message) {
      await this.sendMessage(userId, organizationId, savedChat.id, {
        content: dto.initial_message,
        type: AdminChatMessageType.TEXT,
      });
    }

    // Return the chat without loading all messages (just created, so no messages yet)
    return this.findOne(userId, organizationId, savedChat.id, false);
  }

  /**
   * Get all admin chats for a user
   */
  async findAll(userId: string, organizationId: string, query: AdminChatQueryDto) {
    await this.verifyUserAccess(userId, organizationId);

    const isAdmin = await this.isSystemAdmin(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    
    const queryBuilder = this.adminChatRepository.createQueryBuilder('chat');

    if (isAdmin) {
      // System admin can see all chats
      queryBuilder.where('1=1');
    } else {
      // Regular users can only see their own chats
      queryBuilder.where('chat.user_id = :userId', { userId });
    }

    queryBuilder.andWhere('chat.organization_id = :organizationId', { organizationId });

    if (query.status) {
      queryBuilder.andWhere('chat.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(chat.subject ILIKE :search OR EXISTS (SELECT 1 FROM admin_chat_messages m WHERE m.admin_chat_id = chat.id AND m.content ILIKE :search))',
        { search: `%${query.search}%` },
      );
    }

    // Get count using a clone to avoid modifying the main query
    const countQueryBuilder = queryBuilder.clone();
    const total = await countQueryBuilder.getCount();

    // Build the query with proper ordering
    // Use created_at as primary sort, then last_message_at (NULLs will be handled by PostgreSQL)
    const chats = await queryBuilder
      .leftJoinAndSelect('chat.user', 'user')
      .leftJoinAndSelect('chat.admin', 'admin')
      .leftJoinAndSelect('chat.organization', 'organization')
      .orderBy('chat.created_at', 'DESC')
      .addOrderBy('chat.last_message_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      chats: chats || [],
      total: total || 0,
      page,
      limit,
      totalPages: Math.ceil((total || 0) / limit),
    };
  }

  /**
   * Get a single admin chat
   */
  async findOne(userId: string, organizationId: string, chatId: string, includeMessages: boolean = false): Promise<AdminChat> {
    const isAdmin = await this.isSystemAdmin(userId);

    const relations = ['user', 'admin', 'organization'];
    if (includeMessages) {
      relations.push('messages', 'messages.sender');
    }

    const chat = await this.adminChatRepository.findOne({
      where: { id: chatId, organization_id: organizationId },
      relations,
    });

    if (!chat) {
      throw new NotFoundException('Admin chat not found');
    }

    // Check access
    if (!isAdmin && chat.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    return chat;
  }

  /**
   * Send a message in admin chat
   */
  async sendMessage(
    userId: string,
    organizationId: string,
    chatId: string,
    dto: SendAdminChatMessageDto,
  ): Promise<AdminChatMessage> {
    // Don't load messages when just sending a message - we only need the chat metadata
    const chat = await this.findOne(userId, organizationId, chatId, false);
    const isAdmin = await this.isSystemAdmin(userId);

    // Verify user is either the chat owner or a system admin
    if (!isAdmin && chat.user_id !== userId) {
      throw new ForbiddenException('You cannot send messages in this chat');
    }

    const message = this.messageRepository.create({
      admin_chat_id: chatId,
      sender_id: userId,
      content: dto.content,
      type: dto.type || AdminChatMessageType.TEXT,
      is_from_admin: isAdmin,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update chat last message
    chat.last_message_at = new Date();
    chat.last_message_id = savedMessage.id;

    // Update unread counts
    if (isAdmin) {
      chat.unread_count_user += 1;
    } else {
      chat.unread_count_admin += 1;
    }

    await this.adminChatRepository.save(chat);

    // Load the message with sender relation for the response
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'attachments'],
    });

    return messageWithSender || savedMessage;
  }

  /**
   * Get messages for an admin chat
   */
  async getMessages(
    userId: string,
    organizationId: string,
    chatId: string,
    query: { page?: number; limit?: number },
  ) {
    await this.findOne(userId, organizationId, chatId); // Verify access

    const page = query.page || 1;
    const limit = query.limit || 50;

    const messages = await this.messageRepository.find({
      where: { admin_chat_id: chatId },
      relations: ['sender', 'attachments'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mark messages as read
    const isAdmin = await this.isSystemAdmin(userId);
    const chat = await this.adminChatRepository.findOne({ where: { id: chatId } });
    if (chat) {
      if (isAdmin) {
        chat.unread_count_admin = 0;
      } else {
        chat.unread_count_user = 0;
      }
      await this.adminChatRepository.save(chat);
    }

    return {
      messages: messages.reverse(), // Return in chronological order
      page,
      limit,
    };
  }

  /**
   * Update chat status (for admins)
   */
  async updateStatus(
    userId: string,
    organizationId: string,
    chatId: string,
    status: AdminChatStatus,
  ): Promise<AdminChat> {
    const isAdmin = await this.isSystemAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only system admins can update chat status');
    }

    const chat = await this.findOne(userId, organizationId, chatId);
    chat.status = status;
    if (status === AdminChatStatus.IN_PROGRESS && !chat.admin_id) {
      chat.admin_id = userId;
    }

    return this.adminChatRepository.save(chat);
  }

  /**
   * Flag an admin chat message to create a ticket
   */
  async flagMessage(
    userId: string,
    organizationId: string,
    chatId: string,
    dto: CreateTicketFromChatDto,
  ) {
    const chat = await this.findOne(userId, organizationId, chatId);

    // Verify message exists and belongs to this chat
    const message = await this.messageRepository.findOne({
      where: { id: dto.message_id, admin_chat_id: chatId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found in this admin chat');
    }

    // Build description with admin chat context
    let description = dto.description || dto.message_excerpt || `Ticket created from admin chat message:\n\n${message.content || ''}`;
    
    description += `\n\n--- Admin Chat Details ---\n`;
    description += `Chat Type: Admin Chat\n`;
    description += `Subject: ${chat.subject || 'No subject'}\n`;
    description += `Chat Status: ${chat.status}\n`;
    
    if (message.sender) {
      const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || message.sender.email;
      description += `Message Sender: ${senderName} (${message.is_from_admin ? 'Admin' : 'User'})\n`;
    }

    if (dto.related_issue) {
      description += `\n--- Related Issue ---\n${dto.related_issue}\n`;
    }

    if (dto.urgency_reason && dto.priority === 'high') {
      description += `\n--- Urgency Reason ---\n${dto.urgency_reason}\n`;
    }

    // Use tickets service to create ticket
    const ticketDto: CreateTicketFromChatDto = {
      ...dto,
      chat_id: chatId,
      description,
      chat_source_type: 'admin_chat' as any,
      sender_id: message.sender_id,
      sender_name: message.sender ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() : undefined,
    };

    return this.ticketsService.createFromChat(userId, organizationId, ticketDto);
  }
}

