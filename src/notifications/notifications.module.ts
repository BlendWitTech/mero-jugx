import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationHelperService } from './notification-helper.service';
import { Notification } from '../database/entities/notification.entity';
import { NotificationPreference } from '../database/entities/notification-preference.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreference, OrganizationMember, Role]),
    CommonModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationHelperService],
  exports: [NotificationsService, NotificationHelperService],
})
export class NotificationsModule {}
