import { IsInt, IsUUID, IsOptional, IsString, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppInvitationDto {
  @ApiProperty({ description: 'App ID to invite user to' })
  @IsInt()
  app_id: number;

  @ApiPropertyOptional({ description: 'User ID (organization member) to invite' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Email address to invite (for new or existing users)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Role ID for the app context' })
  @IsOptional()
  @IsInt()
  role_id?: number;

  @ApiPropertyOptional({ description: 'Optional message to include with invitation' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

