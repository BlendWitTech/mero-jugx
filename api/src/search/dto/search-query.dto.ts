import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'john',
    minLength: 1,
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results per category',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ChatSearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'meeting',
    minLength: 1,
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

