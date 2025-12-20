import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '../../database/entities/tasks.entity';

export class CreateTaskFromTicketDto {
  @ApiProperty({ description: 'Ticket ID to create task from' })
  @IsUUID()
  ticket_id: string;

  @ApiPropertyOptional({ description: 'Project ID to add task to' })
  @IsUUID()
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Epic ID to add task to' })
  @IsUUID()
  @IsOptional()
  epic_id?: string;

  @ApiPropertyOptional({ description: 'Board ID to add task to' })
  @IsUUID()
  @IsOptional()
  board_id?: string;

  @ApiPropertyOptional({ description: 'Task priority', enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}

