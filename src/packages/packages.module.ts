import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController, OrganizationPackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package } from '../database/entities/package.entity';
import { PackageFeature } from '../database/entities/package-feature.entity';
import { OrganizationPackageFeature } from '../database/entities/organization-package-feature.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { RolePermission } from '../database/entities/role-permission.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PackageExpirationService } from './package-expiration.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Package,
      PackageFeature,
      OrganizationPackageFeature,
      Organization,
      OrganizationMember,
      Role,
      Permission,
      RolePermission,
      User,
    ]),
    CommonModule,
    AuditLogsModule,
    NotificationsModule,
  ],
  controllers: [PackagesController, OrganizationPackagesController],
  providers: [PackagesService, PackageExpirationService],
  exports: [PackagesService],
})
export class PackagesModule {}
