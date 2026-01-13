import { IsString, IsOptional, IsInt, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Role slug' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Is role active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Permission IDs to assign to this role', type: [Number] })
  @IsOptional()
  @IsInt({ each: true })
  permission_ids?: number[];

  @ApiPropertyOptional({ description: 'Hierarchy level (lower number = higher authority). Must be >= 3. Owner=1, Admin=2 are fixed.', minimum: 3 })
  @IsOptional()
  @IsInt()
  hierarchy_level?: number;
}
