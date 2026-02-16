import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { Product } from '../entities/product.entity';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Stock)
        private stockRepository: Repository<Stock>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Warehouse)
        private warehouseRepository: Repository<Warehouse>,
    ) { }

    async getDashboardStats(organizationId: string): Promise<any> {
        const [
            totalProducts,
            totalWarehouses,
            lowStockItems,
            valuation
        ] = await Promise.all([
            this.productRepository.count({ where: { organization_id: organizationId } }),
            this.warehouseRepository.count({ where: { organization_id: organizationId } }),
            this.getLowStockAlerts(organizationId, 10).then(items => items.length),
            this.getStockValuation(organizationId).then(val => val.totalValuation)
        ]);

        return {
            totalProducts,
            totalWarehouses,
            lowStockItems,
            totalStockValue: valuation
        };
    }

    async getStockValuation(organizationId: string): Promise<any> {
        // Calculate total value of stock in each warehouse
        // This requires joining Product to get price/cost.
        // Assuming Product has a cost_price field.
        const stocks = await this.stockRepository.find({
            // Stock entity might not have orgId directly, but Warehouse does. 
            // Or if it does, it is usually organizationId. 
            // Checking Stock entity showed NO organization_id. 
            // So we must join warehouse and filter by orgId there?
            // "where: { warehouse: { organizationId } }"
            where: { warehouse: { organization_id: organizationId } },
            relations: ['product', 'warehouse'],
        });

        let totalValuation = 0;
        const warehouseValuation = {};

        for (const stock of stocks) {
            const value = stock.quantity * (stock.product['cost_price'] || 0); // Need to ensure product has cost_price
            totalValuation += value;

            if (!warehouseValuation[stock.warehouse.name]) {
                warehouseValuation[stock.warehouse.name] = 0;
            }
            warehouseValuation[stock.warehouse.name] += value;
        }

        return {
            totalValuation,
            warehouseValuation,
            breakdown: stocks.map(s => ({
                product: s.product.name,
                warehouse: s.warehouse.name,
                quantity: s.quantity,
                unitCost: s.product['cost_price'] || 0,
                totalValue: s.quantity * (s.product['cost_price'] || 0)
            }))
        };
    }

    async getLowStockAlerts(organizationId: string, threshold: number = 10): Promise<Stock[]> {
        // Simple check: quantity < threshold
        return this.stockRepository.createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('stock.warehouse', 'warehouse')
            .where('warehouse.organization_id = :orgId', { orgId: organizationId }) // Join warehouse for org check
            .andWhere('stock.quantity < :threshold', { threshold })
            .getMany();
    }

    async getStockMovementHistory(organizationId: string, limit: number = 50): Promise<StockMovement[]> {
        return this.stockMovementRepository.find({
            where: { organizationId: organizationId },
            relations: ['product', 'warehouse', 'createdBy'], // createdBy matching entity property
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}
