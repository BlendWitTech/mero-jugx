import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TimeBasedPermissionsService } from './time-based-permissions.service';
import { CustomPermissionsService } from './custom-permissions.service';
import { Permission } from '../database/entities/permissions.entity';
import { CustomPermission } from '../database/entities/custom_permissions.entity';
import { TimeBasedPermission } from '../database/entities/time_based_permissions.entity';
import { Role } from '../database/entities/roles.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      CustomPermission,
      TimeBasedPermission,
      Role,
      Organization,
      OrganizationMember,
      User,
    ]),
    CommonModule,
    AuditLogsModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, TimeBasedPermissionsService, CustomPermissionsService],
  exports: [PermissionsService, TimeBasedPermissionsService, CustomPermissionsService],
})
export class PermissionsModule {}

