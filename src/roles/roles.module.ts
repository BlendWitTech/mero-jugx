import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { UserRolesController } from './user-roles.controller';
import { RoleTemplatesController } from './role-templates.controller';
import { RolesService } from './roles.service';
import { RoleTemplatesService } from './role-templates.service';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { RolePermission } from '../database/entities/role-permission.entity';
import { RoleTemplate } from '../database/entities/role-template.entity';
import { RoleTemplatePermission } from '../database/entities/role-template-permission.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Notification } from '../database/entities/notification.entity';
import { Package } from '../database/entities/package.entity';
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
