import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatType, ChatStatus } from '../../database/entities/chats.entity';

export class ChatQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ChatType)
  type?: ChatType;

  @IsOptional()
  @IsEnum(ChatStatus)
  status?: ChatStatus;

  @IsOptional()
  search?: string;
}

