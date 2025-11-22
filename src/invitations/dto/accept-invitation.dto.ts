import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiPropertyOptional({ description: 'First name (required for new users)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ description: 'Last name (required for new users)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ description: 'Password (required for new users)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}
