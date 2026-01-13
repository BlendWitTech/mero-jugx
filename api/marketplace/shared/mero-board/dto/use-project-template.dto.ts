import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UseProjectTemplateDto {
  @ApiProperty({ description: 'Template ID to use' })
  @IsUUID()
  template_id: string;

  @ApiPropertyOptional({ description: 'Workspace ID for the new project' })
  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @ApiPropertyOptional({ description: 'Custom project name (overrides template name)' })
  @IsOptional()
  @IsString()
  project_name?: string;
}

