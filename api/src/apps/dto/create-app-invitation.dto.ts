import { IsInt, IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppInvitationDto {
  @ApiProperty({ description: 'App ID to invite user to' })
  @IsInt()
  app_id: number;

  @ApiProperty({ description: 'User ID (organization member) to invite' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ description: 'Optional message to include with invitation' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

