import { IsEmail, IsString, IsNotEmpty, Length, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWithMfaDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6-digit OTP code or backup code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 8)
  code: string;

  @ApiProperty({ description: 'Organization ID (optional, required if user belongs to multiple organizations)', required: false })
  @IsOptional()
  @IsUUID()
  organization_id?: string;
}

