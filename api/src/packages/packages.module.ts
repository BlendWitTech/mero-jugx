import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController, OrganizationPackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package } from '../database/entities/packages.entity';
import { PackageFeature } from '../database/entities/package_features.entity';
import { OrganizationPackageFeature } from '../database/entities/organization_package_features.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { Permission } from '../database/entities/permissions.entity';
import { RolePermission } from '../database/entities/role_permissions.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PackageExpirationService } from './package-expiration.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../database/entities/users.entity';

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
