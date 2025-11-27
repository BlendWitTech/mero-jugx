import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Chat, ChatType, ChatStatus } from '../database/entities/chat.entity';
import { ChatMember, ChatMemberRole, ChatMemberStatus } from '../database/entities/chat-member.entity';
import { Message, MessageType, MessageStatus } from '../database/entities/message.entity';
import { MessageAttachment } from '../database/entities/message-attachment.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import { User } from '../database/entities/user.entity';
import { Package } from '../database/entities/package.entity';
import { OrganizationPackageFeature, OrganizationPackageFeatureStatus } from '../database/entities/organization-package-feature.entity';
import { PackageFeature } from '../database/entities/package-feature.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatQueryDto } from './dto/chat-query.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationHelperService, NotificationType } from '../notifications/notification-helper.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMember)
    private chatMemberRepository: Repository<ChatMember>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageAttachment)
    private attachmentRepository: Repository<MessageAttachment>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(OrganizationPackageFeature)
    private orgFeatureRepository: Repository<OrganizationPackageFeature>,
    @InjectRepository(PackageFeature)
    private featureRepository: Repository<PackageFeature>,
    private dataSource: DataSource,
    private auditLogsService: AuditLogsService,
    private notificationHelper: NotificationHelperService,
  ) {}

  /**
   * Check if organization has access to chat feature
   */
  async hasChatAccess(organizationId: string): Promise<boolean> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      return false;
    }

    // Check if package is Platinum or Diamond (includes chat)
    if (organization.package.slug === 'platinum' || organization.package.slug === 'diamond') {
      return true;
    }

    // Check if they have purchased the chat feature separately
    const chatFeature = await this.featureRepository.findOne({
      where: { slug: 'chat-system' },
    });

    if (!chatFeature) {
      return false;
    }

    const orgFeature = await this.orgFeatureRepository.findOne({
      where: {
        organization_id: organizationId,
        feature_id: chatFeature.id,
        status: OrganizationPackageFeatureStatus.ACTIVE,
      },
    });

    return !!orgFeature;
  }

  /**
   * Verify user is member of organization
   */
  async verifyMembership(userId: string, organizationId: string): Promise<OrganizationMember> {
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return membership;
  }

  /**
   * Create a new chat (direct or group)
   */
  async createChat(userId: string, organizationId: string, dto: CreateChatDto): Promise<Chat> {
    // Check chat access
    const hasAccess = await this.hasChatAccess(organizationId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'Chat feature is not available. Please upgrade to Platinum or Diamond package, or purchase the Chat System feature.',
      );
    }

    // Verify membership
    await this.verifyMembership(userId, organizationId);

    // For direct chats, ensure exactly 2 members
    if (dto.type === ChatType.DIRECT) {
      if (dto.member_ids.length !== 1) {
        throw new BadRequestException('Direct chat must have exactly one other member');
      }

      // Check if direct chat already exists
      const existingDirectChat = await this.findDirectChat(organizationId, userId, dto.member_ids[0]);
      if (existingDirectChat) {
        return existingDirectChat;
      }
    } else {
      // For group chats, check permission
      // TODO: Check if user has 'chat.create_group' permission
      if (!dto.name) {
        throw new BadRequestException('Group chat must have a name');
      }
    }

    // Verify all members exist and are in the organization
    const members = await this.memberRepository.find({
      where: {
        user_id: In([userId, ...dto.member_ids]),
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (members.length !== dto.member_ids.length + 1) {
      throw new BadRequestException('Some members are not part of this organization');
    }

    // Create chat
    const chat = this.chatRepository.create({
      organization_id: organizationId,
      type: dto.type,
      name: dto.type === ChatType.GROUP ? dto.name : null,
      description: dto.description || null,
      created_by: userId,
      status: ChatStatus.ACTIVE,
    });

    const savedChat = await this.chatRepository.save(chat);

    // Add members
    const chatMembers: ChatMember[] = [
      // Creator is owner for groups, member for direct
      this.chatMemberRepository.create({
        chat_id: savedChat.id,
        user_id: userId,
        role: dto.type === ChatType.GROUP ? ChatMemberRole.OWNER : ChatMemberRole.MEMBER,
        status: ChatMemberStatus.ACTIVE,
      }),
      // Other members
      ...dto.member_ids.map((memberId) =>
        this.chatMemberRepository.create({
          chat_id: savedChat.id,
          user_id: memberId,
          role: ChatMemberRole.MEMBER,
          status: ChatMemberStatus.ACTIVE,
        }),
      ),
    ];

    await this.chatMemberRepository.save(chatMembers);

    // Get creator info
    const creator = await this.userRepository.findOne({ where: { id: userId } });
    const creatorName = creator ? `${creator.first_name} ${creator.last_name}`.trim() : 'Someone';

    // Create notifications for other members (chat initiated)
    // For direct chats, notify the other person
    // For group chats, notify all members except creator
    const otherMembers = dto.member_ids;
    for (const memberId of otherMembers) {
      await this.notificationHelper.createNotification(
        memberId,
        organizationId,
        NotificationType.CHAT_INITIATED,
        dto.type === ChatType.GROUP
          ? `Added to ${dto.name || 'group'}`
          : `${creatorName} started a conversation`,
        dto.type === ChatType.GROUP
          ? `${creatorName} added you to the group "${dto.name || 'group'}"`
          : `${creatorName} started a conversation with you`,
        {
          route: '/chat',
          params: { chatId: savedChat.id },
        },
        {
          chat_id: savedChat.id,
          chat_name: dto.name,
          chat_type: dto.type,
          created_by_id: userId,
          created_by_name: creatorName,
        },
      );
    }

    // Audit log
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'chat.created',
      'chat',
      savedChat.id,
      null,
      {
        chat_type: dto.type,
        chat_name: dto.name,
      },
    );

    return this.findOne(userId, organizationId, savedChat.id);
  }

  /**
   * Find existing direct chat between two users
   */
  async findDirectChat(organizationId: string, userId1: string, userId2: string): Promise<Chat | null> {
    const chats = await this.chatRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.members', 'member1', 'member1.user_id = :userId1', { userId1 })
      .innerJoin('chat.members', 'member2', 'member2.user_id = :userId2', { userId2 })
      .where('chat.organization_id = :organizationId', { organizationId })
      .andWhere('chat.type = :type', { type: ChatType.DIRECT })
      .andWhere('chat.status = :status', { status: ChatStatus.ACTIVE })
      .andWhere('member1.status = :memberStatus', { memberStatus: ChatMemberStatus.ACTIVE })
      .andWhere('member2.status = :memberStatus', { memberStatus: ChatMemberStatus.ACTIVE })
      .getOne();

    return chats;
  }

  /**
   * Get all chats for a user
   */
  async findAll(userId: string, organizationId: string, query: ChatQueryDto): Promise<{
    chats: Chat[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Check chat access
    const hasAccess = await this.hasChatAccess(organizationId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'Chat feature is not available. Please upgrade to Platinum or Diamond package, or purchase the Chat System feature.',
      );
    }

    await this.verifyMembership(userId, organizationId);

    // Ensure pagination defaults are applied
    const page = query.page || 1;
    const limit = query.limit || 20;

    const queryBuilder = this.chatRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.members', 'member', 'member.user_id = :userId', { userId })
      .where('chat.organization_id = :organizationId', { organizationId })
      .andWhere('member.status = :memberStatus', { memberStatus: ChatMemberStatus.ACTIVE })
      .andWhere('chat.status = :chatStatus', { chatStatus: ChatStatus.ACTIVE });

    if (query.type) {
      queryBuilder.andWhere('chat.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('chat.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere('(chat.name ILIKE :search OR chat.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const total = await queryBuilder.getCount();

    const chats = await queryBuilder
      .orderBy('chat.last_message_at', 'DESC')
      .addOrderBy('chat.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      chats,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single chat with details
   */
  async findOne(userId: string, organizationId: string, chatId: string): Promise<Chat> {
    await this.verifyMembership(userId, organizationId);

    const chat = await this.chatRepository.findOne({
      where: { id: chatId, organization_id: organizationId },
      relations: ['members', 'members.user', 'creator'],
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check if user is a member
    const isMember = chat.members.some(
      (member) => member.user_id === userId && member.status === ChatMemberStatus.ACTIVE,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return chat;
  }

  /**
   * Update chat details
   */
  async updateChat(
    userId: string,
    organizationId: string,
    chatId: string,
    dto: UpdateChatDto,
  ): Promise<Chat> {
    const chat = await this.findOne(userId, organizationId, chatId);

    // Only group chats can be updated
    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Only group chats can be updated');
    }

    // Check if user has permission (owner or admin)
    const member = chat.members.find((m) => m.user_id === userId && m.status === ChatMemberStatus.ACTIVE);
    if (!member || (member.role !== ChatMemberRole.OWNER && member.role !== ChatMemberRole.ADMIN)) {
      throw new ForbiddenException('You do not have permission to update this chat');
    }

    if (dto.name !== undefined) chat.name = dto.name;
    if (dto.description !== undefined) chat.description = dto.description;
    if (dto.avatar_url !== undefined) chat.avatar_url = dto.avatar_url;

    await this.chatRepository.save(chat);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'chat.updated',
      'chat',
      chatId,
      null,
      dto,
    );

    return this.findOne(userId, organizationId, chatId);
  }

  /**
   * Delete/Archive a chat
   */
  async deleteChat(userId: string, organizationId: string, chatId: string): Promise<void> {
    const chat = await this.findOne(userId, organizationId, chatId);

    // For group chats, check permission
    if (chat.type === ChatType.GROUP) {
      const member = chat.members.find((m) => m.user_id === userId && m.status === ChatMemberStatus.ACTIVE);
      if (!member || member.role !== ChatMemberRole.OWNER) {
        throw new ForbiddenException('Only the owner can delete group chats');
      }
    }

    chat.status = ChatStatus.DELETED;
    await this.chatRepository.save(chat);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'chat.deleted',
      'chat',
      chatId,
      null,
      null,
    );
  }

  /**
   * Add members to a group chat
   */
  async addMembers(
    userId: string,
    organizationId: string,
    chatId: string,
    dto: AddMemberDto,
  ): Promise<Chat> {
    const chat = await this.findOne(userId, organizationId, chatId);

    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Can only add members to group chats');
    }

    // Check permission
    const member = chat.members.find((m) => m.user_id === userId && m.status === ChatMemberStatus.ACTIVE);
    if (!member || (member.role !== ChatMemberRole.OWNER && member.role !== ChatMemberRole.ADMIN)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // Verify all users are in the organization
    const orgMembers = await this.memberRepository.find({
      where: {
        user_id: In(dto.user_ids),
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (orgMembers.length !== dto.user_ids.length) {
      throw new BadRequestException('Some users are not part of this organization');
    }

    // Add members (skip if already members)
    const existingMemberIds = chat.members
      .filter((m) => m.status === ChatMemberStatus.ACTIVE)
      .map((m) => m.user_id);

    const newMemberIds = dto.user_ids.filter((id) => !existingMemberIds.includes(id));

    if (newMemberIds.length > 0) {
      const newMembers = newMemberIds.map((memberId) =>
        this.chatMemberRepository.create({
          chat_id: chatId,
          user_id: memberId,
          role: ChatMemberRole.MEMBER,
          status: ChatMemberStatus.ACTIVE,
        }),
      );

      await this.chatMemberRepository.save(newMembers);

      // Get adder info
      const adder = await this.userRepository.findOne({ where: { id: userId } });
      const adderName = adder ? `${adder.first_name} ${adder.last_name}`.trim() : 'Someone';

      // Create notifications for newly added members
      for (const memberId of newMemberIds) {
        await this.notificationHelper.createNotification(
          memberId,
          organizationId,
          NotificationType.CHAT_GROUP_ADDED,
          `Added to ${chat.name}`,
          `${adderName} added you to the group "${chat.name}"`,
          {
            route: '/chat',
            params: { chatId },
          },
          {
            chat_id: chatId,
            chat_name: chat.name,
            added_by_id: userId,
            added_by_name: adderName,
          },
        );
      }
    }

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'chat.members.added',
      'chat',
      chatId,
      null,
      { user_ids: dto.user_ids },
    );

    return this.findOne(userId, organizationId, chatId);
  }

  /**
   * Remove a member from a group chat
   */
  async removeMember(
    userId: string,
    organizationId: string,
    chatId: string,
    memberId: string,
  ): Promise<void> {
    const chat = await this.findOne(userId, organizationId, chatId);

    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Can only remove members from group chats');
    }

    // Check permission
    const requesterMember = chat.members.find((m) => m.user_id === userId && m.status === ChatMemberStatus.ACTIVE);
    if (!requesterMember || (requesterMember.role !== ChatMemberRole.OWNER && requesterMember.role !== ChatMemberRole.ADMIN)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // Cannot remove owner
    const targetMember = chat.members.find((m) => m.user_id === memberId);
    if (targetMember?.role === ChatMemberRole.OWNER) {
      throw new BadRequestException('Cannot remove the chat owner');
    }

    if (targetMember) {
      targetMember.status = ChatMemberStatus.REMOVED;
      await this.chatMemberRepository.save(targetMember);
    }

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'chat.member.removed',
      'chat',
      chatId,
      null,
      { removed_user_id: memberId },
    );
  }

  /**
   * Leave a chat
   */
  async leaveChat(userId: string, organizationId: string, chatId: string): Promise<void> {
    const chat = await this.findOne(userId, organizationId, chatId);

    if (chat.type === ChatType.GROUP) {
      const member = chat.members.find((m) => m.user_id === userId && m.status === ChatMemberStatus.ACTIVE);
      if (member?.role === ChatMemberRole.OWNER) {
        throw new BadRequestException('Owner cannot leave the chat. Transfer ownership or delete the chat instead.');
      }
    }

    const member = await this.chatMemberRepository.findOne({
      where: { chat_id: chatId, user_id: userId },
    });

    if (member) {
      member.status = ChatMemberStatus.LEFT;
      await this.chatMemberRepository.save(member);
    }

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'chat.left',
      'chat',
      chatId,
      null,
      null,
    );
  }

  /**
   * Send a message
   */
  async sendMessage(
    userId: string,
    organizationId: string,
    chatId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const chat = await this.findOne(userId, organizationId, chatId);

    // Create message
    const message = this.messageRepository.create({
      chat_id: chatId,
      sender_id: userId,
      type: dto.type,
      content: dto.content || null,
      reply_to_id: dto.reply_to_id || null,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Save attachments if any
    if (dto.attachments && dto.attachments.length > 0) {
      const attachments = dto.attachments.map((att) => {
        // Convert file_size string to number (TypeORM handles bigint as number)
        const fileSize = typeof att.file_size === 'string' 
          ? parseInt(att.file_size, 10) 
          : (typeof att.file_size === 'number' ? att.file_size : 0);
        
        return this.attachmentRepository.create({
          message_id: savedMessage.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_type: att.file_type,
          file_size: fileSize,
          thumbnail_url: att.thumbnail_url || null,
        });
      });

      await this.attachmentRepository.save(attachments);
    }

    // Update chat last message
    chat.last_message_at = new Date();
    chat.last_message_id = savedMessage.id;
    await this.chatRepository.save(chat);

    // Get sender info for notifications
    const sender = await this.userRepository.findOne({ where: { id: userId } });
    const senderName = sender ? `${sender.first_name} ${sender.last_name}`.trim() : 'Someone';

    // Get chat members (excluding sender)
    const chatMembers = chat.members.filter(
      (m) => m.user_id !== userId && m.status === ChatMemberStatus.ACTIVE,
    );

    // Check for mentions in message content
    const mentionRegex = /@(\w+)/g;
    const mentionedUsernames: string[] = [];
    if (dto.content) {
      const matches = dto.content.match(mentionRegex);
      if (matches) {
        mentionedUsernames.push(...matches.map((m) => m.substring(1)));
      }
    }

    // Increment unread count for all members except sender
    await this.chatMemberRepository
      .createQueryBuilder()
      .update(ChatMember)
      .set({ unread_count: () => 'unread_count + 1' })
      .where('chat_id = :chatId', { chatId })
      .andWhere('user_id != :userId', { userId })
      .andWhere('status = :status', { status: ChatMemberStatus.ACTIVE })
      .execute();

    // Create notifications for chat members
    for (const member of chatMembers) {
      // Check if user is mentioned
      const isMentioned = mentionedUsernames.some((username) => {
        const memberUser = member.user;
        if (!memberUser) return false;
        const fullName = `${memberUser.first_name} ${memberUser.last_name}`.trim().toLowerCase();
        const email = memberUser.email.toLowerCase();
        return fullName.includes(username.toLowerCase()) || email.includes(username.toLowerCase());
      });

      // Get member user details
      const memberUser = await this.userRepository.findOne({ where: { id: member.user_id } });
      if (!memberUser) continue;

      // Check if user is online (via gateway - we'll pass this info or check separately)
      // For now, we'll create notifications and let the gateway handle online/offline logic
      
      if (isMentioned) {
        // Create mention notification
        await this.notificationHelper.createNotification(
          member.user_id,
          organizationId,
          NotificationType.CHAT_MENTION,
          chat.type === ChatType.GROUP ? `${senderName} mentioned you in ${chat.name}` : `${senderName} mentioned you`,
          chat.type === ChatType.GROUP
            ? `${senderName} mentioned you in ${chat.name}: ${dto.content?.substring(0, 100)}`
            : `${senderName} mentioned you: ${dto.content?.substring(0, 100)}`,
          {
            route: '/chat',
            params: { chatId },
          },
          {
            chat_id: chatId,
            chat_name: chat.name,
            sender_id: userId,
            sender_name: senderName,
            message_id: savedMessage.id,
          },
        );
      } else {
        // Create unread message notification (only if user might be offline)
        // The gateway will handle real-time delivery for online users
        await this.notificationHelper.createNotification(
          member.user_id,
          organizationId,
          NotificationType.CHAT_UNREAD,
          chat.type === ChatType.GROUP
            ? `New message in ${chat.name}`
            : `New message from ${senderName}`,
          chat.type === ChatType.GROUP
            ? `${senderName}: ${dto.content?.substring(0, 100) || 'Sent an attachment'}`
            : dto.content?.substring(0, 100) || 'Sent an attachment',
          {
            route: '/chat',
            params: { chatId },
          },
          {
            chat_id: chatId,
            chat_name: chat.name,
            sender_id: userId,
            sender_name: senderName,
            message_id: savedMessage.id,
          },
        );
      }
    }

    return this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'attachments', 'reply_to'],
    });
  }

  /**
   * Get messages for a chat
   */
  async getMessages(
    userId: string,
    organizationId: string,
    chatId: string,
    query: MessageQueryDto,
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const chat = await this.findOne(userId, organizationId, chatId);

    // Ensure pagination defaults are applied
    const page = query.page || 1;
    const limit = query.limit || 50;

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.chat_id = :chatId', { chatId })
      .andWhere('message.deleted_at IS NULL');

    if (query.before_message_id) {
      queryBuilder.andWhere('message.created_at < (SELECT created_at FROM messages WHERE id = :beforeId)', {
        beforeId: query.before_message_id,
      });
    }

    const total = await queryBuilder.getCount();

    const messages = await queryBuilder
      .orderBy('message.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .leftJoinAndSelect('message.reply_to', 'reply_to')
      .leftJoinAndSelect('reply_to.sender', 'reply_to_sender')
      .getMany();

    // Mark as read
    const member = await this.chatMemberRepository.findOne({
      where: { chat_id: chatId, user_id: userId },
    });

    if (member) {
      member.last_read_at = new Date();
      member.unread_count = 0;
      await this.chatMemberRepository.save(member);
    }

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      page,
      limit,
    };
  }

  /**
   * Delete a message
   */
  async deleteMessage(userId: string, organizationId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['chat'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.chat.organization_id !== organizationId) {
      throw new ForbiddenException('Message does not belong to this organization');
    }

    // Only sender or chat admin/owner can delete
    const chat = await this.findOne(userId, organizationId, message.chat_id);
    const member = chat.members.find((m) => m.user_id === userId && m.status === ChatMemberStatus.ACTIVE);

    if (message.sender_id !== userId && member?.role !== ChatMemberRole.OWNER && member?.role !== ChatMemberRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    message.deleted_at = new Date();
    await this.messageRepository.save(message);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'message.deleted',
      'message',
      messageId,
      null,
      null,
    );
  }
}

