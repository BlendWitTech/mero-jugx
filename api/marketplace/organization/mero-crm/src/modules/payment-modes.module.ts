import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmPaymentMode } from '@src/database/entities/crm_payment_modes.entity';
import { OrganizationMember } from '@src/database/entities/organization_members.entity';
import { Role } from '@src/database/entities/roles.entity';
import { PaymentModesController } from '../controllers/payment-modes.controller';
import { PaymentModesService } from '../services/payment-modes.service';
import { AuditLogsModule } from '@src/audit-logs/audit-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CrmPaymentMode,
            OrganizationMember,
            Role,
        ]),
        AuditLogsModule,
    ],
    controllers: [PaymentModesController],
    providers: [PaymentModesService],
    exports: [PaymentModesService],
})
export class PaymentModesModule { }
