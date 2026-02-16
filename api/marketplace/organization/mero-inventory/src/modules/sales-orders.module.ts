import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { SalesOrdersService } from '../services/sales-orders.service';
import { SalesOrdersController } from '../controllers/sales-orders.controller';
import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SalesOrder,
            SalesOrderItem,
            OrganizationMember,
            Role
        ]),
        AuditLogsModule,
        CommonModule
    ],
    controllers: [SalesOrdersController],
    providers: [SalesOrdersService],
    exports: [SalesOrdersService],
})
export class SalesOrdersModule { }
