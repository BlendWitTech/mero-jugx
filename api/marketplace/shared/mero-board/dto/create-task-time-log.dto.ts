import { IsDateString, IsInt, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskTimeLogDto {
  @ApiProperty({ description: 'Date when time was logged (YYYY-MM-DD)' })
  @IsDateString()
  logged_date: string;

  @ApiProperty({ description: 'Duration in minutes', minimum: 1, maximum: 1440 })
  @IsInt()
  @Min(1)
  @Max(1440)
  duration_minutes: number;

  @ApiPropertyOptional({ description: 'Description of work done' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this time is billable', default: false })
  @IsOptional()
  @IsBoolean()
  is_billable?: boolean;
}

