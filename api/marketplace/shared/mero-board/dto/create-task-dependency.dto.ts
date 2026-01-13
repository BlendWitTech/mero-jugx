import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskDependencyType } from '../entities/task-dependency.entity';

export class CreateTaskDependencyDto {
  @ApiProperty({ description: 'ID of the task that depends on another task' })
  @IsUUID()
  depends_on_task_id: string;

  @ApiPropertyOptional({
    description: 'Type of dependency',
    enum: TaskDependencyType,
    default: TaskDependencyType.BLOCKS,
  })
  @IsOptional()
  @IsEnum(TaskDependencyType)
  dependency_type?: TaskDependencyType;
}

