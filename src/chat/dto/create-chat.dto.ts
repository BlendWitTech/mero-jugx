import { IsEnum, IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ChatType } from '../../database/entities/chat.entity';

export class CreateChatDto {
  @IsEnum(ChatType)
  type: ChatType;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  member_ids: string[]; // User IDs to add to the chat
}

