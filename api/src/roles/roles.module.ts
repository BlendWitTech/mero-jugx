import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { UserRolesController } from './user-roles.controller';
import { RoleTemplatesController } from './role-templates.controller';
import { RolesService } from './roles.service';
import { RoleTemplatesService } from './role-templates.service';
import { Role } from '../database/entities/roles.entity';
import { Permission } from '../database/entities/permissions.entity';
import { RolePermission } from '../database/entities/role_permissions.entity';
import { RoleTemplate } from '../database/entities/role_templates.entity';
import { RoleTemplatePermission } from '../database/entities/role_template_permissions.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Notification } from '../database/entities/notifications.entity';
import { Package } from '../database/entities/packages.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      RoleTemplate,
      RoleTemplatePermission,
      Organization,
      OrganizationMember,
      Notification,
      Package,
    ]),
    CommonModule,
  ],
  controllers: [RolesController, UserRolesController, RoleTemplatesController],
  providers: [RolesService, RoleTemplatesService],
  exports: [RolesService, RoleTemplatesService],
})
export class RolesModule {}
