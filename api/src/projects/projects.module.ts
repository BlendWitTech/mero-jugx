import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardProject } from '../database/entities/board_projects.entity';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsService } from './services/projects.service';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BoardProject, OrganizationMember, Role]),
        PermissionsModule,
        AuditLogsModule
    ],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule { }
