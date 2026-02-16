import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmSetting } from '@src/database/entities/crm_settings.entity';
import { OrganizationMember } from '@src/database/entities/organization_members.entity';
import { Role } from '@src/database/entities/roles.entity';
import { CrmSettingsController } from '../controllers/settings.controller';
import { CrmSettingsService } from '../services/settings.service';
import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CrmSetting,
            OrganizationMember,
            Role,
        ]),
        AuditLogsModule,
        CommonModule,
    ],
    controllers: [CrmSettingsController],
    providers: [CrmSettingsService],
    exports: [CrmSettingsService],
})
export class CrmSettingsModule { }
