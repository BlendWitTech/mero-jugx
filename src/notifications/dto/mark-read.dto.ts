import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiPropertyOptional({ description: 'Mark as read (true) or unread (false)', default: true })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

