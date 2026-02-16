import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from '../services/leads.service';
import { LeadsController } from '../controllers/leads.controller';
import { CrmLead } from '@src/database/entities/crm_leads.entity';
import { OrganizationMember } from '@src/database/entities/organization_members.entity';
import { Role } from '@src/database/entities/roles.entity';
import { AuditLogsModule } from '@src/audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CrmLead, OrganizationMember, Role]),
        AuditLogsModule,
        CommonModule
    ],
    controllers: [LeadsController],
    providers: [LeadsService],
    exports: [LeadsService],
})
export class LeadsModule { }
