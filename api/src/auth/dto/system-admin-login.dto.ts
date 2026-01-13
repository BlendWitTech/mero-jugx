import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SystemAdminLoginDto {
  @ApiProperty({ description: 'System admin email', example: 'superadmin@merojugx.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'System admin password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

