import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsArray } from 'class-validator';
import { TicketPriority, TicketSource } from '../../database/entities/tickets.entity';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketSource)
  source?: TicketSource;

  @IsOptional()
  @IsUUID()
  chat_id?: string;

  @IsOptional()
  @IsUUID()
  message_id?: string;

  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachment_urls?: string[];

  // Time tracking fields
  @IsOptional()
  estimated_time_minutes?: number; // Estimated time to complete in minutes

  @IsOptional()
  due_date?: Date | string; // Expected completion date
}

