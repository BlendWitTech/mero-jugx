import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from '../entities/shipment.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { ShipmentsService } from '../services/shipments.service';
import { ShipmentsController } from '../controllers/shipments.controller';
import { StockModule } from './stock.module';
import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Shipment,
            SalesOrder,
            OrganizationMember,
            Role
        ]),
        StockModule,
        AuditLogsModule,
        CommonModule,
    ],
    controllers: [ShipmentsController],
    providers: [ShipmentsService],
    exports: [ShipmentsService],
})
export class ShipmentsModule { }
