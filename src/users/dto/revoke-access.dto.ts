import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RevokeAccessDto {
  @ApiPropertyOptional({
    description: 'User ID to transfer data to (must have same role as revoked user)',
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.transfer_data === true)
  transfer_to_user_id?: string;

  @ApiPropertyOptional({
    description: 'Whether to transfer data ownership',
    default: false,
  })
  @IsOptional()
  transfer_data?: boolean;

  @ApiPropertyOptional({
    description: 'Reason for revocation',
  })
  @IsOptional()
  reason?: string;
}

