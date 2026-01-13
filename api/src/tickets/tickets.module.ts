import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from '../database/entities/tickets.entity';
import { TicketComment } from '../database/entities/ticket_comments.entity';
import { TicketActivity } from '../database/entities/ticket_activities.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Chat } from '../database/entities/chats.entity';
import { Message } from '../database/entities/messages.entity';
import { User } from '../database/entities/users.entity';
import { App } from '../database/entities/apps.entity';
import { OrganizationApp } from '../database/entities/organization_apps.entity';
import { UserAppAccess } from '../database/entities/user_app_access.entity';
import { Organization } from '../database/entities/organizations.entity';
import { PackageFeature } from '../database/entities/package_features.entity';
import { OrganizationPackageFeature, OrganizationPackageFeatureStatus } from '../database/entities/organization_package_features.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketComment,
      TicketActivity,
      OrganizationMember,
      Chat,
      Message,
      User,
      App,
      OrganizationApp,
      UserAppAccess,
      Organization,
      PackageFeature,
      OrganizationPackageFeature,
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}

