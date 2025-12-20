import { IsEnum, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminChatStatus } from '../../database/entities/admin_chats.entity';

export class AdminChatQueryDto {
  @ApiPropertyOptional({ enum: AdminChatStatus })
  @IsEnum(AdminChatStatus)
  @IsOptional()
  status?: AdminChatStatus;

  @ApiPropertyOptional({ description: 'Search in subject or messages' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

