import { IsString, IsNotEmpty, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMfaLoginDto {
  @ApiProperty({ description: 'Temporary login token from initial login' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  temp_token: string;

  @ApiProperty({ description: '6-digit OTP code or backup code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 8)
  code: string;
}

