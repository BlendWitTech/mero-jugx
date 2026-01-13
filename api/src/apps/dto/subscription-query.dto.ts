import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrganizationAppStatus } from '../../database/entities/organization_apps.entity';

export class SubscriptionQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by subscription status',
    enum: OrganizationAppStatus,
  })
  @IsEnum(OrganizationAppStatus)
  @IsOptional()
  status?: OrganizationAppStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

