import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { SmsService } from './sms.service';
import { PushNotificationService } from './push-notification.service';
import { EmailTemplateService } from './email-template.service';
import { User } from '../database/entities/users.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationMember, Role]),
    HttpModule,
    CommonModule,
    AuditLogsModule,
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, SmsService, PushNotificationService, EmailTemplateService],
  exports: [SmsService, PushNotificationService, EmailTemplateService],
})
export class CommunicationModule {}

