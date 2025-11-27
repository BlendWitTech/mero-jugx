import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ChatMemberRole } from '../../database/entities/chat-member.entity';

export class UpdateMemberDto {
  @IsEnum(ChatMemberRole)
  @IsOptional()
  role?: ChatMemberRole;

  @IsBoolean()
  @IsOptional()
  notifications_enabled?: boolean;
}

