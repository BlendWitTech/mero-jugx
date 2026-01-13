import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StripeVerificationDto {
  @ApiProperty({
    description: 'Stripe checkout session ID',
    example: 'cs_test_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @ApiPropertyOptional({
    description: 'Transaction ID from our system (optional, can be retrieved from session)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
