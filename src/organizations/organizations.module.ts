import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { DocumentsController } from './documents.controller';
import { OrganizationsService } from './organizations.service';
import { DocumentsService } from './documents.service';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { OrganizationDocument } from '../database/entities/organization-document.entity';
import { User } from '../database/entities/user.entity';
import { Package } from '../database/entities/package.entity';
import { Role } from '../database/entities/role.entity';
import { Invitation } from '../database/entities/invitation.entity';
import { Notification } from '../database/entities/notification.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationMember,
      OrganizationDocument,
      User,
      Package,
      Role,
      Invitation,
      Notification,
    ]),
    CommonModule,
    AuditLogsModule,
  ],
  controllers: [OrganizationsController, DocumentsController],
  providers: [OrganizationsService, DocumentsService],
  exports: [OrganizationsService, DocumentsService],
})
export class OrganizationsModule {}

