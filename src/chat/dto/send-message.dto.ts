import { IsEnum, IsString, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../../database/entities/messages.entity';

export class MessageAttachmentDto {
  @IsString()
  file_name: string;

  @IsString()
  file_url: string;

  @IsString()
  file_type: string;

  @IsString()
  file_size: string; // Will be converted to BigInt in service

  @IsString()
  @IsOptional()
  thumbnail_url?: string;
}

export class SendMessageDto {
  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID('4')
  @IsOptional()
  reply_to_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  @IsOptional()
  attachments?: MessageAttachmentDto[];
}

