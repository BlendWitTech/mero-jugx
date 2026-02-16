import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmQuote, CrmQuoteItem } from '@src/database/entities/crm_quotes.entity';
import { CrmClient } from '@src/database/entities/crm_clients.entity';
import { OrganizationMember } from '@src/database/entities/organization_members.entity';
import { Role } from '@src/database/entities/roles.entity';
import { QuotesController } from '../controllers/quotes.controller';
import { QuotesService } from '../services/quotes.service';
import { InvoicesModule } from './invoices.module';
import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CrmQuote,
            CrmQuoteItem,
            CrmClient,
            OrganizationMember,
            Role,
        ]),
        InvoicesModule,
        AuditLogsModule,
        CommonModule,
    ],
    controllers: [QuotesController],
    providers: [QuotesService],
    exports: [QuotesService],
})
export class QuotesModule { }
