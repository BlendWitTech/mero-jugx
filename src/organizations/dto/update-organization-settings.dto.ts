import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationSettingsDto {
  @ApiPropertyOptional({ description: 'Enable/disable 2FA/MFA for organization' })
  @IsOptional()
  @IsBoolean()
  mfa_enabled?: boolean;
}

