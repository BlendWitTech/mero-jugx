import { IsOptional, IsArray, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleFromTemplateDto {
  @ApiProperty({ description: 'Template ID to create role from' })
  @IsNumber()
  template_id: number;

  @ApiPropertyOptional({ description: 'Additional permission IDs to add to template permissions', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  additional_permission_ids?: number[];

  // If provided, these permissions will completely replace template permissions
  // This allows organizations to fully customize permissions for their custom roles
  @ApiPropertyOptional({ description: 'Custom permission IDs to replace template permissions', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  custom_permission_ids?: number[];

  @ApiPropertyOptional({ description: 'Hierarchy level (lower number = higher authority). Must be >= 3. Owner=1, Admin=2 are fixed.', minimum: 3 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  hierarchy_level?: number;
}
