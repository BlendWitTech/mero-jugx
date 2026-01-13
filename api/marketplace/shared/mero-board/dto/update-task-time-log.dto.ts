import { IsDateString, IsInt, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskTimeLogDto {
  @ApiPropertyOptional({ description: 'Date when time was logged (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  logged_date?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', minimum: 1, maximum: 1440 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Description of work done' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this time is billable' })
  @IsOptional()
  @IsBoolean()
  is_billable?: boolean;
}

