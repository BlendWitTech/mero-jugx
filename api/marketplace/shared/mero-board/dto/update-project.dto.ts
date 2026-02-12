import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../../../src/database/entities/projects.entity';

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project status', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Owner ID' })
  @IsOptional()
  @IsUUID()
  owner_id?: string;
}


