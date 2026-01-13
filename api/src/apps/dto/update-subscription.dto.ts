import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppBillingPeriod } from '../../database/entities/apps.entity';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Auto-renew subscription', default: true })
  @IsBoolean()
  @IsOptional()
  auto_renew?: boolean;

  @ApiPropertyOptional({
    description: 'Renew now using specified payment method (optional)',
    enum: ['stripe', 'esewa'],
  })
  @IsOptional()
  payment_method?: 'stripe' | 'esewa';

  @ApiPropertyOptional({
    description: 'Change billing period (upgrade/downgrade)',
    enum: AppBillingPeriod,
  })
  @IsEnum(AppBillingPeriod)
  @IsOptional()
  billing_period?: AppBillingPeriod;
}

