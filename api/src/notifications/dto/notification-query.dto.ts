import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationReadStatus {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread',
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by read status', enum: NotificationReadStatus })
  @IsOptional()
  @IsEnum(NotificationReadStatus)
  read_status?: NotificationReadStatus;

  @ApiPropertyOptional({ description: 'Filter by notification type' })
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by organization ID' })
  @IsOptional()
  organization_id?: string;
}
