import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWorkspaceTemplateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Project template ID for explicit matching' })
  @IsOptional()
  @IsString()
  project_template_id?: string;
}

export class CreateWorkspaceTemplateDto {
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

  @ApiPropertyOptional({ description: 'Template projects', type: [CreateWorkspaceTemplateProjectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkspaceTemplateProjectDto)
  projects?: CreateWorkspaceTemplateProjectDto[];
}

