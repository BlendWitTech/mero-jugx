import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsEmail,
  IsArray,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppBillingPeriod, AppTargetAudience } from '../../database/entities/apps.entity';

export class CreateAppDto {
  @ApiProperty({ description: 'App name', example: 'Advanced Analytics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'App slug (URL-friendly identifier)',
    example: 'advanced-analytics',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({ description: 'Full app description', example: 'Comprehensive analytics solution...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Short description for listings', example: 'Powerful analytics tool' })
  @IsString()
  @IsOptional()
  short_description?: string;

  @ApiPropertyOptional({ description: 'App icon URL' })
  @IsUrl()
  @IsOptional()
  icon_url?: string;

  @ApiPropertyOptional({ description: 'App banner URL' })
  @IsUrl()
  @IsOptional()
  banner_url?: string;

  @ApiPropertyOptional({ description: 'Screenshots array', type: [String] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  screenshots?: string[];

  @ApiProperty({ description: 'App category', example: 'analytics' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'App tags', type: [String], example: ['analytics', 'reporting'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'App price', example: 99.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Billing period',
    enum: AppBillingPeriod,
    default: AppBillingPeriod.MONTHLY,
  })
  @IsEnum(AppBillingPeriod)
  billing_period: AppBillingPeriod;

  @ApiPropertyOptional({ description: 'Trial days (0 = no trial)', example: 14, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  trial_days?: number;

  @ApiPropertyOptional({ description: 'App features list', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ description: 'Required permissions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiProperty({ description: 'Developer name', example: 'Tech Solutions Inc.' })
  @IsString()
  @IsNotEmpty()
  developer_name: string;

  @ApiPropertyOptional({ description: 'Developer email' })
  @IsEmail()
  @IsOptional()
  developer_email?: string;

  @ApiPropertyOptional({ description: 'Developer website' })
  @IsUrl()
  @IsOptional()
  developer_website?: string;

  @ApiPropertyOptional({ description: 'App version', example: '1.0.0', default: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Support URL' })
  @IsUrl()
  @IsOptional()
  support_url?: string;

  @ApiPropertyOptional({ description: 'Documentation URL' })
  @IsUrl()
  @IsOptional()
  documentation_url?: string;

  @ApiPropertyOptional({ description: 'Featured app', default: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @ApiProperty({
    description: 'Target audience for the app',
    enum: AppTargetAudience,
    default: AppTargetAudience.ORGANIZATION,
    example: AppTargetAudience.ORGANIZATION,
  })
  @IsEnum(AppTargetAudience)
  @IsOptional()
  target_audience?: AppTargetAudience;
}

