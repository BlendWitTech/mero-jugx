import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../../database/entities/tasks.entity';

export class CreateTaskDto {
    @ApiProperty({ example: 'Implement login page' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Create loading state and error handling', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: TaskStatus, default: TaskStatus.TODO })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiProperty({ example: 'uuid-of-assignee', required: false })
    @IsOptional()
    @IsUUID()
    assignee_id?: string;

    @ApiProperty({ example: '2024-12-31', required: false })
    @IsOptional()
    @IsDateString()
    due_date?: string;

    @ApiProperty({ example: 4, required: false })
    @IsOptional()
    @IsNumber()
    estimated_hours?: number;

    @ApiProperty({ example: ['frontend', 'auth'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}
