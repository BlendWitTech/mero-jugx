import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyMfaDto {
  @ApiProperty({ description: '6-digit OTP code or backup code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 8)
  code: string;

  @ApiPropertyOptional({ description: 'Organization ID (required for login flow)' })
  organization_id?: string;
}
