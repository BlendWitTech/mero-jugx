import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../../../../../src/database/entities/projects.entity';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workspace ID' })
  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @ApiPropertyOptional({ description: 'Project status', enum: ProjectStatus, default: ProjectStatus.PLANNING })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Owner ID' })
  @IsOptional()
  @IsUUID()
  owner_id?: string;
}

