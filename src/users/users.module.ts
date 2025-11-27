import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { Session } from '../database/entities/session.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Notification } from '../database/entities/notification.entity';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationMember, Role, Permission, Session, AuditLog, Notification]),
    JwtModule.register({}),
    ConfigModule,
    CommonModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
