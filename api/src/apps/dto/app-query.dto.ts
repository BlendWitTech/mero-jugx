import { IsOptional, IsString, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AppStatus, AppTargetAudience } from '../../database/entities/apps.entity';

export class AppQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: AppStatus })
  @IsEnum(AppStatus)
  @IsOptional()
  status?: AppStatus;

  @ApiPropertyOptional({ description: 'Filter featured apps' })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  is_featured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by target audience',
    enum: AppTargetAudience,
  })
  @IsEnum(AppTargetAudience)
  @IsOptional()
  target_audience?: AppTargetAudience;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

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

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'price', 'created_at', 'subscription_count', 'rating'],
    default: 'created_at',
  })
  @IsEnum(['name', 'price', 'created_at', 'subscription_count', 'rating'])
  @IsOptional()
  sort?: 'name' | 'price' | 'created_at' | 'subscription_count' | 'rating';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc';
}

