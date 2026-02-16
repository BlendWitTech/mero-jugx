
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { Stock } from '../entities/stock.entity';
import { WarehousesController } from '../controllers/warehouses.controller';
import { WarehousesService } from '../services/warehouses.service';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';
import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Warehouse, OrganizationMember, Role]),
        AuditLogsModule,
        CommonModule
    ],
    controllers: [WarehousesController],
    providers: [WarehousesService],
    exports: [WarehousesService],
})
export class WarehousesModule { }
