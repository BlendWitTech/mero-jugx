import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminChatMessageType } from '../../database/entities/admin_chat_messages.entity';

export class SendAdminChatMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ enum: AdminChatMessageType, default: AdminChatMessageType.TEXT })
  @IsEnum(AdminChatMessageType)
  @IsOptional()
  type?: AdminChatMessageType;
}

