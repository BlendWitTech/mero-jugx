import { IsString, IsNotEmpty, Length, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetupMfaDto {
  @ApiProperty({ description: '6-digit OTP code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiPropertyOptional({ description: 'Temporary setup token from initialize endpoint (can also be provided via X-MFA-Setup-Token header)' })
  @IsOptional()
  @IsString()
  @IsUUID()
  temp_setup_token?: string;
}

