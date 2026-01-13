import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmTax } from '@src/database/entities/crm_taxes.entity';
import { OrganizationMember } from '@src/database/entities/organization_members.entity';
import { Role } from '@src/database/entities/roles.entity';
import { TaxesController } from '../controllers/taxes.controller';
import { TaxesService } from '../services/taxes.service';
import { AuditLogsModule } from '@src/audit-logs/audit-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CrmTax,
            OrganizationMember,
            Role,
        ]),
        AuditLogsModule,
    ],
    controllers: [TaxesController],
    providers: [TaxesService],
    exports: [TaxesService],
})
export class TaxesModule { }
