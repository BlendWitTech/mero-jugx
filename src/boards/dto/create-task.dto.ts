import { IsString, IsOptional, IsUUID, MaxLength, IsDateString, IsEnum, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '../../database/entities/tasks.entity';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Project ID' })
  @IsUUID()
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Epic ID' })
  @IsUUID()
  @IsOptional()
  epic_id?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsUUID()
  @IsOptional()
  assignee_id?: string;

  @ApiPropertyOptional({ description: 'Multiple assignee user IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  assignee_ids?: string[];

  @ApiPropertyOptional({ description: 'Task priority', enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  @IsInt()
  @IsOptional()
  estimated_hours?: number;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

