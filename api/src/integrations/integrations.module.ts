import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ApiKeyService } from './api-key.service';
import { WebhookService } from './webhook.service';
import { ApiKey } from '../database/entities/api_keys.entity';
import { Webhook } from '../database/entities/webhooks.entity';
import { Organization } from '../database/entities/organizations.entity';
import { User } from '../database/entities/users.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, Webhook, Organization, User, OrganizationMember, Role]),
    HttpModule,
    CommonModule,
    AuditLogsModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, ApiKeyService, WebhookService],
  exports: [ApiKeyService, WebhookService],
})
export class IntegrationsModule {}

