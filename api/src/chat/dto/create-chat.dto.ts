import { IsEnum, IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChatType } from '../../database/entities/chats.entity';

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
  @IsOptional()
  @Transform(({ value }) => {
    // Transform empty array, null, or undefined to undefined
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }
    // Ensure it's an array
    return Array.isArray(value) ? value : undefined;
  })
  member_ids?: string[]; // User IDs to add to the chat (optional for group chats)
}

