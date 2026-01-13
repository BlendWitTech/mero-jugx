import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmPayment } from '@src/database/entities/crm_payments.entity';
import { OrganizationMember } from '@src/database/entities/organization_members.entity';
import { Role } from '@src/database/entities/roles.entity';
import { AuditLogsModule } from '@src/audit-logs/audit-logs.module';
import { PaymentsController } from '../controllers/payments.controller';
import { PaymentsService } from '../services/payments.service';
import { InvoicesModule } from './invoices.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CrmPayment, OrganizationMember, Role]),
        InvoicesModule, // Import to access InvoicesService
        AuditLogsModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }
