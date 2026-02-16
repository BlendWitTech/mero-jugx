import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { StockAdjustmentItem } from '../entities/stock-adjustment-item.entity';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';
import { AuditLogsModule } from '../../../../../src/audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';
import { StockAdjustmentsController } from '../controllers/stock-adjustments.controller';
import { StockAdjustmentsService } from '../services/stock-adjustments.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            StockAdjustment,
            StockAdjustmentItem,
            OrganizationMember,
            Role
        ]),
        AuditLogsModule,
        CommonModule
    ],
    controllers: [StockAdjustmentsController],
    providers: [StockAdjustmentsService],
    exports: [StockAdjustmentsService],
})
export class StockAdjustmentsModule { }
