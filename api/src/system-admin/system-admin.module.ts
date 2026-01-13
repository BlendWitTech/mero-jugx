import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from '../database/entities/system_settings.entity';
import { User } from '../database/entities/users.entity';
import { Organization } from '../database/entities/organizations.entity';
import { App } from '../database/entities/apps.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { SystemAdminService } from './system-admin.service';
import { SystemAdminController } from './system-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemSetting,
      User,
      Organization,
      App,
      OrganizationMember,
    ]),
  ],
  controllers: [SystemAdminController],
  providers: [SystemAdminService],
  exports: [SystemAdminService],
})
export class SystemAdminModule {}

