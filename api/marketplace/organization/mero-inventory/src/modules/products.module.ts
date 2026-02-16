import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { ProductsController } from '../controllers/products.controller';
import { ProductsService } from '../services/products.service';
import { OrganizationMember } from '../../../../../src/database/entities/organization_members.entity';
import { Role } from '../../../../../src/database/entities/roles.entity';
import { AuditLogsModule } from '../../../../../src/audit-logs/audit-logs.module';
import { CommonModule } from '@src/common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Stock, OrganizationMember, Role]),
        AuditLogsModule,
        CommonModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule { }
