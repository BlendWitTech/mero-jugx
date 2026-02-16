import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';

@Injectable()
export class StockMovementsService {
    constructor(
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
    ) { }

    async findAll(organizationId: string, query: any): Promise<StockMovement[]> {
        const { productId, warehouseId, type } = query;
        const qb = this.stockMovementRepository.createQueryBuilder('movement')
            .where('movement.organization_id = :organizationId', { organizationId })
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.warehouse', 'warehouse')
            .leftJoinAndSelect('movement.createdBy', 'createdBy')
            .orderBy('movement.created_at', 'DESC');

        if (productId) {
            qb.andWhere('movement.product_id = :productId', { productId });
        }

        if (warehouseId) {
            qb.andWhere('movement.warehouse_id = :warehouseId', { warehouseId });
        }

        if (type) {
            qb.andWhere('movement.type = :type', { type });
        }

        return qb.getMany();
    }

    async create(data: Partial<StockMovement>): Promise<StockMovement> {
        const movement = this.stockMovementRepository.create(data);
        return this.stockMovementRepository.save(movement);
    }
}
