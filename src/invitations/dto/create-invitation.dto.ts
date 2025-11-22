import { IsEmail, IsString, IsInt, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address of the user to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Role ID to assign to the user' })
  @IsInt()
  role_id: number;

  @ApiPropertyOptional({ description: 'Custom invitation message' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message?: string;
}
