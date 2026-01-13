import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EsewaVerificationDto {
  @ApiProperty({
    description: 'eSewa transaction reference ID (optional for v2 API)',
    example: 'EPAY1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  refId?: string;

  @ApiProperty({
    description: 'Transaction ID from our system',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}
