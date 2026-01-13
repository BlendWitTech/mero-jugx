import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsArray, IsEnum } from 'class-validator';
import { TicketPriority } from '../../database/entities/tickets.entity';

export enum ChatSourceType {
  ORGANIZATION_CHAT = 'organization_chat',
  GROUP_CHAT = 'group_chat',
  DIRECT_CHAT = 'direct_chat',
  ADMIN_CHAT = 'admin_chat',
}

export class CreateTicketFromChatDto {
  @IsUUID()
  chat_id: string;

  @IsUUID()
  message_id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  message_excerpt?: string;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  attachment_urls?: string[];

  @IsOptional()
  priority?: TicketPriority;

  // Additional details for admin chat and organization chat
  @IsOptional()
  @IsEnum(ChatSourceType)
  chat_source_type?: ChatSourceType;

  @IsOptional()
  @IsString()
  chat_name?: string; // For group chats

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participant_ids?: string[]; // List of participant user IDs

  @IsOptional()
  @IsString()
  sender_id?: string; // ID of the message sender

  @IsOptional()
  @IsString()
  sender_name?: string; // Name of the message sender

  @IsOptional()
  @IsString()
  related_issue?: string; // Additional context about the issue

  @IsOptional()
  @IsString()
  urgency_reason?: string; // Why this is urgent (if priority is high)
}

