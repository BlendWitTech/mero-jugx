import { IsString, IsOptional, IsArray, IsUrl, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '../../database/entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({
    description: 'Webhook name',
    example: 'User Events Webhook',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Webhook description',
    example: 'Webhook for user-related events',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: 'Webhook endpoint URL',
    example: 'https://example.com/webhooks/mero-jugx',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Events to subscribe to',
    type: [String],
    enum: WebhookEvent,
    example: [WebhookEvent.USER_CREATED, WebhookEvent.USER_UPDATED],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({
    description: 'Webhook secret for HMAC signature (auto-generated if not provided)',
    example: 'your-secret-key',
  })
  @IsOptional()
  @IsString()
  secret?: string | null;
}

