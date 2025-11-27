import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateChatDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;
}

