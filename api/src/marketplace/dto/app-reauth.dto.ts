import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppReauthDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  mfa_code?: string;
}

