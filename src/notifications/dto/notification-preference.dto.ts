import { IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationPreferenceScope {
  PERSONAL = 'personal',
  ORGANIZATION = 'organization',
}

export class NotificationPreferenceDto {
  @ApiPropertyOptional({
    description:
      'Scope of preferences: personal (user settings) or organization (org-level settings, only for Organization Owner)',
    enum: NotificationPreferenceScope,
    default: NotificationPreferenceScope.PERSONAL,
  })
  @IsOptional()
  @IsEnum(NotificationPreferenceScope)
  scope?: NotificationPreferenceScope;

  @ApiPropertyOptional({ description: 'Enable email notifications', default: true })
  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable in-app notifications', default: true })
  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Notification preferences by type', type: 'object' })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, { email: boolean; in_app: boolean }>;
}
