import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';
import { StockMovementsController } from '../controllers/stock-movements.controller';
import { StockMovementsService } from '../services/stock-movements.service';

import { AuditLogsModule } from '@audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([StockMovement, OrganizationMember, Role]),
        AuditLogsModule,
        CommonModule
    ],
    controllers: [StockMovementsController],
    providers: [StockMovementsService],
    exports: [StockMovementsService],
})
export class StockMovementsModule { }
