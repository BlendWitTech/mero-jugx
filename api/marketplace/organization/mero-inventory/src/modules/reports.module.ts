import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { Product } from '../entities/product.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { ReportsService } from '../services/reports.service';
import { ReportsController } from '../controllers/reports.controller';
import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Stock,
            StockMovement,
            Product,
            Warehouse,
            OrganizationMember,
            Role
        ]),
        AuditLogsModule,
        CommonModule,
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
