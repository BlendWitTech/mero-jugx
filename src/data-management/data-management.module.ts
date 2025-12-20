import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataManagementController } from './data-management.controller';
import { DataManagementService } from './data-management.service';
import { User } from '../database/entities/users.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { Invitation } from '../database/entities/invitations.entity';
import { CommonModule } from '../common/common.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OrganizationMember, Role, Invitation]),
    CommonModule,
    AuditLogsModule,
  ],
  controllers: [DataManagementController],
  providers: [DataManagementService],
  exports: [DataManagementService],
})
export class DataManagementModule {}

