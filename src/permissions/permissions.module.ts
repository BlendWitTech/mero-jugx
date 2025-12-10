import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TimeBasedPermissionsService } from './time-based-permissions.service';
import { CustomPermissionsService } from './custom-permissions.service';
import { Permission } from '../database/entities/permission.entity';
import { CustomPermission } from '../database/entities/custom-permission.entity';
import { TimeBasedPermission } from '../database/entities/time-based-permission.entity';
import { Role } from '../database/entities/role.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { User } from '../database/entities/user.entity';
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

