import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { Role } from '../database/entities/roles.entity';
import { Invitation } from '../database/entities/invitations.entity';
import { AuditLog } from '../database/entities/audit_logs.entity';
import { Notification } from '../database/entities/notifications.entity';
import { Chat } from '../database/entities/chats.entity';
import { Message } from '../database/entities/messages.entity';
import { Payment } from '../database/entities/payments.entity';
import { CommonModule } from '../common/common.module';
import { CacheService } from '../common/services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationMember,
      User,
      Role,
      Invitation,
      AuditLog,
      Notification,
      Chat,
      Message,
      Payment,
    ]),
    CommonModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

