import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './src/modules/products.module';
import { WarehousesModule } from './src/modules/warehouses.module';
import { StockMovementsModule } from './src/modules/stock-movements.module';
import { StockAdjustmentsModule } from './src/modules/stock-adjustments.module';
import { SalesOrdersModule } from './src/modules/sales-orders.module';
import { ShipmentsModule } from './src/modules/shipments.module';
import { ReportsModule } from './src/modules/reports.module';
import { StockModule } from './src/modules/stock.module';

import { SuppliersController } from './src/controllers/suppliers.controller';
import { SuppliersService } from './src/services/suppliers.service';
import { PurchaseOrdersController } from './src/controllers/purchase-orders.controller';
import { PurchaseOrdersService } from './src/services/purchase-orders.service';
import { SalesOrdersController } from './src/controllers/sales-orders.controller';
import { SalesOrdersService } from './src/services/sales-orders.service';
import { ShipmentsController } from './src/controllers/shipments.controller';
import { ShipmentsService } from './src/services/shipments.service';
import { StockService } from './src/services/stock.service';


import { Supplier } from './src/entities/supplier.entity';
import { PurchaseOrder } from './src/entities/purchase-order.entity';
import { PurchaseOrderItem } from './src/entities/purchase-order-item.entity';
import { Stock } from './src/entities/stock.entity';
import { Product } from './src/entities/product.entity';
import { StockMovement } from './src/entities/stock-movement.entity';
import { SalesOrder } from './src/entities/sales-order.entity';
import { SalesOrderItem } from './src/entities/sales-order-item.entity';
import { Shipment } from './src/entities/shipment.entity';

import { AuditLogsModule } from '../../../src/audit-logs/audit-logs.module';
import { CommonModule } from '../../../src/common/common.module';
import { OrganizationMember } from '../../../src/database/entities/organization_members.entity';
import { Role } from '../../../src/database/entities/roles.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Supplier,
            PurchaseOrder,
            PurchaseOrderItem,
            Stock,
            Product,
            StockMovement,
            OrganizationMember,
            Role
        ]),
        AuditLogsModule,
        CommonModule,
        ProductsModule,
        WarehousesModule,
        StockMovementsModule,
        StockAdjustmentsModule,
        SalesOrdersModule,
        ShipmentsModule,
        ReportsModule,
    ],
    controllers: [
        SuppliersController,
        PurchaseOrdersController,
    ],
    providers: [
        SuppliersService,
        PurchaseOrdersService,
        StockService,
    ],
    exports: [
        SuppliersService,
        PurchaseOrdersService,
        SalesOrdersModule,
        ShipmentsModule,
        StockService
    ],
})
export class MeroInventoryModule { }
