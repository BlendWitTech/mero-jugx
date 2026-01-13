import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminChatDto {
  @ApiPropertyOptional({ description: 'Subject/title for the chat', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({ description: 'Initial message content' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  initial_message: string;
}

