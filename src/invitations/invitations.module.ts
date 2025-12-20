import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { Invitation } from '../database/entities/invitations.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { Role } from '../database/entities/roles.entity';
import { EmailVerification } from '../database/entities/email_verifications.entity';
import { Notification } from '../database/entities/notifications.entity';
import { Session } from '../database/entities/sessions.entity';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invitation,
      Organization,
      OrganizationMember,
      User,
      Role,
      EmailVerification,
      Notification,
      Session,
    ]),
    CommonModule,
    NotificationsModule,
    AuditLogsModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
