import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ApiKeyService } from './api-key.service';
import { WebhookService } from './webhook.service';
import { ApiKey } from '../database/entities/api-key.entity';
import { Webhook } from '../database/entities/webhook.entity';
import { Organization } from '../database/entities/organization.entity';
import { User } from '../database/entities/user.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
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

