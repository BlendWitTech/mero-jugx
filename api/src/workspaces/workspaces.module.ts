import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardWorkspace } from '../database/entities/board_workspaces.entity';
import { WorkspacesController } from './controllers/workspaces.controller';
import { WorkspacesService } from './services/workspaces.service';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BoardWorkspace, OrganizationMember, Role]),
        PermissionsModule,
        AuditLogsModule
    ],
    controllers: [WorkspacesController],
    providers: [WorkspacesService],
    exports: [WorkspacesService],
})
export class WorkspacesModule { }
