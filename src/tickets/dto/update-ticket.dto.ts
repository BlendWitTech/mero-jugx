import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../database/entities/tickets.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  attachment_urls?: string[];

  // Time tracking fields
  @IsOptional()
  estimated_time_minutes?: number; // Estimated time to complete in minutes

  @IsOptional()
  actual_time_minutes?: number; // Actual time taken in minutes

  @IsOptional()
  due_date?: Date | string; // Expected completion date

  @IsOptional()
  completed_at?: Date | string; // Actual completion date

  @IsOptional()
  additional_time_requested_minutes?: number; // Additional time requested in minutes

  @IsOptional()
  @IsUUID()
  transferred_to_user_id?: string; // User to transfer ticket to
}

