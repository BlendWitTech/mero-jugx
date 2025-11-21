import { IsEmail, IsString, MinLength, IsOptional, IsEnum, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterOrganizationDto {
  // Organization details
  @ApiProperty({ description: 'Organization name', example: 'Acme Corporation' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Organization email', example: 'contact@acme.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Organization phone', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Organization address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Organization description' })
  @IsOptional()
  @IsString()
  description?: string;

  // Owner details (if new user)
  @ApiProperty({ description: 'Owner email (must be unique if new user)', example: 'owner@acme.com' })
  @IsEmail()
  owner_email: string;

  @ApiPropertyOptional({ description: 'Owner password (required if new user)' })
  @ValidateIf((o) => !o.is_existing_user)
  @IsString()
  @MinLength(8)
  owner_password?: string;

  @ApiPropertyOptional({ description: 'Owner first name' })
  @ValidateIf((o) => !o.is_existing_user)
  @IsString()
  @MinLength(2)
  owner_first_name?: string;

  @ApiPropertyOptional({ description: 'Owner last name' })
  @ValidateIf((o) => !o.is_existing_user)
  @IsString()
  @MinLength(2)
  owner_last_name?: string;

  @ApiPropertyOptional({ description: 'Owner phone' })
  @IsOptional()
  @IsString()
  owner_phone?: string;

  // Package selection
  @ApiPropertyOptional({ description: 'Package ID (defaults to Freemium)', example: 1 })
  @IsOptional()
  package_id?: number;

  // Flag to indicate if owner is existing user
  @ApiPropertyOptional({ description: 'Is owner an existing user?', default: false })
  @IsOptional()
  is_existing_user?: boolean;
}

