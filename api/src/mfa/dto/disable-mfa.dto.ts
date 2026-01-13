import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisableMfaDto {
  @ApiProperty({ description: '6-digit OTP code or backup code to confirm disable' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 8)
  code: string;
}
