import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '../../../../src/database/entities/tasks.entity';

export class CreateProjectTemplateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Task status', enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'Task priority', enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Task tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  sort_order?: number;
}

export class CreateProjectTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category', default: 'custom' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Is template public', default: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ description: 'Template tasks', type: [CreateProjectTemplateTaskDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTemplateTaskDto)
  tasks?: CreateProjectTemplateTaskDto[];
}


