import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TimeRangePreset {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_YEAR = '1y',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    enum: TimeRangePreset,
    description: 'Time range preset',
    default: TimeRangePreset.LAST_30_DAYS,
  })
  @IsOptional()
  @IsEnum(TimeRangePreset)
  preset?: TimeRangePreset = TimeRangePreset.LAST_30_DAYS;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601 format). Required if preset is CUSTOM',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601 format). Required if preset is CUSTOM',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

