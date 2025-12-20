import { IsString, IsOptional, IsArray, IsUrl, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookStatus, WebhookEvent } from '../../database/entities/webhooks.entity';

export class UpdateWebhookDto {
  @ApiPropertyOptional({
    description: 'Webhook name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Webhook description',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Webhook endpoint URL',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'Events to subscribe to',
    type: [String],
    enum: WebhookEvent,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional({
    description: 'Webhook status',
    enum: WebhookStatus,
  })
  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;

  @ApiPropertyOptional({
    description: 'Webhook secret for HMAC signature',
  })
  @IsOptional()
  @IsString()
  secret?: string | null;
}

