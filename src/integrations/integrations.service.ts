import { Injectable } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { WebhookService } from './webhook.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
  ) {}
}

