import { IsInt, IsNotEmpty, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SubscriptionPeriod {
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
  ONE_YEAR = '1_year',
  CUSTOM = 'custom',
}

export class UpgradePackageDto {
  @ApiProperty({ description: 'Package ID to upgrade to' })
  @IsInt()
  @IsNotEmpty()
  package_id: number;

  @ApiProperty({
    description: 'Subscription period',
    enum: SubscriptionPeriod,
    required: false,
    default: SubscriptionPeriod.THREE_MONTHS,
  })
  @IsEnum(SubscriptionPeriod)
  @IsOptional()
  period?: SubscriptionPeriod;

  @ApiProperty({
    description: 'Custom period in months (required if period is custom)',
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  custom_months?: number;
}
