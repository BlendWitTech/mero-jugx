import { IsEnum, IsNumber, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, PaymentGateway } from '../../database/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment gateway',
    enum: PaymentGateway,
    example: PaymentGateway.ESEWA,
  })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.PACKAGE_UPGRADE,
  })
  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @ApiProperty({
    description: 'Payment amount',
    example: 1000.00,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Amount must be a valid number' })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Upgrade to Premium Package',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Package ID if payment is for package upgrade',
    example: '1',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsInt({ message: 'Package ID must be an integer' })
  package_id?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { feature: 'premium_features' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

