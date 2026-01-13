import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UseWorkspaceTemplateDto {
  @ApiProperty({ description: 'Template ID to use' })
  @IsUUID()
  template_id: string;

  @ApiPropertyOptional({ description: 'Custom workspace name (overrides template name)' })
  @IsOptional()
  @IsString()
  workspace_name?: string;
}

