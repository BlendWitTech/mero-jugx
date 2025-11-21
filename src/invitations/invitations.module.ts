import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { Invitation } from '../database/entities/invitation.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { EmailVerification } from '../database/entities/email-verification.entity';
import { Notification } from '../database/entities/notification.entity';
import { Session } from '../database/entities/session.entity';
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

